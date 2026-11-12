/**
 * Standalone modal prompt dialog.
 *
 * No HTML, no CSS file and no dependency is required: the whole UI lives in a
 * shadow root created by the class itself, so the host page cannot style it
 * (and it cannot leak styles into the page).
 *
 * Usage:
 *
 *   import { Modal } from './js/modal.js'
 *
 *   const value = await new Modal({
 *     title: 'New list',
 *     description: 'Name of the list:',
 *     showInput: true,
 *     showCancel: true,
 *     inputLabel: 'List name'
 *   }).open()
 *   if (value !== null) {
 *      ...
 *   }
 *
 * `open()` resolves with the field value when the user clicks the save button
 * (labelled `closeLabel`, "Close" by default) or presses Enter, and with
 * `null` when the user cancels, uses the header close button, presses Escape
 * or clicks outside the dialog.
 *
 * The constructor validates the configuration: `title` is required, exactly one
 * of `description` and `descriptionNode` must be provided, unknown options are
 * rejected, and a wrong value type or an unsupported `inputType` throws
 * immediately. `inputDefaultValue` is checked against `inputType`: a string for
 * text/select/radio (matching an `inputOptions` value for the latter two), a
 * boolean for a checkbox.
 * @module modal
 */

import { BUTTON_VARIANTS as buttonVariants } from './components/button-custom/constants.js'

/**
 * Basic markup of the dialog. Elements are shown/hidden from the config.
 * @constant
 * @category constants
 * @type {string}
 */
const basicHTML = `
  <div class="overlay" part="overlay">
    <div class="dialog" part="dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1">
      <button class="header-close" type="button" aria-label="close" title="close">✕</button>
      <h2 class="title" id="modal-title"></h2>
      <div class="description" id="modal-description"></div>
      <div class="form">
        <div class="field">
          <label class="label" id="modal-label" for="modal-input">Value</label>
          <input class="input" id="modal-input" type="text" autocomplete="off" spellcheck="false" placeholder="Type here…">
          <select class="input" id="modal-select" hidden></select>
          <div class="choices" id="modal-choices" hidden></div>
        </div>
        <div class="actions">
          <button-custom class="button cancel" type="button">Cancel</button-custom>
          <button-custom class="button primary" type="button">Save</button-custom>
        </div>
      </div>
    </div>
  </div>
`

/** @import {ButtonVariant} from './components/button-custom/constants.js' */

/**
 * @typedef {Object} ModalOptions
 * @property {string} title
 * @property {string} [description]
 * @property {Node} [descriptionNode] DOM node shown as the description. It is cloned on each open and inserted as-is, so build it from trusted content.
 * @property {boolean} [showCancel]
 * @property {string} [cancelLabel]
 * @property {ButtonVariant} [cancelVariant]
 * @property {boolean} [showClose]
 * @property {string} [closeLabel]
 * @property {ButtonVariant} [closeVariant]
 * @property {boolean} [showHeaderCloseButton]
 * @property {boolean} [disableBackdropDismissal]
 * @property {boolean} [showInput]
 * @property {'text' | 'checkbox' | 'select' | 'radio'} [inputType]
 * @property {boolean} [showInputLabel]
 * @property {string} [inputLabel]
 * @property {Array<Record<string | number, string> | string>} [inputOptions]
 * @property {string | boolean | null} [inputDefaultValue]
 * @property {boolean} [scrollableDescription]
 * @property {boolean} [large]
 */

/**
 * Options that always have a value once defaults are applied.
 * @typedef {Required<Pick<ModalOptions, 'cancelVariant' | 'cancelLabel' | 'closeVariant' | 'closeLabel' | 'showCancel' | 'showClose' | 'showHeaderCloseButton' | 'disableBackdropDismissal' | 'showInput' | 'inputType' | 'showInputLabel' | 'inputDefaultValue' | 'scrollableDescription' | 'large'>>} ModalDefaults
 */

/**
 * Configuration after defaults are applied: what `#config` holds.
 * @typedef {ModalOptions & ModalDefaults} ModalConfig
 */

/** @type {ModalDefaults} */
const defaultModalConfig = {
  showCancel: false,
  cancelLabel: '',
  cancelVariant: 'default',
  showClose: true,
  closeLabel: 'Close',
  closeVariant: 'default',
  showHeaderCloseButton: true,
  disableBackdropDismissal: false,
  showInput: false,
  inputType: 'text',
  showInputLabel: false,
  inputDefaultValue: null,
  scrollableDescription: false,
  large: false,
}

