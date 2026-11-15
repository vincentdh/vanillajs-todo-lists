import { BasicComponentInterface } from '../../lib/interfaces/basic-component-interface.js'
import { QueuableComponent } from '../../lib/interfaces/queuable-component-mixin.js'
import { isOneOf } from '../../utils/index.js'
import { SVG_ICON_ATTRIBUTES } from './constants.js'
import { icons, ICON_NAMES } from './icons.js'
import stylesheet from './style.css' with { type: 'css' }

/** @import { SVGIconAttribute } from './constants.js' */
/** @import { BasicComponentConstructor, AttributeSetter } from '../../lib/interfaces/queuable-component-mixin.js' */
/** @import { IconName } from './icons.js' */

export class SVGIcon extends QueuableComponent(
  /** @type {BasicComponentConstructor & { observedAttributes: SVGIconAttribute[] }} */ (
    BasicComponentInterface
  ),
) {
  /**
   * @readonly
   * @type {SVGIconAttribute[]}
   */
  static get observedAttributes() {
    return [...SVG_ICON_ATTRIBUTES]
  }

  /**
   * @readonly
   * @type {string}
   */
  static get tag() {
    return 'svg-icon'
  }

  /** @type {Record<SVGIconAttribute, AttributeSetter>} */
  _attributeSetters = {
    name: (_, newValue) => {
      if (
        newValue !== this.#iconName &&
        newValue !== null &&
        isOneOf(ICON_NAMES, newValue)
      ) {
        this.#nextIconName = newValue
        return true
      }
      return false
    },
    width: (_, newValue) => this.#setDimensionAttribute('width', newValue),
    height: (_, newValue) => this.#setDimensionAttribute('height', newValue),
  }

  /**
   * @type {{ width: string | number | null, height: string | number | null }}
   */
  #dimensions = {
    width: null,
    height: null,
  }

  /**
   * @type {IconName | null}
   */
  #iconName = null

  /**
   * @type {{ width: string | number | null, height: string | number | null }}
   */
  #nextDimensions = {
    width: 32,
    height: 32,
  }

  /**
   * @type {IconName | null}
   */
  #nextIconName = null

  constructor() {
    super(true)
  }

  _render() {
    if (
      this.#nextIconName !== null &&
      isOneOf(ICON_NAMES, this.#nextIconName)
    ) {
      this.appendChild(icons[this.#nextIconName].cloneNode(true))
      this.#iconName = this.#nextIconName
      this.#nextIconName = null
    }
    if (this.#nextDimensions.height !== null) {
      ;/** @type {HTMLInputElement} */ (this.firstChild).setAttribute(
        'height',
        this.#nextDimensions.height.toString(),
      )
      this.#dimensions.height = this.#nextDimensions.height
      this.#nextDimensions.height = null
    }
    if (this.#nextDimensions.width !== null) {
      ;/** @type {HTMLInputElement} */ (this.firstChild).setAttribute(
        'width',
        this.#nextDimensions.width.toString(),
      )
      this.#dimensions.width = this.#nextDimensions.width
      this.#nextDimensions.width = null
    }

    // Attributes which are not observed will be passed directly to the element.
    // ex: aria-* attributes
    for (const attribute of this.attributes) {
      if (isOneOf(SVG_ICON_ATTRIBUTES, attribute.name)) continue
      const element = this.firstElementChild
      if (element !== null) {
        element.setAttribute(
          attribute.name,
          this.getAttribute(attribute.name) || '',
        )
      }
    }
  }

  connectedCallback() {
    super.connectedCallback()
    const root = /** @type {Document | ShadowRoot} */ (this.getRootNode())
    if (!root.adoptedStyleSheets.includes(stylesheet)) {
      root.adoptedStyleSheets.push(stylesheet)
    }
  }

  /**
   * @param {'height' | 'width'} dimmension
   * @param {string | null} newValue
   * @returns {boolean}
   */
  #setDimensionAttribute(dimmension, newValue) {
    if (newValue !== this.#dimensions[dimmension]) {
      this.#nextDimensions[dimmension] = newValue
      return true
    }
    return false
  }
}
