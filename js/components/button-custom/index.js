import { BasicComponentInterface } from '../../lib/interfaces/basic-component-interface.js'
import { QueuableComponent } from '../../lib/interfaces/queuable-component-mixin.js'
import { isOneOf } from '../../utils/index.js'
import { ICON_NAMES } from '../svg-icon/icons.js'
import {
  BUTTON_VARIANTS,
  BUTTON_TYPES,
  BUTTON_ATTRIBUTES,
} from './constants.js'
import stylesheet from './style.css' with { type: 'css' }

/** @import { BasicComponentConstructor, AttributeSetter } from '../../lib/interfaces/queuable-component-mixin.js' */
/** @import {ButtonCustomAttributes, ButtonVariant} from './constants.js' */
/** @import {IconName} from '../svg-icon/icons.js' */

export class ButtonCustom extends QueuableComponent(
  /** @type {BasicComponentConstructor & { observedAttributes: ButtonCustomAttributes[] }} */ (
    BasicComponentInterface
  ),
) {
  static formAssociated = true

  /**
   * @readonly
   * @type {ButtonCustomAttributes[]}
   */
  static get observedAttributes() {
    return [...BUTTON_ATTRIBUTES]
  }

  /**
   * @readonly
   * @type {string}
   */
  static get tag() {
    return 'button-custom'
  }

  /**
   * @override
   * @type {Record<ButtonCustomAttributes, AttributeSetter>}
   */
  _attributeSetters = {
    disabled: (oldValue, newValue) => {
      const value = newValue !== null
      if (this.#disabled === value) return false
      this.#disabled = value
      return true
    },
    type: (oldValue, newValue) => {
      if (this.#type === newValue) return false
      if (newValue === null) {
        this.#type = 'button'
        return true
      }
      if (!isOneOf(BUTTON_TYPES, newValue)) {
        this.#type = 'button'
        console.error(`${newValue} is not a valid button type.`, {
          element: this,
        })
        return true
      }
      this.#type = newValue
      return true
    },
    icon: (oldValue, newValue) => {
      if (newValue === this.#icon) return false
      if (newValue === null) {
        this.#icon = null
        return true
      }
      if (!isOneOf(ICON_NAMES, newValue)) {
        console.error(`Invalid icon name: ${newValue}.`, { element: this })
        if (this.#icon === null) return false
        this.#icon = null
        return true
      }
      this.#icon = newValue
      return true
    },
    'icon-size': (oldValue, newValue) => {
      if (newValue === null) {
        this.#iconSize = '1rem'
        return true
      }
      if (!CSS.supports('width', newValue)) {
        console.error(`icon-size is not a valid CSS value (${newValue})`, {
          element: this,
        })
        this.#iconSize = '1rem'
        return true
      }
      this.#iconSize = newValue
      return true
    },
    variant: (oldValue, newValue) => {
      if (newValue === this.#variant) return false

      if (newValue === null) {
        this.#variant = 'default'
        return false
      }

      if (isOneOf(BUTTON_VARIANTS, newValue)) {
        this.#variant = newValue
        return false
      }

      console.error(`invalid button variant (${newValue})`, { element: this })
      this.#variant = 'default'
      return false
    },
    'hide-label': (oldValue, newValue) => {
      this.#hideLabel = newValue !== null
      return false
    },
    href: (oldValue, newValue) => {
      if (this.#href === newValue) return false
      this.#href = newValue
      return true
    },
    'href-target': (oldValue, newValue) => {
      if (this.#hrefTarget === newValue) return false
      this.#hrefTarget = newValue
      return true
    },
  }

  /** @type {HTMLSpanElement | HTMLAnchorElement | null} */
  #btnElement = null

  /**
   * @type {boolean}
   */
  #disabled = false

  /**
   * @type {boolean}
   */
  #hideLabel = false

  /** @type {string | null} */
  #href = null

  /** @type {string | null} */
  #hrefTarget = null

  /**
   * @type {IconName | null}
   */
  #icon = null

  /** @type {string} */
  #iconSize = '1rem'

  /** @type {ElementInternals} */
  #internals = this.attachInternals()

  /** @type {HTMLSpanElement | null} */
  #labelElement = null

  /** @type {MutationObserver} */
  #labelObserver = new MutationObserver(() => this.#setAriaLabel())

  /**
   * @type {import('./constants.js').ButtonType}
   */
  #type = 'button'

  /** @type {import('./constants.js').ButtonVariant} */
  #variant = 'default'

  constructor() {
    super()
    this.stylesheets.push(stylesheet)
    this.adoptStyleSheets()
    this.#syncStates()
    this.addEventListener('click', this.#handleClick)
    this.addEventListener('keyup', this.#handleKeyup)
    this.addEventListener('keydown', this.#handleKeydown)
  }

  /** @override */
  _render() {
    if (!this.isConnected) return

    this.#syncClickListener()
    this.#createLabelElement()

    this.#createBtnElement()

    if (this.#btnElement === null) {
      throw new Error('Failed to create custom-button element')
    }

    if (this.#icon !== null) {
      const icon = document.createElement('svg-icon')
      icon.setAttribute('name', this.#icon)
      icon.setAttribute('width', this.#iconSize)
      icon.setAttribute('height', this.#iconSize)
      this.#btnElement.insertBefore(
        icon,
        this.#btnElement.querySelector('.label'),
      )
    }

    this.root.replaceChildren(this.#btnElement)

    this.#setAriaLabel()
  }

  /**
   * Using an override to synchronise the component state
   * with the internals state after an attribute changed even
   * if no render is needed.
   *
   * @override
   * @param {string} attribute
   * @param {string | null} oldValue
   * @param {string | null} newValue
   */
  attributeChangedCallback(attribute, oldValue, newValue) {
    super.attributeChangedCallback(attribute, oldValue, newValue)
    this.#syncStates()
  }

  /**
   * Once the component is connected, this callback install
   * a mutation observer to set the aria-label when the
   * text in the slot changes.
   */
  connectedCallback() {
    super.connectedCallback()
    this.#labelObserver.observe(this, {
      childList: true, // nodes added or removed: el.textContent = 'After'
      characterData: true, // text edited in place: textNode.data = 'After'
      subtree: true, // text inside nested elements, such as <strong>
    })
  }

  disconnectedCallback() {
    this.#labelObserver.disconnect()
  }

  #createBtnElement() {
    if (this.#href === null) {
      this.#btnElement = /** @type {HTMLSpanElement} */ (
        document.createElement('span')
      )
      this.setAttribute('role', 'button')
      if (this.#disabled) {
        this.setAttribute('aria-disabled', 'true')
        this.removeAttribute('tabindex')
      } else {
        this.removeAttribute('aria-disabled')
        this.setAttribute('tabindex', '0')
      }
    } else {
      this.#btnElement = document.createElement('a')
      this.#btnElement.setAttribute('href', this.#href)
      this.removeAttribute('role')
      this.removeAttribute('tabindex')
      this.removeAttribute('aria-disabled')
      if (this.#hrefTarget !== null) {
        this.#btnElement.setAttribute('target', this.#hrefTarget)
      }
    }
    if (this.#labelElement !== null) {
      this.#btnElement.appendChild(this.#labelElement)
    }
  }

  #createLabelElement() {
    this.#labelElement = document.createElement('span')
    this.#labelElement.classList.add('label')
    this.#labelElement.appendChild(document.createElement('slot'))
  }

  #handleClick = () => {
    if (this.#href !== null || this.#disabled) return
    const form = this.#internals.form
    if (!form) return

    if (this.#type === 'submit') form.requestSubmit()
    else if (this.#type === 'reset') form.reset()
  }

  /**
   *
   * @param {KeyboardEvent} event
   */
  #handleKeydown = (event) => {
    if (event.repeat || this.#href !== null) return
    if (event.key === 'Enter') {
      this.click()
    } else if (event.key === ' ') {
      event.preventDefault() // stop the page from scrolling
    }
  }

  /**
   *
   * @param {KeyboardEvent} event
   */
  #handleKeyup = (event) => {
    if (event.key === ' ' && this.#href === null) this.click()
  }

  /**
   * Uses the <slot> text to set the ariaLabel
   * @returns {void}
   */
  #setAriaLabel() {
    const slot = this.root.querySelector('slot')
    if (slot === null) return

    // Get the right target, the element that carries the role, to
    // set the label.
    const target = this.#href === null ? this : this.#btnElement
    if (target !== this) this.removeAttribute('aria-label')

    const label = slot
      .assignedNodes()
      .map((n) => n.textContent)
      .join('')
    if (label.trim() === '') {
      console.warn('Button should have a label for accessibility', {
        element: this,
      })
      target?.removeAttribute('aria-label')
      return
    }
    if (target !== null) target.ariaLabel = label
  }

  /**
   * addEventListener ignores a second registration of the same function,
   * so this is safe to call on every render
   * @returns {void}
   */
  #syncClickListener() {
    if (this.#href === null) {
      this.addEventListener('click', this.#handleClick)
    } else {
      this.removeEventListener('click', this.#handleClick)
    }
  }

  /**
   * Keeps the internal states synced with the
   * component state.
   * @returns {void}
   */
  #syncStates() {
    this.#internals.states.clear()
    this.#internals.states.add(this.#variant)
    if (this.#icon !== null) this.#internals.states.add('icon')
    if (this.#hideLabel) this.#internals.states.add('hide-label')
  }
}
