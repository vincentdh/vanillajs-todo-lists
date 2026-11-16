/**
 * Used to load a CSS stylesheet as a CSSStyleSheet object like the
 * `import attributes` feature.
 *
 * This is a workaround for [issue #16: Blank page in Safari](https://github.com/vincentdh/vanillajs-todo-lists/issues/16)
 *
 * @example
 *
 * import {loadStylesheet} from 'utils/loadStylesheet.js'
 * const stylesheet = await loadStylesheet(new URL('./style.css', import.meta.url))
 *
 * @param {string | URL} url
 * @returns {Promise<CSSStyleSheet>}
 */
export async function loadStylesheet(url) {
  const stylesheet = new CSSStyleSheet()
  const fetchReply = await fetch(url)
  if (fetchReply.status !== 200) {
    const msg = `HTTP/${fetchReply.status} ${fetchReply.statusText}`
    throw new Error(`Unable to load stylesheet: ${msg}`)
  }
  await stylesheet.replace(await fetchReply.text())
  return stylesheet
}