/**
 * Expected primitive type of each option, in `ModalConfig` order.
 * `undefined` means "not provided", except for `title` (always required).
 */
const modalOptionTypes = {
  title: 'string',
  description: 'string',
  descriptionNode: 'node',
  showCancel: 'boolean',
  cancelLabel: 'string',
  cancelVariant: 'string',
  showClose: 'boolean',
  closeLabel: 'string',
  closeVariant: 'string',
  showHeaderCloseButton: 'boolean',
  disableBackdropDismissal: 'boolean',
  showInput: 'boolean',
  inputType: 'string',
  showInputLabel: 'boolean',
  inputLabel: 'string',
  inputOptions: 'array',
  // Also accepts null (the default) and, for a checkbox, a boolean.
  inputDefaultValue: 'string',
  scrollableDescription: 'boolean',
  large: 'boolean',
}

/**
 * @constant
 * @type {string[]}
 */
const inputTypes = ['text', 'checkbox', 'select', 'radio']

/**
 * @constant
 * @type {string}
 */
const css = `
  :host {
    all: initial;
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: block;
    font-family: var(--font);
    font-size: var(--font-size);
    color: var(--foreground-color);
    line-height: 1.4;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  [hidden] {
    display: none !important;
  }

  .overlay {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 1rem;
    background: rgb(0 0 0 / 0.6);
    opacity: 0;
    transition: opacity 150ms ease;
  }

  :host(.is-open) .overlay {
    opacity: 1;
  }

  .dialog {
    position: relative;
    width: min(28rem, 100%);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1.25rem;
    background: var(--surface);
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    box-shadow: 0 1.5rem 4rem rgb(0 0 0 / 0.5);
    transform: translateY(0.75rem) scale(0.97);
    opacity: 0;
    transition: transform 150ms ease, opacity 150ms ease;
  }

  .dialog.large {
    width: min(max(28rem, 70vw), 100%);
  }

  :host(.is-open) .dialog {
    transform: none;
    opacity: 1;
  }

  .title {
    margin: 0;
    font-size: 1.15em;
    font-weight: 600;
    color: var(--foreground-color);
  }

  .dialog.has-header-close .title {
    padding-right: 1.75rem;
  }

  .description {
    margin: 0;
    font-size: 0.9em;
    opacity: 0.75;
  }

  .dialog.has-scrollable-description {
    max-height: calc(100vh - 2rem);
    max-height: calc(100dvh - 2rem);
  }

  .dialog.has-scrollable-description .description {
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 0.25rem;
  }

  .label {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }

  .input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    font: inherit;
    color: var(--foreground-color);
    background: var(--background-color);
    border: 1px solid var(--border-color);
    border-radius: calc(var(--radius) / 2);
    outline: none;
  }

  .input::placeholder {
    color: currentColor;
    opacity: 0.4;
  }

  .input:focus-visible {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px color-mix(in oklab, var(--accent) 40%, transparent);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .label.visible {
    position: static;
    width: auto;
    height: auto;
    margin: 0;
    overflow: visible;
    clip: auto;
    white-space: normal;
    font-size: 0.9em;
    opacity: 0.75;
  }

  .choices {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .choice {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: var(--button-cursor);
  }

  .choice input {
    width: 1rem;
    height: 1rem;
    margin: 0;
    accent-color: var(--accent);
    cursor: inherit;
  }

  .actions {
    display: flex;
    justify-content: space-around;
    width: 100%;
    max-width: 60vw;
    margin: auto auto;
  }

  .header-close {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    display: grid;
    place-items: center;
    width: 2rem;
    height: 2rem;
    padding: 0;
    font: inherit;
    line-height: 1;
    color: var(--foreground-color);
    background: transparent;
    border: 0;
    border-radius: 50%;
    cursor: var(--button-cursor);
  }

  .header-close:hover {
    background: color-mix(in oklab, currentColor 15%, transparent);
  }

  .header-close:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .overlay,
    .dialog {
      transition: none;
    }
  }
`

/**
 * @callback ResolveHandle
 * @param {string|null} value
 * @return {void}
 */

