import { test, expect } from '@playwright/test'

// Attribute values covered by the matrix. Keep in sync with BUTTON_VARIANTS and ICON_NAMES
const VARIANTS = ['default', 'accent', 'info', 'warn', 'danger', 'ghost']
const ICONS = [null, 'square']
const LABEL = 'Label'

/** Replaces the stage content with one <button-custom> built from the given attributes. */
const renderButton = (page, attrs = {}, label = LABEL) =>
  page.evaluate(
    ({ attrs, label }) => {
      const stage = document.getElementById('stage')
      stage.replaceChildren()
      const el = document.createElement('button-custom')
      for (const [name, value] of Object.entries(attrs))
        el.setAttribute(name, value)
      el.textContent = label
      stage.appendChild(el)
    },
    { attrs, label },
  )

/** Host element of the button under test. Its rendered parts live in its shadow root. */
const host = (page) => page.locator('#stage button-custom')

/**
 * Inner element of the button: the <span>, or the <a> in link mode, that the
 * stylesheet paints. It is found by its structure (it holds the label span and
 * its slot), because the component gives it no class to select on.
 */
const inner = (page) => host(page).locator(':has(> span > slot)')

/**
 * Renders a button inside a form and counts the form's submit and reset events.
 * The form holds one text input, named "task", whose default value is "initial".
 */
const renderForm = (page, attrs = {}, { required = false } = {}) =>
  page.evaluate(
    ({ attrs, required }) => {
      window.submits = 0
      window.resets = 0
      const stage = document.getElementById('stage')
      stage.replaceChildren()
      const form = document.createElement('form')
      form.id = 'form'
      form.addEventListener('submit', (event) => {
        event.preventDefault()
        window.submits++
      })
      form.addEventListener('reset', () => window.resets++)
      const input = document.createElement('input')
      input.name = 'task'
      if (required) input.required = true
      else input.setAttribute('value', 'initial')
      const button = document.createElement('button-custom')
      for (const [name, value] of Object.entries(attrs))
        button.setAttribute(name, value)
      button.textContent = 'Send'
      form.append(input, button)
      stage.appendChild(form)
    },
    { attrs, required },
  )

/** Renders a submit button inside a form and counts the form's submit events. */
const renderSubmitForm = (page, { disabled = false } = {}) =>
  renderForm(
    page,
    disabled ? { type: 'submit', disabled: '' } : { type: 'submit' },
  )

/** Replaces the stage content with parsed HTML, as a page author would write it. */
const renderHTML = (page, html) =>
  page.evaluate((html) => {
    document.getElementById('stage').innerHTML = html
  }, html)

/** Reads a counter that a test stored on the window object. */
const counter = (page, name) => page.evaluate((name) => window[name], name)

/** Counts the click events that reach the listeners of the button under test. */
const countClicks = (page) =>
  host(page).evaluate((el) => {
    window.clicks = 0
    el.addEventListener('click', () => window.clicks++)
  })

/**
 * Colors each variant must give the button, written with the theme variables
 * that the harness page defines. A null text color means the variant sets
 * none, so the button inherits the one of the page.
 */
const VARIANT_COLORS = {
  default: { background: 'var(--background-color)', text: null },
  accent: { background: 'var(--accent)', text: 'black' },
  info: { background: 'var(--info-bg)', text: 'var(--info-fg)' },
  warn: { background: 'var(--warn-bg)', text: 'var(--warn-fg)' },
  danger: { background: 'var(--danger-bg)', text: 'var(--danger-fg)' },
  ghost: { background: 'transparent', text: null },
}

/**
 * Resolves the colors of a variant in the harness page, on a probe element,
 * because browsers report computed colors in rgb() form.
 */
const resolveVariantColors = (page, variant) =>
  page.evaluate(({ background, text }) => {
    const probe = document.createElement('div')
    probe.style.backgroundColor = background
    if (text) probe.style.color = text
    document.body.appendChild(probe)
    const style = getComputedStyle(probe)
    const resolved = { background: style.backgroundColor, text: style.color }
    probe.remove()
    return resolved
  }, VARIANT_COLORS[variant])

/**
 * Reads how the button looks, from the computed styles of its rendered parts:
 * colors, border and width limit of the inner element, whether the label is
 * displayed, and which icon is shown. Returns null before the first render.
 */
const readAppearance = (page) =>
  host(page).evaluate((el) => {
    // The inner element is the only child of the shadow root
    const inner = el.shadowRoot.firstElementChild
    if (inner === null) return null
    const style = getComputedStyle(inner)
    const slot = el.shadowRoot.querySelector('slot')
    const icon = el.shadowRoot.querySelector('svg-icon')
    return {
      background: style.backgroundColor,
      text: style.color,
      border: style.borderTopStyle,
      maxWidth: style.maxWidth,
      label: getComputedStyle(slot).display === 'none' ? 'hidden' : 'visible',
      icon: icon === null ? 'none' : icon.getAttribute('name'),
    }
  })

