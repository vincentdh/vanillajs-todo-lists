/**
 * @type {CSSStyleSheet}
 */
const scrollbarStylesheet = new CSSStyleSheet()

/**
 * @type {"scrollbar-non-webkit.css" | "scrollbar-webkit.css"}
 */
const targetedStyleSheetName = /firefox/i.test(navigator.userAgent)
  ? 'scrollbar-non-webkit.css'
  : 'scrollbar-webkit.css'

/**
 * @type {URL}
 */
const targetedStyleSheet = new URL(
  `../../css/${targetedStyleSheetName}`,
  import.meta.url,
)
scrollbarStylesheet.replaceSync(await (await fetch(targetedStyleSheet)).text())

/**
 *
 * @param {number} max
 * @returns
 */
export const randomMax = (max) => Math.floor(max * Math.random())
/**
 *
 * @param {number} min
 * @param {number} max
 * @returns
 */
export const randomMinMax = (min, max) =>
  Math.floor(Math.random() * (max - min + 1) + min)

/**
 *
 * @param {number} pct
 * @returns
 */
export const luck = (pct) => Math.random() * 100 < pct

/**
 *
 * @param {Array<unknown>} items
 * @returns {Array<unknown>}
 */
const shuffleArray = (items) => {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}

/**
 * @template T
 * @overload
 * @param {Array<T>} items
 * @param {number} max
 * @returns {Array<T>}
 */
/**
 * @template T
 * @param {Array<T>} items
 * @param {number} max
 * @returns {Array<T>}
 */
export const randomPick = (items, max) => {
  const pickedItem = []
  const maxItems = max
  const candidates = [...items]

  while (pickedItem.length < maxItems && candidates.length > 0) {
    shuffleArray(candidates)
    const index = randomMax(candidates.length)
    pickedItem.push(...candidates.splice(index, 1))
  }

  return pickedItem
}

export { scrollbarStylesheet }

/**
 * Checks that `value` is one of the allowed values, and narrows its type.
 *
 * @template {string} T
 * @param {readonly T[]} allowed
 * @param {unknown} value
 * @returns {value is T}
 */
export const isOneOf = (allowed, value) =>
  allowed.some((item) => item === value)
