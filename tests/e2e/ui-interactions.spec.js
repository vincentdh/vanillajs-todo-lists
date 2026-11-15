import { test, expect } from '@playwright/test'

import {
  clearAllStorage,
  setupTestListWithItems,
} from '../helpers/test-data.js'

test.describe('UI Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    if (await page.getByRole('heading', { name: 'Welcome' }).isVisible()) {
      await page.getByRole('button', { name: 'Yes, thanks' }).click()
    }
  })

  test('displays header', async ({ page }) => {
    const header = await page.locator('app-header')
    await expect(header).toBeVisible()
  })

  test('displays main app container', async ({ page }) => {
    const main = await page.locator('app-main')
    await expect(main).toBeVisible()
  })

  test('displays navigation lists section', async ({ page }) => {
    const nav = await page
      .getByRole('navigation', { name: 'Lists' })
      .locator('#content')
    await expect(nav).toBeVisible()
  })

  test('displays list view section', async ({ page }) => {
    const listView = await page.locator('list-view')
    await expect(listView).toBeVisible()
  })

  test('shows the welcome dialog when there are no lists', async ({ page }) => {
    // beforeEach dismisses the dialog, so start again from empty storage
    await clearAllStorage(page)
    await page.reload()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('heading', { name: 'Welcome' })).toBeVisible()
    await expect(dialog).toContainText('generate random data')
  })

  test('closes the welcome dialog when declining it', async ({ page }) => {
    await clearAllStorage(page)
    await page.reload()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await page
      .getByRole('button', { name: "It's fine, I'll create a list myself" })
      .click()

    await expect(dialog).toHaveCount(0)
    await expect(page.locator('nav-lists li')).toHaveCount(0)
  })

  test('moves focus to an interactive element on Tab', async ({ page }) => {
    // Fixed data, then start from the top of the document so the first Tab is the same in every browser
    await clearAllStorage(page)
    await setupTestListWithItems(page, 'focus-list', 'Test List', [])
    await page.reload()
    await page.locator('nav-lists li', { hasText: 'Test List' }).click()
    await expect(page.getByRole('textbox')).toBeVisible()

    await page.mouse.click(1, 1)
    await page.keyboard.press('Tab')

    // Focus can sit inside shadow roots, so walk down to the real focused element
    const focused = await page.evaluate(() => {
      let el = document.activeElement
      while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement
      return el?.tagName ?? null
    })

    expect(['BUTTON', 'BUTTON-CUSTOM', 'A', 'INPUT']).toContain(focused)
  })

  test('keeps one shadow root and one stylesheet when a custom button is moved', async ({
    page,
  }) => {
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))

    const state = await page.evaluate(async () => {
      const button = document.createElement('button-custom')
      button.textContent = 'Move me'
      document.body.appendChild(button)

      // Moving an element disconnects and reconnects it
      const holder = document.createElement('div')
      document.body.appendChild(holder)
      holder.appendChild(button)
      await new Promise((resolve) => setTimeout(resolve, 50))

      return {
        connected: button.isConnected,
        adoptedStyleSheets: button.shadowRoot.adoptedStyleSheets.length,
        renderedChildren: button.shadowRoot.children.length,
      }
    })

    expect(errors, 'page errors while moving a custom button').toEqual([])
    expect(state.connected).toBe(true)
    expect(state.adoptedStyleSheets).toBe(1)
    expect(state.renderedChildren).toBe(1)
  })
})