/**
 * How a button must look at rest for a combination of variant, icon and
 * hide-label. This is the design the appearance tests check:
 * - the variant alone decides the colors;
 * - a ghost button with an icon has no border and is collapsed to its icon
 *   (its label slides out on hover); every other button has a raised border
 *   and no width limit;
 * - hide-label hides the label, and an icon is shown only when requested.
 */
const expectedAppearance = async (page, { variant, icon, hideLabel }) => {
  const collapsed = variant === 'ghost' && icon !== null
  return {
    ...(await resolveVariantColors(page, variant)),
    border: collapsed ? 'none' : 'outset',
    maxWidth: collapsed ? '50px' : 'none',
    label: hideLabel ? 'hidden' : 'visible',
    icon: icon ?? 'none',
  }
}

/** Expects the button to be painted with the colors of the given variant. */
const expectVariantStyle = async (page, variant) => {
  const expected = await resolveVariantColors(page, variant)
  await expect
    .poll(async () => {
      const actual = await readAppearance(page)
      return actual && { background: actual.background, text: actual.text }
    })
    .toEqual(expected)
}

/** Collects the text of the console messages of one type (error, warning). */
const collectConsole = (page, type) => {
  const messages = []
  page.on('console', (message) => {
    if (message.type() === type) messages.push(message.text())
  })
  return messages
}

