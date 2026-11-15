import { BasicComponentInterface } from '../../lib/interfaces/basic-component-interface.js'
import { QueuableComponent } from '../../lib/interfaces/queuable-component-mixin.js'
import { scrollbarStylesheet } from '../../utils/index.js'
import { CONTAINER_BOX_ATTRIBUTES } from './constants.js'
import stylesheet from './style.css' with { type: 'css' }

/** @import { ContainerBoxAttribute } from './constants.js' */
/** @import { BasicComponentConstructor, AttributeSetter } from '../../lib/interfaces/queuable-component-mixin.js' */

export class ContainerBox extends QueuableComponent(
  /** @type {BasicComponentConstructor & { observedAttributes: ContainerBoxAttribute[] }} */ (
    BasicComponentInterface
  ),
) {
  /**
   * @readonly
   * @type {ContainerBoxAttribute[]}
   */
  static get observedAttributes() {
    return [...CONTAINER_BOX_ATTRIBUTES]
  }

  /**
   * @readonly
   * @type {string}
   */
  static get tag() {
    return 'container-box'
  }

  /** @type {Record<ContainerBoxAttribute, AttributeSetter>} */
  _attributeSetters = {
    heading: (_, newValue) => {
      if (newValue === this.#heading) return false
      this.#nextHeading = newValue
      return true
    },
    'heading-level': (_, newValue) => {
      if (newValue === this.#headingLevel) return false
      this.#nextHeadingLevel = newValue
      return true
    },
    'no-padding': (_, newValue) => {
      if ((newValue !== null) === this.#noPadding) return false
      this.#nextNoPadding = newValue !== null
      return true
    },
  }

  /**
   * @type {string}
   */
  #heading = ''

  /**
   * @type {string}
   */
  #headingLevel = '1'

  /**
   * @type {string | null}
   */
  #nextHeading = null

  /**
   * @type {string | null}
   */
  #nextHeadingLevel = null

  /**
   * @type {boolean | null}
   */
  #nextNoPadding = null

  /**
   * @type {boolean}
   */
  #noPadding = false

  constructor() {
    super()
    this.stylesheets.push(scrollbarStylesheet)
    this.stylesheets.push(stylesheet)
    this.adoptStyleSheets()

    const template = document.createElement('template')
    const container = this.#createDiv('container')
    const header = this.#createDiv('header')

    const title = document.createElement(`h${this.#headingLevel}`)
    title.id = 'box-title'
    title.innerText = ''

    const content = this.#createDiv('content')
    content.appendChild(this.#createSlot())
    header.appendChild(title)

    const headerActions = this.#createDiv('actions')
    headerActions.appendChild(this.#createSlot('actions'))
    header.appendChild(headerActions)

    const footer = this.#createDiv('footer')
    footer.appendChild(this.#createSlot('footer'))
    container.appendChild(header)
    container.appendChild(content)
    container.appendChild(footer)
    template.content.appendChild(container)
    if (!this.root.hasChildNodes()) {
      this.root.appendChild(template.content.cloneNode(true))
    }
  }

  _render() {
    if (!this.root || !this.isConnected) {
      return
    }

    const titleTag = this.root.getElementById('box-title')
    if (titleTag !== null) {
      if (this.#nextHeading !== null) {
        titleTag.innerText = this.#nextHeading
        this.#heading = this.#nextHeading
        this.#nextHeading = null
      }

      if (this.#nextHeadingLevel !== null) {
        titleTag.replaceWith(this.#createTitleTag(this.#nextHeadingLevel))
        this.#headingLevel = this.#nextHeadingLevel
        this.#nextHeadingLevel = null
      }
    }
    if (this.#nextNoPadding !== null) {
      const contentClasses = this.root.getElementById('content')?.classList
      if (contentClasses !== undefined) {
        if (this.#nextNoPadding) contentClasses.add('nopadding')
        else contentClasses.remove('nopadding')
        this.#nextNoPadding = null
      }
    }
  }

  /**
   * @param {string} divId
   * @returns {HTMLDivElement}
   */
  #createDiv(divId) {
    const div = document.createElement('div')
    div.id = divId

    return div
  }

  /**
   * @param {string} [name]
   * @returns {HTMLSlotElement}
   */
  #createSlot(name) {
    const slot = document.createElement('slot')
    if (name && typeof name === 'string' && name.trim() !== '') {
      slot.name = name
    }
    return slot
  }

  /**
   * @param {string | number} level
   * @returns {HTMLHeadingElement}
   */
  #createTitleTag(level) {
    const tag = /** @type {HTMLHeadingElement} */ (
      document.createElement(`h${level}`)
    )
    tag.id = 'box-title'
    tag.innerText = this.#heading
    if (this.#nextHeadingLevel !== null) {
      this.#headingLevel = this.#nextHeadingLevel
      this.#nextHeadingLevel = null
    }
    return tag
  }
}
