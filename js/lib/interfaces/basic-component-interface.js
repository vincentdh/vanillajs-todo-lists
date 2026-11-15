/**
 * @interface
 */
export class BasicComponentInterface extends HTMLElement {
  /**
   * @readonly
   * @type {string}
   */
  static get tag() {
    throw new Error('Not implemented')
  }

  /**
   * @type {Array<CSSStyleSheet>}
   */
  stylesheets = []

  /** @type {ShadowRoot} */
  get root() {
    if (!this.#shouldHaveRoot) {
      throw new Error('This instance should not have shadow dom')
    }
    if (this.#root === undefined) {
      this.#root = this.attachShadow({ mode: 'open' })
    }
    return this.#root
  }

  /** @type {ShadowRoot | undefined} */
  #root

  /** @type {boolean} */
  #shouldHaveRoot = true

  /**
   * @param {boolean} [doNotAttachRoot]
   */
  constructor(doNotAttachRoot) {
    super()
    if (doNotAttachRoot) {
      this.#shouldHaveRoot = false
      return
    }
    this.#root = this.attachShadow({ mode: 'open' })
  }

  adoptStyleSheets() {
    if (this.stylesheets.length === 0) return
    if (this.root) {
      this.root.adoptedStyleSheets = [
        ...this.root.adoptedStyleSheets,
        ...this.stylesheets,
      ]
    }
    this.stylesheets.splice(0, this.stylesheets.length)
  }

  createRoot() {
    this.adoptStyleSheets()
  }
}