export class Modal {
  /** @type {number} */
  #closeTimer = 0

  /** @type {ModalConfig} */
  #config

  /** @type {HTMLDivElement | null} */
  #host = null

  /** @type {HTMLElement | null} */
  #input = null

  /** @type {MutationObserver | null} */
  #observer = null

  /** @type {boolean} */
  #opened = false

  /** @type {Element | null} */
  #previousFocus = null

  /** @type {string} */
  #previousOverflow = ''

  /** @type {Promise<string | null> | null} */
  #promise = null

  /** @type {ResolveHandle | null} */
  #resolve = null

  /** @type {ShadowRoot | null} */
  #shadow = null

  /**
   * @param {ModalOptions} config
   * @throws {TypeError} when the config is not an object, contains an unknown
   *   option, uses a wrong value type, or omits a required option.
   * @throws {RangeError} when `inputType` is not a supported value.
   */
  constructor(config) {
    if (
      config === null ||
      typeof config !== 'object' ||
      Array.isArray(config)
    ) {
      throw new TypeError('Modal: the configuration must be an object')
    }

    // Reject typos instead of silently ignoring them.
    for (const key of Object.keys(config)) {
      if (!Object.hasOwn(modalOptionTypes, key)) {
        throw new TypeError(`Modal: unknown option "${key}"`)
      }
    }

    /** @type {ModalConfig} */
    const options = { ...defaultModalConfig, ...config }

    for (const [key, expected] of Object.entries(modalOptionTypes)) {
      const value = options[/** @type {keyof modalOptionTypes} */ (key)]

      if (value === undefined) {
        if (key === 'title') {
          throw new TypeError(`Modal: option "${key}" is required`)
        }
        continue
      }

      // `inputDefaultValue` is checked against `inputType` further down.
      if (key === 'inputDefaultValue') continue

      const actual =
        value instanceof Node
          ? 'node'
          : Array.isArray(value)
            ? 'array'
            : typeof value

      if (actual !== expected) {
        throw new TypeError(
          `Modal: option "${key}" must be a ${expected}, got ${actual}`,
        )
      }
    }

    const { description, descriptionNode } = options

    if (description !== undefined && descriptionNode !== undefined) {
      throw new TypeError(
        'Modal: options "description" and "descriptionNode" are mutually exclusive',
      )
    }

    if (description === undefined && descriptionNode === undefined) {
      throw new TypeError(
        'Modal: option "description" or "descriptionNode" is required',
      )
    }

    for (const key of ['cancelVariant', 'closeVariant']) {
      if (
        !buttonVariants.includes(
          options[/**@type {'cancelVariant'|'closeVariant'}*/ (key)],
        )
      ) {
        throw new RangeError(
          `Modal: option "${key}" must be one of  ` +
            `${buttonVariants.map((variant) => `"${variant}"`).join(', ')}, ` +
            `got "${options[/** @type {keyof options} */ (key)]}"`,
        )
      }
    }

    const { inputType, inputOptions } = options

    if (!inputTypes.includes(inputType)) {
      throw new RangeError(
        `Modal: option "inputType" must be one of` +
          `${inputTypes.map((type) => `"${type}"`).join(', ')}, ` +
          `got "${inputType}"`,
      )
    }

    if (inputOptions !== undefined) {
      for (const option of inputOptions) {
        const isRecord =
          option !== null &&
          typeof option === 'object' &&
          !Array.isArray(option)
        const isSinglePair =
          isRecord &&
          Object.keys(option).length === 1 &&
          typeof Object.values(option)[0] === 'string'

        if (typeof option !== 'string' && !isSinglePair) {
          throw new TypeError(
            'Modal: each "inputOptions" entry must be a ' +
              'string or a single-key object with a string value',
          )
        }
      }
    }

    const usesChoices = inputType === 'select' || inputType === 'radio'

    if (
      usesChoices &&
      (inputOptions === undefined || inputOptions.length === 0)
    ) {
      throw new TypeError(
        `Modal: option "inputOptions" is required when "inputType" is "${inputType}"`,
      )
    }

    if (!usesChoices && inputOptions !== undefined) {
      throw new TypeError(
        'Modal: option "inputOptions" is only allowed when "inputType" is "select" or "radio"',
      )
    }

    const { inputDefaultValue } = options

    if (inputDefaultValue !== undefined && inputDefaultValue !== null) {
      if (!options.showInput) {
        throw new TypeError(
          'Modal: option "inputDefaultValue" is only allowed when "showInput" is true',
        )
      }

      const expected = inputType === 'checkbox' ? 'boolean' : 'string'
      const actual = typeof inputDefaultValue

      if (actual !== expected) {
        throw new TypeError(
          `Modal: option "inputDefaultValue" must be a ${expected}, got ${actual}`,
        )
      }

      // A default that matches no option would be silently dropped at render.
      if (usesChoices) {
        const values = (inputOptions ?? []).map((option) =>
          typeof option === 'string' ? option : String(Object.keys(option)[0]),
        )

        if (
          typeof inputDefaultValue !== 'string' ||
          !values.includes(inputDefaultValue)
        ) {
          throw new TypeError(
            'Modal: option "inputDefaultValue" does not match any "inputOptions" value',
          )
        }
      }
    }

    this.#config = { ...options }
  }

