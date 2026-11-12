import { test, expect } from '@playwright/test'

const BASE = { title: 'Hello', description: 'World' }

/** Builds a Modal in the page and opens it. The promise result lands in window.modalResult. */
const openModal = (page, config) =>
  page.evaluate((config) => {
    if (config.nodeText !== undefined) {
      const paragraph = document.createElement('p')
      paragraph.textContent = config.nodeText
      config.descriptionNode = paragraph
      delete config.nodeText
    }
    window.modalResult = undefined
    window.modal = new window.Modal(config)
    window.modal.open().then((value) => {
      window.modalResult = { value }
    })
  }, config)

/** Resolves to the constructor error (name and message) for a config, or null when valid. */
const constructorError = (page, config) =>
  page.evaluate((config) => {
    if (config && config.nodeText !== undefined) {
      const paragraph = document.createElement('p')
      paragraph.textContent = config.nodeText
      config.descriptionNode = paragraph
      delete config.nodeText
    }
    try {
      new window.Modal(config)
      return null
    } catch (error) {
      return { name: error.name, message: error.message }
    }
  }, config)

/** The open dialog, inside the modal's shadow root. */
const dialog = (page) => page.getByRole('dialog')

/** Result of the open() promise: undefined while pending, { value } once settled. */
const modalResult = (page) => page.evaluate(() => window.modalResult)