test.describe('button-custom component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/harness/button-custom.html')
    await page.waitForFunction(() => window.harnessReady === true)
  })

  // Every combination of variant, icon and hide-label, because the stylesheet
  // has rules for combinations of them. disabled is left out: it has no look
  // of its own yet. See expectedAppearance for the design being checked.
  test.describe('appearance at rest', () => {
    for (const variant of VARIANTS) {
      for (const icon of ICONS) {
        for (const hideLabel of [false, true]) {
          const title = [
            variant,
            icon ? 'with icon' : 'no icon',
            hideLabel ? 'label hidden' : 'label visible',
          ].join(', ')

          test(title, async ({ page }) => {
            const attrs = { variant }
            if (icon) attrs.icon = icon
            if (hideLabel) attrs['hide-label'] = ''
            await renderButton(page, attrs)

            const expected = await expectedAppearance(page, {
              variant,
              icon,
              hideLabel,
            })
            await expect.poll(() => readAppearance(page)).toEqual(expected)
          })
        }
      }
    }
  })

  // What hovering, focusing and pressing change, one test per stylesheet rule
  test.describe('appearance on interaction', () => {
    test('glows when hovered', async ({ page }) => {
      await renderButton(page, { variant: 'accent' })
      const button = inner(page)
      await expect(button).toHaveCSS('box-shadow', 'none')

      await host(page).hover()

      await expect(button).not.toHaveCSS('box-shadow', 'none')
    })

    test('glows when focused, without an outline', async ({ page }) => {
      await renderButton(page, { variant: 'accent' })
      const button = inner(page)

      await host(page).focus()

      await expect(button).toHaveCSS('box-shadow', 'none')
      await expect(host(page)).toHaveCSS('outline-style', 'solid')
    })

    test('looks pressed while the mouse button is down', async ({ page }) => {
      await renderButton(page)
      const button = inner(page)
      await expect(button).toHaveCSS('border-top-style', 'outset')

      await host(page).hover()
      await page.mouse.down()
      await expect(button).toHaveCSS('border-top-style', 'inset')

      await page.mouse.up()
      await expect(button).toHaveCSS('border-top-style', 'outset')
    })

    test('reveals the label of a ghost icon button on hover', async ({
      page,
    }) => {
      await renderButton(page, { variant: 'ghost', icon: 'square' })
      const button = inner(page)
      await expect(button).toHaveCSS('max-width', '50px')

      await host(page).hover()

      await expect(button).toHaveCSS('max-width', '400px')
    })

    test('does not glow a ghost icon-only button on hover', async ({
      page,
    }) => {
      await renderButton(page, {
        variant: 'ghost',
        icon: 'square',
        'hide-label': '',
      })

      await host(page).hover()

      await expect(inner(page)).toHaveCSS('box-shadow', 'none')
    })
  })

  // Role, keyboard focus, ARIA state and accessible name. They depend on
  // disabled, hide-label and link mode, never on the variant or the icon.
  test.describe('semantics', () => {
    for (const disabled of [false, true]) {
      for (const hideLabel of [false, true]) {
        const title = [
          'button',
          disabled ? 'disabled' : 'enabled',
          hideLabel ? 'label hidden' : 'label visible',
        ].join(', ')

        test(title, async ({ page }) => {
          const attrs = {}
          if (disabled) attrs.disabled = ''
          if (hideLabel) attrs['hide-label'] = ''
          await renderButton(page, attrs)

          // The label is the accessible name, hidden or not
          await expect(
            page.getByRole('button', { name: LABEL, exact: true }),
          ).toHaveCount(1)
          await expect(host(page)).toHaveAttribute('role', 'button')
          await expect(host(page)).toHaveAttribute('aria-label', LABEL)

          // Keyboard focus and ARIA state follow the disabled attribute
          if (disabled) {
            await expect(host(page)).toHaveAttribute('aria-disabled', 'true')
            await expect(host(page)).not.toHaveAttribute('tabindex')
          } else {
            await expect(host(page)).not.toHaveAttribute('aria-disabled')
            await expect(host(page)).toHaveAttribute('tabindex', '0')
          }
        })
      }
    }

    for (const hideLabel of [false, true]) {
      const title = `link, ${hideLabel ? 'label hidden' : 'label visible'}`

      test(title, async ({ page }) => {
        const attrs = { href: '#target' }
        if (hideLabel) attrs['hide-label'] = ''
        await renderButton(page, attrs)

        // The inner link carries the role and the focus, not the host
        await expect(
          page.getByRole('link', { name: LABEL, exact: true }),
        ).toHaveCount(1)
        await expect(page.getByRole('button')).toHaveCount(0)
        await expect(host(page)).not.toHaveAttribute('role')
        await expect(host(page)).not.toHaveAttribute('tabindex')
        await expect(host(page)).not.toHaveAttribute('aria-disabled')
      })
    }
  })

  test.describe('form: submit', () => {
    test('submits its form when clicked', async ({ page }) => {
      await renderSubmitForm(page)

      await host(page).click()

      await expect.poll(() => page.evaluate(() => window.submits)).toBe(1)
    })

    test('submits its form with the Enter key', async ({ page }) => {
      await renderSubmitForm(page)

      await host(page).focus()
      await page.keyboard.press('Enter')

      await expect.poll(() => page.evaluate(() => window.submits)).toBe(1)
    })

    test('does not submit its form when disabled', async ({ page }) => {
      await renderSubmitForm(page, { disabled: true })

      // Playwright skips disabled elements by default; force the click to check the component itself
      await host(page).click({ force: true })

      await expect.poll(() => page.evaluate(() => window.submits)).toBe(0)
    })

    test('submits its form with the Space key', async ({ page }) => {
      await renderForm(page, { type: 'submit' })

      await host(page).focus()
      await page.keyboard.press('Space')

      await expect.poll(() => counter(page, 'submits')).toBe(1)
    })

    test('does not submit a form that fails validation', async ({ page }) => {
      await renderForm(page, { type: 'submit' }, { required: true })

      await host(page).click()
      expect(await counter(page, 'submits')).toBe(0)

      // Control: the same click submits once the required field is filled
      await page.locator('#form input').fill('Buy milk')
      await host(page).click()
      await expect.poll(() => counter(page, 'submits')).toBe(1)
    })

    test('submits the form named by its form attribute', async ({ page }) => {
      await renderForm(page, { type: 'submit' })
      await host(page).evaluate((el) => {
        document.getElementById('stage').appendChild(el)
        el.setAttribute('form', 'form')
      })

      await host(page).click()

      await expect.poll(() => counter(page, 'submits')).toBe(1)
    })

    test('submits the form it was moved to', async ({ page }) => {
      await renderForm(page, { type: 'submit' })
      await host(page).evaluate((el) => {
        window.otherSubmits = 0
        const other = document.createElement('form')
        other.addEventListener('submit', (event) => {
          event.preventDefault()
          window.otherSubmits++
        })
        document.getElementById('stage').appendChild(other)
        other.appendChild(el)
      })

      await host(page).click()

      await expect.poll(() => counter(page, 'otherSubmits')).toBe(1)
      expect(await counter(page, 'submits')).toBe(0)
    })

    test('submits again after disabled is removed', async ({ page }) => {
      await renderForm(page, { type: 'submit', disabled: '' })

      await host(page).evaluate((el) => el.removeAttribute('disabled'))
      await expect(host(page)).toHaveAttribute('tabindex', '0')
      await host(page).click()

      await expect.poll(() => counter(page, 'submits')).toBe(1)
    })
  })

  test.describe('form: reset', () => {
    test('resets its form when clicked', async ({ page }) => {
      await renderForm(page, { type: 'reset' })
      const input = page.locator('#form input')
      await input.fill('changed')

      await host(page).click()

      await expect(input).toHaveValue('initial')
      expect(await counter(page, 'resets')).toBe(1)
      expect(await counter(page, 'submits')).toBe(0)
    })

    test('resets its form with the Enter key', async ({ page }) => {
      await renderForm(page, { type: 'reset' })
      const input = page.locator('#form input')
      await input.fill('changed')

      await host(page).focus()
      await page.keyboard.press('Enter')

      await expect(input).toHaveValue('initial')
      expect(await counter(page, 'resets')).toBe(1)
    })

    test('resets its form with the Space key', async ({ page }) => {
      await renderForm(page, { type: 'reset' })
      const input = page.locator('#form input')
      await input.fill('changed')

      await host(page).focus()
      await page.keyboard.press('Space')

      await expect(input).toHaveValue('initial')
      expect(await counter(page, 'resets')).toBe(1)
    })

    test('does not reset its form when disabled', async ({ page }) => {
      await renderForm(page, { type: 'reset', disabled: '' })
      const input = page.locator('#form input')
      await input.fill('changed')

      // Playwright skips disabled elements by default; force the click to check the component itself
      await host(page).click({ force: true })

      expect(await counter(page, 'resets')).toBe(0)
      await expect(input).toHaveValue('changed')
    })
  })

  test.describe('form: type attribute', () => {
    for (const attrs of [{}, { type: 'button' }]) {
      test(`does not act on its form with ${attrs.type ? 'type=button' : 'no type'}`, async ({
        page,
      }) => {
        await renderForm(page, attrs)
        const input = page.locator('#form input')
        await input.fill('changed')

        await host(page).click()
        await host(page).focus()
        await page.keyboard.press('Enter')
        await page.keyboard.press('Space')

        expect(await counter(page, 'submits')).toBe(0)
        expect(await counter(page, 'resets')).toBe(0)
        await expect(input).toHaveValue('changed')
      })
    }

    test('follows a change of type', async ({ page }) => {
      await renderForm(page, { type: 'button' })

      await host(page).evaluate((el) => el.setAttribute('type', 'submit'))
      await host(page).click()
      await expect.poll(() => counter(page, 'submits')).toBe(1)

      await host(page).evaluate((el) => el.setAttribute('type', 'reset'))
      await host(page).click()
      await expect.poll(() => counter(page, 'resets')).toBe(1)
      expect(await counter(page, 'submits')).toBe(1)
    })

    test('logs an error and goes back to type=button for an unknown type', async ({
      page,
    }) => {
      const errors = collectConsole(page, 'error')
      await renderForm(page, { type: 'submit' })

      // Control: the button submits before the invalid value is set
      await host(page).click()
      await expect.poll(() => counter(page, 'submits')).toBe(1)

      await host(page).evaluate((el) => el.setAttribute('type', 'nope'))

      await expect
        .poll(() => errors.join('\n'))
        .toContain('nope is not a valid button type.')
      await host(page).click()
      expect(await counter(page, 'submits')).toBe(1)
      expect(await counter(page, 'resets')).toBe(0)
    })

    test('does not act on its form when created with an unknown type', async ({
      page,
    }) => {
      const errors = collectConsole(page, 'error')
      await renderForm(page, { type: 'nope' })

      await expect
        .poll(() => errors.join('\n'))
        .toContain('nope is not a valid button type.')
      await host(page).click()
      expect(await counter(page, 'submits')).toBe(0)
      expect(await counter(page, 'resets')).toBe(0)
    })

    test('accepts a valid type after an unknown type', async ({ page }) => {
      await renderForm(page, { type: 'submit' })

      await host(page).evaluate((el) => {
        el.setAttribute('type', 'nope')
        el.setAttribute('type', 'reset')
      })
      await host(page).click()

      await expect.poll(() => counter(page, 'resets')).toBe(1)
      expect(await counter(page, 'submits')).toBe(0)
    })

    test('goes back to type=button when the type attribute is removed', async ({
      page,
    }) => {
      await renderForm(page, { type: 'submit' })

      await host(page).evaluate((el) => el.removeAttribute('type'))
      await host(page).click()

      expect(await counter(page, 'submits')).toBe(0)
    })

    test('does nothing on click outside a form', async ({ page }) => {
      const pageErrors = []
      page.on('pageerror', (error) => pageErrors.push(error.message))
      await renderButton(page, { type: 'submit' })
      await countClicks(page)

      await host(page).click()

      await expect.poll(() => counter(page, 'clicks')).toBe(1)
      expect(pageErrors).toEqual([])
    })
  })

  test.describe('keyboard', () => {
    test('is reachable with the Tab key', async ({ page }) => {
      await renderButton(page)

      await page.keyboard.press('Tab')

      await expect(host(page)).toBeFocused()
    })

    test('is skipped by the Tab key when disabled', async ({ page }) => {
      await renderHTML(
        page,
        `<button-custom id="first" disabled>First</button-custom>
         <button-custom id="second">Second</button-custom>`,
      )

      await page.keyboard.press('Tab')

      await expect(page.locator('#second')).toBeFocused()
    })

    test('fires a click with the Enter key, on key down', async ({ page }) => {
      await renderButton(page)
      await countClicks(page)
      await host(page).focus()

      await page.keyboard.down('Enter')
      expect(await counter(page, 'clicks')).toBe(1)

      await page.keyboard.up('Enter')
      expect(await counter(page, 'clicks')).toBe(1)
    })

    test('fires one click while the Enter key is held', async ({ page }) => {
      await renderButton(page)
      await countClicks(page)
      await host(page).focus()

      // A second down without an up is sent as a repeated key event
      await page.keyboard.down('Enter')
      await page.keyboard.down('Enter')
      await page.keyboard.down('Enter')
      await page.keyboard.up('Enter')

      expect(await counter(page, 'clicks')).toBe(1)
    })

    test('fires a click with the Space key, on key up', async ({ page }) => {
      await renderButton(page)
      await countClicks(page)
      await host(page).focus()

      await page.keyboard.down('Space')
      expect(await counter(page, 'clicks')).toBe(0)

      await page.keyboard.up('Space')
      expect(await counter(page, 'clicks')).toBe(1)
    })

    test('cancels the Space key down so the page does not scroll', async ({
      page,
    }) => {
      await renderButton(page)
      await page.evaluate(() => {
        window.prevented = {}
        // The window listener runs after the component's own listener
        window.addEventListener('keydown', (event) => {
          window.prevented[event.key] = event.defaultPrevented
        })
      })
      await host(page).focus()

      await page.keyboard.press('Space')
      await page.keyboard.press('Enter')

      expect(await counter(page, 'prevented')).toEqual({
        ' ': true,
        Enter: false,
      })
    })

    test('ignores other keys', async ({ page }) => {
      await renderButton(page)
      await countClicks(page)
      await host(page).focus()

      await page.keyboard.press('a')
      await page.keyboard.press('Escape')
      await page.keyboard.press('ArrowDown')

      expect(await counter(page, 'clicks')).toBe(0)
    })
  })

  test.describe('link mode', () => {
    test('renders a link when href is set', async ({ page }) => {
      await renderButton(page, { href: '#target', 'href-target': '_blank' })

      const link = host(page).locator('a')
      await expect(link).toHaveAttribute('href', '#target')
      await expect(link).toHaveAttribute('target', '_blank')
      await expect(host(page)).not.toHaveAttribute('role')
      await expect(host(page)).not.toHaveAttribute('tabindex')
    })

    test('renders a span without href and a link with href', async ({
      page,
    }) => {
      await renderButton(page)
      await expect(host(page).locator('span:has(> span > slot)')).toHaveCount(1)
      await expect(host(page).locator('a')).toHaveCount(0)

      await renderButton(page, { href: '#target' })
      await expect(host(page).locator('a')).toHaveCount(1)
      await expect(host(page).locator('span:has(> span > slot)')).toHaveCount(0)
      await expect(host(page).locator('a')).not.toHaveAttribute('target')
    })

    test('follows its href when clicked', async ({ page }) => {
      await renderButton(page, { href: '#target' })

      await host(page).locator('a').click()

      await expect(page).toHaveURL(/#target$/)
    })

    test('follows its href with the Enter key', async ({ page }) => {
      await renderButton(page, { href: '#target' })

      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')

      await expect(page).toHaveURL(/#target$/)
    })

    test('fires one click per Enter key press', async ({ page }) => {
      await renderButton(page, { href: '#target' })
      await countClicks(page)

      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')

      await expect(page).toHaveURL(/#target$/)
      expect(await counter(page, 'clicks')).toBe(1)
    })

    test('does not fire a click with the Space key', async ({ page }) => {
      await renderButton(page, { href: '#target' })
      await countClicks(page)

      await page.keyboard.press('Tab')
      await page.keyboard.press('Space')

      expect(await counter(page, 'clicks')).toBe(0)
    })

    test('keeps the variant, icon and label', async ({ page }) => {
      await renderButton(page, {
        href: '#target',
        variant: 'info',
        icon: 'square',
      })

      const link = host(page).locator('a')
      await expectVariantStyle(page, 'info')
      await expect(link.locator('svg-icon')).toHaveAttribute('name', 'square')
      await expect(page.getByRole('link', { name: LABEL })).toHaveCount(1)
    })

    test('never acts on its form', async ({ page }) => {
      await renderForm(page, { type: 'submit', href: '#target' })

      await host(page).locator('a').click()

      await expect(page).toHaveURL(/#target$/)
      expect(await counter(page, 'submits')).toBe(0)
    })

    test('switches between button and link when href changes', async ({
      page,
    }) => {
      await renderButton(page)

      await host(page).evaluate((el) => {
        el.setAttribute('href', '#target')
        el.setAttribute('href-target', '_blank')
      })
      const link = host(page).locator('a')
      await expect(link).toHaveAttribute('href', '#target')
      await expect(link).toHaveAttribute('target', '_blank')
      await expect(host(page)).not.toHaveAttribute('role')
      await expect(host(page)).not.toHaveAttribute('tabindex')

      await host(page).evaluate((el) => el.setAttribute('href', '#other'))
      await expect(link).toHaveAttribute('href', '#other')

      await host(page).evaluate((el) => el.removeAttribute('href-target'))
      await expect(link).not.toHaveAttribute('target')

      await host(page).evaluate((el) => el.removeAttribute('href'))
      await expect(host(page).locator('span:has(> span > slot)')).toHaveCount(1)
      await expect(host(page).locator('a')).toHaveCount(0)
      await expect(host(page)).toHaveAttribute('role', 'button')
      await expect(host(page)).toHaveAttribute('tabindex', '0')
    })

    test('submits its form again after href is removed', async ({ page }) => {
      await renderForm(page, { type: 'submit', href: '#target' })

      await host(page).evaluate((el) => el.removeAttribute('href'))
      await expect(host(page)).toHaveAttribute('role', 'button')
      await host(page).click()

      await expect.poll(() => counter(page, 'submits')).toBe(1)
    })
  })

  test.describe('attributes', () => {
    test('uses the default variant when created with an unknown variant', async ({
      page,
    }) => {
      const errors = []
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text())
      })

      await renderButton(page, { variant: 'nope' })

      await expectVariantStyle(page, 'default')
      expect(errors.join('\n')).toContain('invalid button variant (nope)')
    })

    test('applies icon-size to the icon', async ({ page }) => {
      await renderButton(page, { icon: 'square', 'icon-size': '2rem' })

      const svg = host(page).locator('svg-icon')
      await expect(svg).toHaveAttribute('width', '2rem')
      await expect(svg).toHaveAttribute('height', '2rem')
    })

    test('renders no icon for an unknown icon name', async ({ page }) => {
      await renderButton(page, { icon: 'not-an-icon' })

      await expect(host(page).locator('svg-icon')).toHaveCount(0)
    })

    test('does not fire click listeners when disabled', async ({ page }) => {
      // Control: an enabled button passes clicks to the listener, so the check below can fail
      await renderButton(page)
      await host(page).evaluate((el) => {
        window.clicks = 0
        el.addEventListener('click', () => window.clicks++)
      })
      await host(page).click()
      await expect.poll(() => page.evaluate(() => window.clicks)).toBe(1)

      await renderButton(page, { disabled: '' })
      await host(page).evaluate((el) => {
        window.clicks = 0
        el.addEventListener('click', () => window.clicks++)
      })

      // Playwright skips disabled elements by default; force the click to check the component itself
      await host(page).click({ force: true })

      await expect.poll(() => page.evaluate(() => window.clicks)).toBe(0)
    })

    test('uses the default variant colors without a variant attribute', async ({
      page,
    }) => {
      await renderButton(page)

      await expectVariantStyle(page, 'default')
    })

    test('goes back to the default variant when the variant attribute is removed', async ({
      page,
    }) => {
      await renderButton(page, { variant: 'danger' })

      await host(page).evaluate((el) => el.removeAttribute('variant'))

      await expectVariantStyle(page, 'default')
    })

    test('logs an error and falls back to the default variant for an unknown variant', async ({
      page,
    }) => {
      const errors = collectConsole(page, 'error')
      await renderButton(page, { variant: 'warn' })

      // Control: the button has the warn colors before the invalid value is set
      await expectVariantStyle(page, 'warn')

      await host(page).evaluate((el) => el.setAttribute('variant', 'nope'))

      await expect
        .poll(() => errors.join('\n'))
        .toContain('invalid button variant (nope)')
      await expectVariantStyle(page, 'default')
    })

    test('accepts a valid variant after an unknown one', async ({ page }) => {
      await renderButton(page, { variant: 'warn' })

      await host(page).evaluate((el) => {
        el.setAttribute('variant', 'nope')
        el.setAttribute('variant', 'danger')
      })

      await expectVariantStyle(page, 'danger')
    })

    test('sizes the icon to 1rem by default', async ({ page }) => {
      await renderButton(page, { icon: 'square' })

      const svg = host(page).locator('svg-icon')
      await expect(svg).toHaveAttribute('width', '1rem')
      await expect(svg).toHaveAttribute('height', '1rem')
    })

    test('logs an error and goes back to the default size for an invalid icon-size', async ({
      page,
    }) => {
      const errors = collectConsole(page, 'error')
      await renderButton(page, { icon: 'square', 'icon-size': '2rem' })

      await host(page).evaluate((el) => el.setAttribute('icon-size', 'big'))

      await expect
        .poll(() => errors.join('\n'))
        .toContain('icon-size is not a valid CSS value (big)')
      await expect(host(page).locator('svg-icon')).toHaveAttribute(
        'width',
        '1rem',
      )
      await expect(host(page).locator('svg-icon')).toHaveAttribute(
        'height',
        '1rem',
      )
    })

    test('uses the default size when created with an invalid icon-size', async ({
      page,
    }) => {
      const errors = collectConsole(page, 'error')

      await renderButton(page, { icon: 'square', 'icon-size': 'big' })

      await expect
        .poll(() => errors.join('\n'))
        .toContain('icon-size is not a valid CSS value (big)')
      await expect(host(page).locator('svg-icon')).toHaveAttribute(
        'width',
        '1rem',
      )
    })

    test('accepts a valid icon-size after an invalid one', async ({ page }) => {
      await renderButton(page, { icon: 'square', 'icon-size': '2rem' })

      await host(page).evaluate((el) => {
        el.setAttribute('icon-size', 'big')
        el.setAttribute('icon-size', '3rem')
      })

      await expect(host(page).locator('svg-icon')).toHaveAttribute(
        'width',
        '3rem',
      )
    })

    test('logs an error and removes its icon for an unknown icon name', async ({
      page,
    }) => {
      const errors = collectConsole(page, 'error')
      await renderButton(page, { icon: 'square' })
      await expect(host(page).locator('svg-icon')).toHaveCount(1)

      await host(page).evaluate((el) => el.setAttribute('icon', 'not-an-icon'))

      await expect
        .poll(() => errors.join('\n'))
        .toContain('Invalid icon name: not-an-icon.')
      await expect(host(page).locator('svg-icon')).toHaveCount(0)
    })

    test('accepts a valid icon after an unknown icon name', async ({
      page,
    }) => {
      await renderButton(page, { icon: 'square' })

      await host(page).evaluate((el) => {
        el.setAttribute('icon', 'not-an-icon')
        el.setAttribute('icon', 'bomb')
      })

      const svg = host(page).locator('svg-icon')
      await expect(svg).toHaveCount(1)
      await expect(svg).toHaveAttribute('name', 'bomb')
    })

    test('goes back to the default size when icon-size is removed', async ({
      page,
    }) => {
      await renderButton(page, { icon: 'square', 'icon-size': '2rem' })

      await host(page).evaluate((el) => el.removeAttribute('icon-size'))

      await expect(host(page).locator('svg-icon')).toHaveAttribute(
        'width',
        '1rem',
      )
    })

    test('places the icon before the label', async ({ page }) => {
      await renderButton(page, { icon: 'square' })

      const children = await inner(page).evaluate((el) =>
        [...el.children].map((child) => child.localName),
      )
      expect(children).toEqual(['svg-icon', 'span'])
    })

    test('changes its icon when the icon attribute changes', async ({
      page,
    }) => {
      await renderButton(page, { icon: 'square' })

      await host(page).evaluate((el) => el.setAttribute('icon', 'bomb'))

      const svg = host(page).locator('svg-icon')
      await expect(svg).toHaveCount(1)
      await expect(svg).toHaveAttribute('name', 'bomb')
    })

    test('logs an error for an unknown icon name', async ({ page }) => {
      const errors = collectConsole(page, 'error')

      await renderButton(page, { icon: 'not-an-icon' })

      await expect.poll(() => errors.join('\n')).toContain('not-an-icon')
    })

    test('removes its icon when the icon attribute is removed', async ({
      page,
    }) => {
      await renderButton(page, { icon: 'square' })
      await expect(host(page).locator('svg-icon')).toHaveCount(1)

      await host(page).evaluate((el) => el.removeAttribute('icon'))

      await expect(host(page).locator('svg-icon')).toHaveCount(0)
    })

    test('shows its label again when hide-label is removed', async ({
      page,
    }) => {
      await renderButton(page, { 'hide-label': '' })
      const slot = host(page).locator('slot')
      await expect(slot).toHaveCSS('display', 'none')

      await host(page).evaluate((el) => el.removeAttribute('hide-label'))

      await expect(slot).not.toHaveCSS('display', 'none')
    })

    test('is enabled again when disabled is removed', async ({ page }) => {
      await renderButton(page, { disabled: '' })
      await expect(host(page)).toHaveAttribute('aria-disabled', 'true')

      await host(page).evaluate((el) => el.removeAttribute('disabled'))

      await expect(host(page)).not.toHaveAttribute('aria-disabled')
      await expect(host(page)).toHaveAttribute('tabindex', '0')
      await countClicks(page)
      await host(page).click()
      await expect.poll(() => counter(page, 'clicks')).toBe(1)
    })
  })

  test.describe('accessible name', () => {
    test('projects the label text through its slot', async ({ page }) => {
      await renderButton(page, {}, 'Save list')

      await expect(host(page)).toHaveText('Save list')
      const assigned = await host(page).evaluate((el) =>
        el.shadowRoot
          .querySelector('slot')
          .assignedNodes()
          .map((node) => node.textContent)
          .join(''),
      )
      expect(assigned).toBe('Save list')
    })

    test('uses the text of nested elements as its name', async ({ page }) => {
      await renderHTML(
        page,
        '<button-custom>Delete <strong>everything</strong></button-custom>',
      )

      await expect(
        page.getByRole('button', { name: 'Delete everything', exact: true }),
      ).toHaveCount(1)
    })

    for (const [title, label] of [
      ['an empty label', ''],
      ['a label made of spaces', '   '],
    ]) {
      test(`warns and sets no aria-label for ${title}`, async ({ page }) => {
        const warnings = collectConsole(page, 'warning')

        await renderButton(page, {}, label)

        await expect
          .poll(() => warnings.join('\n'))
          .toContain('Button should have a label for accessibility')
        await expect(host(page)).not.toHaveAttribute('aria-label')
      })
    }

    test('updates its name when the label text changes', async ({ page }) => {
      await renderButton(page, { 'hide-label': '' }, 'Before')

      await host(page).evaluate((el) => (el.textContent = 'After'))

      await expect(
        page.getByRole('button', { name: 'After', exact: true }),
      ).toHaveCount(1)
    })
  })

  test.describe('rendering', () => {
    test('updates its rendering when an attribute changes', async ({
      page,
    }) => {
      await renderButton(page)
      await expectVariantStyle(page, 'default')

      await host(page).evaluate((el) => {
        el.setAttribute('variant', 'danger')
        el.setAttribute('disabled', '')
      })

      await expectVariantStyle(page, 'danger')
      await expect(host(page)).toHaveAttribute('aria-disabled', 'true')
    })

    test('renders from parsed HTML', async ({ page }) => {
      await renderHTML(
        page,
        '<button-custom variant="accent" icon="square">Parsed</button-custom>',
      )

      await expectVariantStyle(page, 'accent')
      await expect(host(page).locator('svg-icon')).toHaveAttribute(
        'name',
        'square',
      )
      await expect(
        page.getByRole('button', { name: 'Parsed', exact: true }),
      ).toHaveCount(1)
    })

    test('adopts its stylesheet in its shadow root', async ({ page }) => {
      await renderButton(page)

      const sheets = await host(page).evaluate(
        (el) => el.shadowRoot.adoptedStyleSheets.length,
      )
      expect(sheets).toBe(1)
    })

    test('keeps a single inner element after several renders', async ({
      page,
    }) => {
      await renderButton(page, { icon: 'square' })

      for (const variant of ['accent', 'info', 'warn']) {
        await host(page).evaluate(
          (el, variant) => el.setAttribute('variant', variant),
          variant,
        )
        await expectVariantStyle(page, variant)
      }

      const counts = await host(page).evaluate((el) => ({
        children: el.shadowRoot.children.length,
        icons: el.shadowRoot.querySelectorAll('svg-icon').length,
        slots: el.shadowRoot.querySelectorAll('slot').length,
      }))
      expect(counts).toEqual({ children: 1, icons: 1, slots: 1 })
    })

    test('renders once for several attribute changes in the same task', async ({
      page,
    }) => {
      await renderButton(page)

      const renders = await host(page).evaluate(async (el) => {
        let count = 0
        const observer = new MutationObserver((records) => {
          count += records.length
        })
        observer.observe(el.shadowRoot, { childList: true })
        el.setAttribute('variant', 'danger')
        el.setAttribute('icon', 'square')
        el.setAttribute('hide-label', '')
        await new Promise((resolve) => setTimeout(resolve, 50))
        observer.disconnect()
        return count
      })

      expect(renders).toBe(1)
      await expectVariantStyle(page, 'danger')
      await expect(host(page).locator('svg-icon')).toHaveCount(1)
      await expect(host(page).locator('slot')).toHaveCSS('display', 'none')
    })

    test('does not render again when an attribute keeps its value', async ({
      page,
    }) => {
      await renderButton(page, { variant: 'danger' })

      const renders = await host(page).evaluate(async (el) => {
        let count = 0
        const observer = new MutationObserver((records) => {
          count += records.length
        })
        observer.observe(el.shadowRoot, { childList: true })
        el.setAttribute('variant', 'danger')
        await new Promise((resolve) => setTimeout(resolve, 50))
        observer.disconnect()
        return count
      })

      expect(renders).toBe(0)
    })

    test('applies the attributes changed while it was out of the document', async ({
      page,
    }) => {
      await renderButton(page)

      await host(page).evaluate((el) => {
        const parent = el.parentElement
        el.remove()
        el.setAttribute('variant', 'warn')
        el.setAttribute('disabled', '')
        parent.appendChild(el)
      })

      await expectVariantStyle(page, 'warn')
      await expect(host(page)).toHaveAttribute('aria-disabled', 'true')
    })
  })
})