  /**
   * Mounts the dialog and waits for the user's answer.
   *
   * The promise is always settled: "Save"/Enter give the field value (trimmed
   * text, selected option, checked value, or `''` when `showInput` is false),
   * "Cancel"/Escape/backdrop click give `null`, and so does a dialog removed
   * from the page while it is still open.
   *
   * @returns {Promise<string | null>} the saved value, or `null` on cancel.
   */
  open() {
    if (this.#opened)
      return /** @type {Promise<string | null>} */ (this.#promise)

    this.#opened = true
    this.#promise = new Promise((resolve) => {
      this.#resolve = resolve
    })

    this.#previousFocus = document.activeElement
    if (document.body) {
      this.#previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }

    this.#mount()

    // Let the browser paint the initial state before playing the transition.
    requestAnimationFrame(() => this.#host?.classList.add('is-open'))
    requestAnimationFrame(() => this.#focus())

    return this.#promise
  }

  /**
   * Builds a labelled checkbox/radio row from runtime data.
   *
   * @param {'checkbox' | 'radio'} type
   * @param {string} text
   * @param {string} [value]
   * @returns {HTMLLabelElement}
   */
  #buildChoice(type, text, value = 'on') {
    const wrapper = document.createElement('label')
    wrapper.className = 'choice'

    const control = document.createElement('input')
    control.type = type
    control.value = value
    if (type === 'radio') control.name = 'modal-radio'

    const caption = document.createElement('span')
    caption.textContent = text

    wrapper.append(control, caption)
    return wrapper
  }

  /** Cancels the dialog (same as clicking "Cancel"). */
  #cancel() {
    this.#close(null)
  }

  /**
   * Closes the dialog (private: only `open()` is public).
   *
   * @param {string | null} [result] value given to the `open()` promise.
   */
  #close(result = null) {
    if (!this.#opened) return

    this.#opened = false

    // Take the resolver out of the instance first so the promise can only be
    // settled once, whatever the sequence of calls.
    const resolve = this.#resolve
    this.#resolve = null
    this.#promise = null

    this.#restorePage()

    // The promise is settled right now: callers never wait for the fade-out.
    if (resolve) resolve(result)

    this.#host?.classList.remove('is-open')

    clearTimeout(this.#closeTimer)
    this.#closeTimer = window.setTimeout(() => this.#unmount(), 160)
  }

  /** Focuses the input if there is one, otherwise the dialog itself. */
  #focus() {
    const target = this.#input ?? this.#shadow?.querySelector('.dialog')
    target?.focus()
  }

  #mount() {
    const host = document.createElement('div')
    host.className = 'modal-host'

    const shadow = host.attachShadow({ mode: 'open' })

    const style = document.createElement('style')
    style.textContent = css

    const template = document.createElement('template')
    template.innerHTML = basicHTML

    shadow.append(style, template.content.cloneNode(true))

    const overlay = /** @type {HTMLElement} */ (
      shadow.querySelector('.overlay')
    )
    const dialog = /** @type {HTMLElement} */ (shadow.querySelector('.dialog'))
    const headerCloseButton = /** @type {HTMLElement} */ (
      shadow.querySelector('.header-close')
    )
    const heading = /** @type {HTMLElement} */ (shadow.querySelector('.title'))
    const description = /** @type {HTMLElement} */ (
      shadow.querySelector('#modal-description')
    )
    const field = /** @type {HTMLElement} */ (shadow.querySelector('.field'))
    const label = /** @type {HTMLLabelElement} */ (
      shadow.querySelector('.label')
    )
    const textInput = /** @type {HTMLInputElement} */ (
      shadow.querySelector('#modal-input')
    )
    const select = /** @type {HTMLSelectElement} */ (
      shadow.querySelector('#modal-select')
    )
    const choices = /** @type {HTMLElement} */ (
      shadow.querySelector('#modal-choices')
    )
    const cancelButton = /** @type {HTMLElement} */ (
      shadow.querySelector('.button.cancel')
    )
    const saveButton = /** @type {HTMLElement} */ (
      shadow.querySelector('.button.primary')
    )

    const config = this.#config

    heading.textContent = config.title

    if (config.descriptionNode !== undefined) {
      // Cloned so the same Modal can be opened again (a fragment is emptied
      // when appended), and inserted without parsing any string as HTML.
      description.replaceChildren(config.descriptionNode.cloneNode(true))
      description.hidden = !description.hasChildNodes()
    } else {
      description.textContent = /** @type {string} */ (config.description)
      description.hidden = config.description === ''
    }

    dialog.classList.toggle(
      'has-scrollable-description',
      config.scrollableDescription,
    )
    dialog.classList.toggle('large', config.large)
    if (!description.hidden)
      dialog.setAttribute('aria-describedby', 'modal-description')

    // Optional header close button (the labels are fixed).
    dialog.classList.toggle('has-header-close', config.showHeaderCloseButton)
    headerCloseButton.hidden = !config.showHeaderCloseButton
    headerCloseButton.setAttribute('aria-label', 'close')
    headerCloseButton.title = 'close'

    // Optional cancel button.
    cancelButton.hidden = !config.showCancel
    cancelButton.textContent = config.cancelLabel || 'Cancel'
    cancelButton.setAttribute('variant', config.cancelVariant)

    // Optional save/confirm button (labelled by `closeLabel`).
    saveButton.hidden = !config.showClose
    saveButton.textContent = config.closeLabel || 'Close'
    saveButton.setAttribute('variant', config.closeVariant)

    // Optional input area.
    const labelText = config.inputLabel || 'Value'
    /** @type {HTMLElement | null} */
    let firstControl = null

    field.hidden = !config.showInput

    if (config.showInput) {
      label.textContent = labelText
      label.classList.toggle('visible', config.showInputLabel)
    }

    if (config.showInput && config.inputType === 'checkbox') {
      label.hidden = true
      textInput.hidden = true
      select.hidden = true
      choices.hidden = false
      const choice = this.#buildChoice('checkbox', labelText)
      choices.append(choice)
      firstControl = /** @type {HTMLInputElement} */ (
        choice.querySelector('input')
      )
    } else if (config.showInput && config.inputType === 'radio') {
      textInput.hidden = true
      select.hidden = true
      choices.hidden = false
      choices.setAttribute('role', 'radiogroup')
      choices.setAttribute('aria-labelledby', 'modal-label')
      this.#optionEntries().forEach((entry) => {
        choices.append(this.#buildChoice('radio', entry.label, entry.value))
      })
      firstControl = /** @type {HTMLInputElement} */ (
        choices.querySelector('input')
      )
    } else if (config.showInput && config.inputType === 'select') {
      label.htmlFor = 'modal-select'
      textInput.hidden = true
      select.hidden = false
      choices.hidden = true
      this.#optionEntries().forEach((entry) => {
        select.append(new Option(entry.label, entry.value))
      })
      firstControl = select
    } else if (config.showInput) {
      label.htmlFor = 'modal-input'
      textInput.hidden = false
      select.hidden = true
      choices.hidden = true
      firstControl = textInput
    } else {
      textInput.hidden = true
      select.hidden = true
      choices.hidden = true
    }

    // Optional initial value, already validated against the configured type.
    const defaultValue = config.inputDefaultValue

    if (defaultValue !== undefined && defaultValue !== null) {
      if (config.inputType === 'checkbox') {
        ;/** @type {HTMLInputElement} */ (firstControl).checked =
          /** @type {boolean} */ (defaultValue)
      } else if (config.inputType === 'radio') {
        const match = [...choices.querySelectorAll('input')].find(
          (control) => control.value === defaultValue,
        )
        if (match) match.checked = true
      } else if (config.inputType === 'select') {
        select.value = /** @type {string} */ (defaultValue)
      } else {
        textInput.value = /** @type {string} */ (defaultValue)
      }
    }

    // --- Behaviour -------------------------------------------------------

    headerCloseButton.addEventListener('click', () => this.#cancel())
    cancelButton.addEventListener('click', () => this.#cancel())
    saveButton.addEventListener('click', () => this.#save())

    // Enter anywhere in the input area validates, like the "Save" button.
    field.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return
      event.preventDefault()
      this.#save()
    })

    // Click on the backdrop (not on the dialog itself) cancels, unless disabled.
    if (!config.disableBackdropDismissal) {
      overlay.addEventListener('mousedown', (event) => {
        if (event.target === overlay) this.#cancel()
      })
    }

    shadow.addEventListener('keydown', (event) => {
      const keyEvent = /** @type {KeyboardEvent} */ (event)
      if (keyEvent.key === 'Escape') {
        event.preventDefault()
        this.#cancel()
        return
      }
      if (keyEvent.key !== 'Tab') return

      // Focus trap: keep the tab cycle inside the dialog.
      const focusable = /** @type {HTMLElement[]} */ ([
        ...shadow.querySelectorAll('button, button-custom, input, select'),
      ]).filter((element) => !element.closest('[hidden]'))
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (keyEvent.shiftKey && shadow.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!keyEvent.shiftKey && shadow.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    })

    this.#host = host
    this.#shadow = shadow
    this.#input = firstControl

    const parent = document.body ?? document.documentElement
    parent.append(host)

    // Safety net: if anything removes the dialog from the page while it is
    // still open, settle the promise instead of leaving it pending forever.
    const view = parent.ownerDocument?.defaultView
    if (view?.MutationObserver) {
      this.#observer = new view.MutationObserver(() => {
        if (this.#opened && this.#host && !this.#host.isConnected)
          this.#close(null)
      })
      this.#observer.observe(parent, { childList: true })
    }
  }

  /**
   * Flattens `inputOptions` into `{ value, label }` pairs.
   *
   * @returns {Array<{ value: string, label: string }>}
   */
  #optionEntries() {
    const options = /** @type {NonNullable<ModalConfig['inputOptions']>} */ (
      this.#config.inputOptions
    )
    return options.flatMap((option) => {
      if (option !== null && typeof option === 'object') {
        return Object.entries(option).map(([value, label]) => ({
          value: String(value),
          label: String(label),
        }))
      }
      return [{ value: String(option), label: String(option) }]
    })
  }

  /**
   * Reads the value of the configured input.
   *
   * @returns {string} text value, selected option, checked value, or `''`.
   */
  #readValue() {
    const config = this.#config

    if (!config.showInput) return ''

    switch (config.inputType) {
      case 'checkbox': {
        const box = /** @type {HTMLInputElement | null} */ (
          this.#shadow?.querySelector('#modal-choices input[type="checkbox"]')
        )
        return box?.checked ? box.value || 'on' : ''
      }
      case 'radio': {
        const checked = /** @type {HTMLInputElement | null} */ (
          this.#shadow?.querySelector(
            '#modal-choices input[type="radio"]:checked',
          )
        )
        return checked ? checked.value : ''
      }
      case 'select':
        return (
          /** @type {HTMLSelectElement | null} */ (
            this.#shadow?.querySelector('#modal-select')
          )?.value ?? ''
        )
      default:
        return (
          /** @type {HTMLInputElement | null} */ (this.#input)?.value?.trim() ??
          ''
        )
    }
  }

  #restorePage() {
    if (document.body) document.body.style.overflow = this.#previousOverflow
    this.#previousOverflow = ''

    const previousFocus = this.#previousFocus
    this.#previousFocus = null
    if (previousFocus instanceof HTMLElement) previousFocus.focus()
  }

  /** Saves the current value (same as clicking "Save"). */
  #save() {
    // Read the control directly: no dependency on any event being re-dispatched.
    this.#close(this.#readValue())
  }

  #unmount() {
    this.#observer?.disconnect()
    this.#observer = null

    this.#host?.remove()

    this.#host = null
    this.#shadow = null
    this.#input = null
    this.#closeTimer = 0
  }
}

export default Modal
