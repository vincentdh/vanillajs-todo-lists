/** @import { BasicComponentInterface } from './basic-component-interface.js' */

/**
 * > [!NOTE]
 * > **Type `any` is used in this module**
 * >
 * > TypeScript only accepts a mixin base constructor
 * > with a single rest parameter of type `any[]`. Changing it to `unknown[]`
 * > breaks the `class extends Base` below.
 * @module
 */

/**
 * Attribute validation and setter for observed attributes.
 * If `newValue` is not valid, the function must log an
 * error in the console and fall back to the default value
 * of the attribute.
 *
 * @callback AttributeSetter
 * @param {string | null} oldValue raw old value. `null` if set for the first time.
 * @param {string | null} newValue raw new value. `null` if attribute is removed
 * @returns {boolean} `true` if the component must render again, otherwise `false`
 */

/**
 * @typedef {{ new (...args: any[]): BasicComponentInterface, tag: string }} BasicComponentConstructor
 * @typedef {() => void} RenderFunction Render function the component MUST implement.
 * @typedef {(attribute: string, oldValue: string, newValue: string) => boolean} AttributeChangeHandler Handle attribute change, return `true` if need to trigger a render.
 */

/**
 * Hook type; TAttr is the attribute-name type.
 * @template {string} TAttr
 * @typedef {{
 *   _render(): void,
 *   _scheduleRender(): void,
 *   connectedCallback(): void,
 *   attributeChangedCallback(attribute: string, oldValue: string | null, newValue: string | null): void,
 *   _attributeSetters: Record<TAttr, AttributeSetter>,
 * }} QueableComponentApi
 */

/**
 * @template {string} TAttr
 *  @typedef {(new (...args: any[]) => QueableComponentApi<TAttr>)} QueableComponentMixin
 */

/**
 * TAttr is inferred from the `observedAttributes` type on the Base argument.
 *
 * @see {@link lib/interfaces/queuable-component-mixin} for the `any` type usage
 *
 * @template {string} TAttr
 * @template {BasicComponentConstructor} TBase
 * @param {TBase & { observedAttributes: TAttr[] }} Base
 * @returns {TBase & QueableComponentMixin<TAttr>} Base class with the QueableComponentApi functions
 */
export const QueuableComponent = (Base) => {
  return class extends Base {
    /**
     * @type {Record<TAttr, AttributeSetter>}
     */
    get _attributeSetters() {
      throw new Error(
        `${this.constructor.name} ${/** @type {BasicComponentConstructor} */ (this.constructor).tag} must implement _attributeSetters`,
      )
    }

    /**
     * @type {boolean}
     */
    #renderScheduled = false

    /**
     * @abstract
     */
    _render() {
      throw new Error(
        `${this.constructor.name} ${/** @type {BasicComponentConstructor} */ (this.constructor).tag} must implement _render()`,
      )
    }

    _scheduleRender() {
      if (this.#renderScheduled) return
      this.#renderScheduled = true
      queueMicrotask(() => {
        this.#renderScheduled = false
        this._render()
      })
    }

    /**
     * @param {TAttr} attribute
     * @param {string | null} oldValue
     * @param {string | null} newValue
     */
    attributeChangedCallback(attribute, oldValue, newValue) {
      const setter = this._attributeSetters?.[attribute]
      if (setter === undefined) return
      if (setter(oldValue, newValue) && this.isConnected) this._scheduleRender()
    }

    connectedCallback() {
      this._scheduleRender()
    }
  }
}