test.describe('Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/harness/modal.html')
    await page.waitForFunction(() => window.harnessReady === true)
  })

  test.describe('configuration validation', () => {
    const cases = [
      [
        'a non-object config',
        null,
        'TypeError',
        'the configuration must be an object',
      ],
      [
        'an array config',
        [],
        'TypeError',
        'the configuration must be an object',
      ],
      [
        'an unknown option',
        { ...BASE, titel: 'typo' },
        'TypeError',
        'unknown option "titel"',
      ],
      [
        'a missing title',
        { description: 'd' },
        'TypeError',
        'option "title" is required',
      ],
      [
        'a title of the wrong type',
        { title: 5, description: 'd' },
        'TypeError',
        'option "title" must be a string, got number',
      ],
      [
        'no description',
        { title: 'T' },
        'TypeError',
        'option "description" or "descriptionNode" is required',
      ],
      [
        'both description and descriptionNode',
        { title: 'T', description: 'a', nodeText: 'b' },
        'TypeError',
        'mutually exclusive',
      ],
      [
        'a descriptionNode that is not a node',
        { title: 'T', descriptionNode: 'text' },
        'TypeError',
        'option "descriptionNode" must be a node, got string',
      ],
      [
        'the removed htmlDescription option',
        { title: 'T', htmlDescription: '<b>b</b>' },
        'TypeError',
        'unknown option "htmlDescription"',
      ],
      [
        'an unknown variant',
        { ...BASE, closeVariant: 'nope' },
        'RangeError',
        'option "closeVariant" must be one of',
      ],
      [
        'an unknown input type',
        { ...BASE, showInput: true, inputType: 'date' },
        'RangeError',
        'option "inputType" must be one of',
      ],
      [
        'a select without options',
        { ...BASE, showInput: true, inputType: 'select' },
        'TypeError',
        'option "inputOptions" is required when "inputType" is "select"',
      ],
      [
        'options on a text input',
        { ...BASE, showInput: true, inputOptions: ['a'] },
        'TypeError',
        'only allowed when "inputType" is "select" or "radio"',
      ],
      [
        'an option entry that is not a string or a single pair',
        { ...BASE, showInput: true, inputType: 'radio', inputOptions: [1] },
        'TypeError',
        'each "inputOptions" entry must be a string',
      ],
      [
        'a default value without an input',
        { ...BASE, inputDefaultValue: 'x' },
        'TypeError',
        'only allowed when "showInput" is true',
      ],
      [
        'a checkbox default that is not a boolean',
        {
          ...BASE,
          showInput: true,
          inputType: 'checkbox',
          inputDefaultValue: 'yes',
        },
        'TypeError',
        'must be a boolean, got string',
      ],
      [
        'a default that matches no option',
        {
          ...BASE,
          showInput: true,
          inputType: 'radio',
          inputOptions: ['a'],
          inputDefaultValue: 'b',
        },
        'TypeError',
        'does not match any "inputOptions" value',
      ],
    ]

    for (const [title, config, name, message] of cases) {
      test(`rejects ${title}`, async ({ page }) => {
        const error = await constructorError(page, config)

        expect(error?.name).toBe(name)
        expect(error?.message).toContain(message)
      })
    }

    test('accepts a minimal config', async ({ page }) => {
      expect(await constructorError(page, BASE)).toBeNull()
    })

    test('accepts a descriptionNode in place of description', async ({
      page,
    }) => {
      expect(
        await constructorError(page, { title: 'T', nodeText: 'node' }),
      ).toBeNull()
    })
  })

  test.describe('rendering', () => {
    test('shows the title and description in a labelled dialog', async ({
      page,
    }) => {
      await openModal(page, BASE)

      await expect(dialog(page)).toBeVisible()
      await expect(dialog(page)).toHaveAttribute('aria-modal', 'true')
      await expect(dialog(page)).toHaveAccessibleName('Hello')
      await expect(dialog(page).locator('#modal-description')).toHaveText(
        'World',
      )
    })

    test('shows only the close button and the header close button by default', async ({
      page,
    }) => {
      await openModal(page, BASE)

      await expect(
        page.getByRole('button', { name: 'Close', exact: true }),
      ).toBeVisible()
      await expect(
        page.getByRole('button', { name: 'close', exact: true }),
      ).toBeVisible()
      await expect(
        page.getByRole('button', { name: 'Cancel', exact: true }),
      ).toHaveCount(0)
    })

    test('uses the configured labels and variants for the buttons', async ({
      page,
    }) => {
      await openModal(page, {
        ...BASE,
        showCancel: true,
        cancelLabel: 'Nope',
        cancelVariant: 'warn',
        closeLabel: 'Confirm',
        closeVariant: 'danger',
      })

      const cancel = page.getByRole('button', { name: 'Nope', exact: true })
      const confirm = page.getByRole('button', { name: 'Confirm', exact: true })
      await expect(cancel).toBeVisible()
      await expect(cancel).toHaveAttribute('variant', 'warn')
      await expect(confirm).toBeVisible()
      await expect(confirm).toHaveAttribute('variant', 'danger')
    })

    test('uses "Cancel" when showCancel has no label', async ({ page }) => {
      await openModal(page, { ...BASE, showCancel: true })

      await expect(
        page.getByRole('button', { name: 'Cancel', exact: true }),
      ).toBeVisible()
    })

    test('hides the save button when showClose is false', async ({ page }) => {
      await openModal(page, { ...BASE, showClose: false })

      await expect(
        page.getByRole('button', { name: 'Close', exact: true }),
      ).toHaveCount(0)
    })

    test('hides the header close button when showHeaderCloseButton is false', async ({
      page,
    }) => {
      await openModal(page, { ...BASE, showHeaderCloseButton: false })

      await expect(
        page.getByRole('button', { name: 'close', exact: true }),
      ).toHaveCount(0)
    })

    test('adds the large class when large is true', async ({ page }) => {
      await openModal(page, { ...BASE, large: true })

      await expect(dialog(page)).toHaveClass(/\blarge\b/)
    })

    test('renders a descriptionNode built from DOM elements', async ({
      page,
    }) => {
      await page.evaluate(() => {
        const fragment = document.createDocumentFragment()
        const bold = document.createElement('b')
        bold.id = 'bold'
        bold.textContent = 'bold'
        fragment.append(bold, ' text')
        window.modal = new window.Modal({
          title: 'Hello',
          descriptionNode: fragment,
        })
        window.modal.open()
      })

      await expect(
        dialog(page).locator('#modal-description b#bold'),
      ).toHaveText('bold')
    })

    test('inserts a descriptionNode as text, never as markup', async ({
      page,
    }) => {
      await openModal(page, {
        title: 'Hello',
        nodeText: '<b id="bold">not bold</b>',
      })

      await expect(dialog(page).locator('#modal-description')).toHaveText(
        '<b id="bold">not bold</b>',
      )
      await expect(dialog(page).locator('#modal-description b')).toHaveCount(0)
    })

    test('shows the descriptionNode again when the same modal is reopened', async ({
      page,
    }) => {
      await page.evaluate(() => {
        const paragraph = document.createElement('p')
        paragraph.textContent = 'kept'
        window.modal = new window.Modal({
          title: 'Again',
          descriptionNode: paragraph,
        })
        window.modal.open()
      })
      await expect(page.locator('.modal-host')).toHaveClass(/\bis-open\b/)
      await page.keyboard.press('Escape')
      await expect(page.locator('.modal-host')).toHaveCount(0)

      // Block body: returning the open() promise would make evaluate wait for the dialog to close
      await page.evaluate(() => {
        window.modal.open()
      })

      await expect(dialog(page).locator('#modal-description')).toHaveText(
        'kept',
      )
    })

    test('shows the input label only when showInputLabel is true', async ({
      page,
    }) => {
      await openModal(page, {
        ...BASE,
        showInput: true,
        showInputLabel: true,
        inputLabel: 'Name',
      })

      await expect(dialog(page).locator('label#modal-label')).toHaveText('Name')
      await expect(dialog(page).locator('label#modal-label')).toHaveClass(
        /\bvisible\b/,
      )
    })

    test('hides the input label by default', async ({ page }) => {
      await openModal(page, { ...BASE, showInput: true })

      await expect(dialog(page).locator('label#modal-label')).not.toHaveClass(
        /\bvisible\b/,
      )
    })
  })

  test.describe('input types', () => {
    test('renders a text input with its default value', async ({ page }) => {
      await openModal(page, {
        ...BASE,
        showInput: true,
        inputDefaultValue: 'draft',
      })

      await expect(dialog(page).getByRole('textbox')).toHaveValue('draft')
    })

    test('renders a checkbox that starts checked when the default is true', async ({
      page,
    }) => {
      await openModal(page, {
        ...BASE,
        showInput: true,
        inputType: 'checkbox',
        inputDefaultValue: true,
      })

      await expect(dialog(page).getByRole('checkbox')).toBeChecked()
    })

    test('renders one radio per option and checks the default', async ({
      page,
    }) => {
      await openModal(page, {
        ...BASE,
        showInput: true,
        inputType: 'radio',
        inputOptions: ['a', { b: 'Option B' }],
        inputDefaultValue: 'b',
      })

      await expect(dialog(page).getByRole('radiogroup')).toBeVisible()
      await expect(dialog(page).getByRole('radio')).toHaveCount(2)
      await expect(
        dialog(page).getByRole('radio', { name: 'Option B' }),
      ).toBeChecked()
    })

    test('renders a select with its options and default', async ({ page }) => {
      await openModal(page, {
        ...BASE,
        showInput: true,
        inputType: 'select',
        inputOptions: ['a', { b: 'Option B' }],
        inputDefaultValue: 'b',
      })

      const select = dialog(page).getByRole('combobox')
      await expect(select).toHaveValue('b')
      await expect(select.locator('option')).toHaveCount(2)
    })
  })

  test.describe('results', () => {
    test('save resolves with the trimmed text value', async ({ page }) => {
      await openModal(page, { ...BASE, showInput: true })

      await dialog(page).getByRole('textbox').fill('  hello  ')
      await page.getByRole('button', { name: 'Close', exact: true }).click()

      await expect.poll(() => modalResult(page)).toEqual({ value: 'hello' })
    })

    test('Enter in the input saves', async ({ page }) => {
      await openModal(page, { ...BASE, showInput: true })

      await dialog(page).getByRole('textbox').fill('typed')
      await page.keyboard.press('Enter')

      await expect.poll(() => modalResult(page)).toEqual({ value: 'typed' })
    })

    test('cancel resolves with null', async ({ page }) => {
      await openModal(page, { ...BASE, showCancel: true })

      await page.getByRole('button', { name: 'Cancel', exact: true }).click()

      await expect.poll(() => modalResult(page)).toEqual({ value: null })
    })

    test('Escape resolves with null', async ({ page }) => {
      await openModal(page, BASE)
      // Wait until the dialog has focus, so the key reaches its handler
      await expect(page.locator('.modal-host')).toHaveClass(/\bis-open\b/)

      await page.keyboard.press('Escape')

      await expect.poll(() => modalResult(page)).toEqual({ value: null })
    })

    test('the header close button resolves with null', async ({ page }) => {
      await openModal(page, BASE)

      await page.getByRole('button', { name: 'close', exact: true }).click()

      await expect.poll(() => modalResult(page)).toEqual({ value: null })
    })

    test('a click on the backdrop resolves with null', async ({ page }) => {
      await openModal(page, BASE)

      // The dialog is centred, so the top-left corner is the backdrop
      await page.mouse.click(5, 5)

      await expect.poll(() => modalResult(page)).toEqual({ value: null })
    })

    test('a click on the backdrop does nothing when disableBackdropDismissal is true', async ({
      page,
    }) => {
      await openModal(page, { ...BASE, disableBackdropDismissal: true })

      await page.mouse.click(5, 5)

      await expect(dialog(page)).toBeVisible()
      expect(await modalResult(page)).toBeUndefined()
    })

    test('a checked checkbox resolves with its value', async ({ page }) => {
      await openModal(page, { ...BASE, showInput: true, inputType: 'checkbox' })

      await dialog(page).getByRole('checkbox').check()
      await page.getByRole('button', { name: 'Close', exact: true }).click()

      await expect.poll(() => modalResult(page)).toEqual({ value: 'on' })
    })

    test('an unchecked checkbox resolves with an empty string', async ({
      page,
    }) => {
      await openModal(page, { ...BASE, showInput: true, inputType: 'checkbox' })

      await page.getByRole('button', { name: 'Close', exact: true }).click()

      await expect.poll(() => modalResult(page)).toEqual({ value: '' })
    })

    test('the selected radio resolves with its value', async ({ page }) => {
      await openModal(page, {
        ...BASE,
        showInput: true,
        inputType: 'radio',
        inputOptions: ['a', { b: 'Option B' }],
      })

      await dialog(page).getByRole('radio', { name: 'Option B' }).check()
      await page.getByRole('button', { name: 'Close', exact: true }).click()

      await expect.poll(() => modalResult(page)).toEqual({ value: 'b' })
    })

    test('the selected option resolves with its value', async ({ page }) => {
      await openModal(page, {
        ...BASE,
        showInput: true,
        inputType: 'select',
        inputOptions: ['a', { b: 'Option B' }],
      })

      await dialog(page).getByRole('combobox').selectOption('b')
      await page.getByRole('button', { name: 'Close', exact: true }).click()

      await expect.poll(() => modalResult(page)).toEqual({ value: 'b' })
    })

    test('save resolves with an empty string when there is no input', async ({
      page,
    }) => {
      await openModal(page, BASE)

      await page.getByRole('button', { name: 'Close', exact: true }).click()

      await expect.poll(() => modalResult(page)).toEqual({ value: '' })
    })
  })

  test.describe('lifecycle', () => {
    test('open() returns the same promise when called twice', async ({
      page,
    }) => {
      await openModal(page, BASE)

      const same = await page.evaluate(
        () => window.modal.open() === window.modal.open(),
      )
      expect(same).toBe(true)
    })

    test('removes the dialog from the page after it closes', async ({
      page,
    }) => {
      await openModal(page, BASE)
      await expect(page.locator('.modal-host')).toHaveCount(1)

      await page.getByRole('button', { name: 'Close', exact: true }).click()

      await expect(page.locator('.modal-host')).toHaveCount(0)
    })

    test('locks page scrolling while open and restores it after', async ({
      page,
    }) => {
      await page.evaluate(() => {
        document.body.style.overflow = 'scroll'
      })
      await openModal(page, BASE)

      expect(await page.evaluate(() => document.body.style.overflow)).toBe(
        'hidden',
      )

      await page.getByRole('button', { name: 'Close', exact: true }).click()

      await expect
        .poll(() => page.evaluate(() => document.body.style.overflow))
        .toBe('scroll')
    })

    test('moves focus into the dialog when it opens', async ({ page }) => {
      await openModal(page, { ...BASE, showInput: true })

      await expect(dialog(page).getByRole('textbox')).toBeFocused()
    })

    test('returns focus to the previously focused element when it closes', async ({
      page,
    }) => {
      await page.locator('#opener').focus()
      await openModal(page, BASE)
      // Wait until the dialog has finished opening, as a user would before pressing Escape
      await expect(page.locator('.modal-host')).toHaveClass(/\bis-open\b/)

      await page.keyboard.press('Escape')

      await expect(page.locator('#opener')).toBeFocused()
    })

    test('keeps Tab focus inside the dialog', async ({ page }) => {
      await openModal(page, { ...BASE, showCancel: true })

      // Press Tab more times than the dialog has buttons
      for (let i = 0; i < 6; i++) {
        await page.keyboard.press('Tab')
        const inside = await page.evaluate(() => {
          let el = document.activeElement
          while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement
          for (let node = el; node; node = node.parentNode ?? node.host) {
            if (node.getAttribute?.('role') === 'dialog') return true
          }
          return false
        })
        expect(inside, `focus left the dialog on tab ${i + 1}`).toBe(true)
      }
    })

    test('resolves with null when its dialog is removed while open', async ({
      page,
    }) => {
      await openModal(page, BASE)

      await page.evaluate(() => document.querySelector('.modal-host').remove())

      await expect.poll(() => modalResult(page)).toEqual({ value: null })
    })
  })
})
