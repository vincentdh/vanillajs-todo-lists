import AxeBuilder from '@axe-core/playwright'
import { test, expect } from '@playwright/test'

import {
  clearAllStorage,
  setupTestListWithItems,
} from '../helpers/test-data.js'

const LIST_ID = '123e4567-e89b-12d3-a456-426614174000'

// Fixed data so the number of focusable elements is the same on every run
const FIXED_ITEMS = [
  { id: 'fixed-item-1', description: 'Fixed task one', completed: false },
  { id: 'fixed-item-2', description: 'Fixed task two', completed: true },
]

/** Runs axe against the page with a single rule enabled. */
const checkRule = async (page, rule) => {
  const results = await new AxeBuilder({ page }).withRules([rule]).analyze()
  expect(
    results.violations,
    JSON.stringify(results.violations, null, 2),
  ).toEqual([])
}

const addItem = async (page, description) => {
  await page.getByRole('textbox').fill(description)
  await page.keyboard.press('Enter')
  await expect(page.getByText(description, { exact: true })).toBeVisible()
}

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearAllStorage(page)
    await setupTestListWithItems(page, LIST_ID, 'Test List', FIXED_ITEMS)
    await page.reload()
    await page.locator('nav-lists li', { hasText: 'Test List' }).click()
    await expect(page.getByRole('textbox')).toBeVisible()
  })

  test('has proper heading hierarchy', async ({ page }) => {
    const levels = await page
      .getByRole('heading')
      .evaluateAll((els) =>
        els.map((el) =>
          Number(el.getAttribute('aria-level') ?? el.tagName.slice(1)),
        ),
      )

    expect(levels.length).toBeGreaterThan(0)
    // Exactly one top-level heading, and no skipped levels (h1 -> h3 is a failure)
    expect(levels.filter((level) => level === 1)).toHaveLength(1)
    for (let i = 1; i < levels.length; i++) {
      expect(
        levels[i] - levels[i - 1],
        `heading levels: ${levels}`,
      ).toBeLessThanOrEqual(1)
    }
  })

  test('has accessible button components', async ({ page }) => {
    await expect(page.getByRole('button').first()).toBeVisible()

    // Every button must have an accessible name (text, aria-label or title)
    await checkRule(page, 'button-name')
  })

  test('does not nest interactive controls inside other controls', async ({
    page,
  }) => {
    // A focusable/role=button host must not contain another interactive element
    await checkRule(page, 'nested-interactive')
  })

  test('supports keyboard navigation', async ({ page }) => {
    // BUTTON-CUSTOM is the app's own button element (role="button", tabindex=0)
    const interactiveTags = [
      'BUTTON',
      'BUTTON-CUSTOM',
      'A',
      'INPUT',
      'SELECT',
      'TEXTAREA',
    ]

    // Selecting a list can leave the tab position inside the list view in some browsers
    // (blur() does not reset it), so click a blank spot at the top-left to start from the top
    await page.mouse.click(1, 1)

    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
      // Focus can sit inside shadow roots, so walk down to the real focused element
      const focus = await page.evaluate(() => {
        let el = document.activeElement
        while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement
        const moved = el !== window.__lastFocus
        window.__lastFocus = el
        return { tag: el?.tagName ?? null, moved }
      })

      // Focus must land on an interactive element...
      expect(interactiveTags, `tab stop ${i + 1} is ${focus.tag}`).toContain(
        focus.tag,
      )
      // ...and must move on every Tab press (no stuck focus)
      expect(focus.moved, `focus did not move on tab ${i + 1}`).toBe(true)
    }
  })

  test('allows adding an item with the keyboard', async ({ page }) => {
    await page.getByRole('textbox').focus()
    await page.keyboard.type('Keyboard submit check')
    await page.keyboard.press('Enter')

    // The item must actually be created, not just the page staying visible
    await expect(
      page.getByText('Keyboard submit check', { exact: true }),
    ).toBeVisible()
    await expect(page.getByRole('textbox')).toHaveValue('')
  })

  test('has proper color contrast', async ({ page }) => {
    // axe computes the rendered foreground/background colors and checks WCAG 2 AA ratios
    const results = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze()

    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2),
    ).toEqual([])
  })

  test('changes the appearance of each focused element', async ({ page }) => {
    // Any visible change counts (outline, shadow, background, icon glow), so
    // compare the pixels with and without focus instead of checking one CSS property
    const MARGIN = 8 // focus rings can sit slightly outside the element box
    const MAX_TABS = 50 // safety limit if the cycle never returns to the first element
    const unindicated = []
    let wrapped = false

    // Marks the focused element (piercing shadow roots). Returns `body` when focus is
    // on the document itself (not a control), and `repeated` once Tab cycles back
    // to an element already checked.
    const markFocused = () =>
      page.evaluate(() => {
        let el = document.activeElement
        while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement
        // Only one marker at a time; the previous element may be inside a shadow root
        window.__focusProbe?.removeAttribute('data-focus-probe')
        window.__focusProbe = el
        if (!el || el === document.body) return { body: true }

        const seen = (window.__focusSeen ??= new Set())
        const repeated = seen.has(el)
        seen.add(el)
        el.setAttribute('data-focus-probe', '')
        return {
          body: false,
          repeated,
          label: `${el.tagName} "${el.getAttribute('aria-label') ?? el.textContent.trim().slice(0, 30)}"`,
        }
      })

    const snapshot = async () => {
      const box = await page.locator('[data-focus-probe]').boundingBox()
      return page.screenshot({
        animations: 'disabled',
        clip: {
          x: Math.max(0, box.x - MARGIN),
          y: Math.max(0, box.y - MARGIN),
          width: box.width + MARGIN * 2,
          height: box.height + MARGIN * 2,
        },
      })
    }

    for (let i = 0; i < MAX_TABS && !wrapped; i++) {
      await page.keyboard.press('Tab')
      const stop = await markFocused()

      // Focus left the page: not a control, and the next Tab starts over from the top
      if (stop.body) continue

      // Tab came back to an element already checked: the whole cycle has been covered
      if (stop.repeated) {
        wrapped = true
        break
      }

      const focused = await snapshot()

      await page.locator('[data-focus-probe]').evaluate((el) => {
        el.blur()
      })
      const unfocused = await snapshot()

      if (focused.equals(unfocused)) unindicated.push(stop.label)

      // Restore focus so the next Tab continues from this element
      await page.locator('[data-focus-probe]').focus()
    }

    expect(wrapped, `focus did not cycle back within ${MAX_TABS} tabs`).toBe(
      true,
    )
    expect(
      unindicated,
      'focused elements whose appearance does not change on focus',
    ).toEqual([])
  })

  test('disables item animations when reduced motion is requested', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await addItem(page, 'Motion check')

    const item = page.locator('#items > div', { hasText: 'Motion check' })
    const style = await item.evaluate((el) => {
      const s = window.getComputedStyle(el)
      return { animationName: s.animationName, opacity: s.opacity }
    })

    expect(style.animationName).toBe('none')
    expect(style.opacity).toBe('1')
  })

  test('has proper semantic structure', async ({ page }) => {
    await expect(page.getByRole('banner')).toHaveCount(1)
    await expect(page.getByRole('navigation')).toHaveCount(1)
    await expect(page.getByRole('main')).toHaveCount(1)

    // Screen readers use the lang attribute to pick a voice and pronunciation
    await expect(page.locator('html')).toHaveAttribute('lang', /.+/)
  })

  test('keeps keyboard focus inside an open modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Create New List' }).first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Tab well past the number of focusable stops in the dialog
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab')
      const insideDialog = await page.evaluate(() => {
        let el = document.activeElement
        while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement
        for (let n = el; n; n = n.parentNode ?? n.host) {
          if (n.getAttribute?.('role') === 'dialog') return true
        }
        return false
      })
      expect(insideDialog, `focus escaped the dialog on tab ${i + 1}`).toBe(
        true,
      )
    }
  })

  test('closes an open modal with Escape', async ({ page }) => {
    await page.getByRole('button', { name: 'Create New List' }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.locator('.modal-host')).toHaveCount(0)
  })

  test('provides alternative text for images', async ({ page }) => {
    await checkRule(page, 'image-alt')
  })
})
