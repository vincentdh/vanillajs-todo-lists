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
    title: (_, newValue) => {
      if (newValue === this.#title) return false
      this.#nextTitle = newValue
      return true
    },
    'title-level': (_, newValue) => {
      if (newValue === this.#titleLevel) return false
      this.#nextTitleLevel = newValue
      return true
    },
    'no-padding': (_, newValue) => {
      if ((newValue !== null) === this.#noPadding) return false
      this.#nextNoPadding = newValue !== null
      return true
    },
  }

  /**
   * @type {boolean | null}
   */
  #nextNoPadding = null

  /**
   * @type {string | null}
   */
  #nextTitle = null

  /**
   * @type {string | null}
   */
  #nextTitleLevel = null

  /**
   * @type {boolean}
   */
  #noPadding = false

  /**
   * @type {string}
   */
  #title = ''

  /**
   * @type {string}
   */
  #titleLevel = '1'

  constructor() {
    super()
    this.stylesheets.push(scrollbarStylesheet)
    this.stylesheets.push(stylesheet)
    this.adoptStyleSheets()

    const template = document.createElement('template')
    const container = this.#createDiv('container')
    const header = this.#createDiv('header')

    const title = document.createElement(`h${this.#titleLevel}`)
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
      if (this.#nextTitle !== null) {
        titleTag.innerText = this.#nextTitle
        this.#title = this.#nextTitle
        this.#nextTitle = null
      }

      if (this.#nextTitleLevel !== null) {
        titleTag.replaceWith(this.#createTitleTag(this.#nextTitleLevel))
        this.#titleLevel = this.#nextTitleLevel
        this.#nextTitleLevel = null
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
    tag.innerText = this.#title
    if (this.#nextTitleLevel !== null) {
      this.#titleLevel = this.#nextTitleLevel
      this.#nextTitleLevel = null
    }
    return tag
  }
}
