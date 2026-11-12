/** @import {HTMLTag} from './html-builder.types.js' */

/**
 *
 * @param {HTMLTag} tagObject
 * @returns {HTMLElement}
 */
export function buildTagElement(tagObject) {
  const el = document.createElement(tagObject.tag)
  if (Object.keys(tagObject).includes('content')) {
    setContent(
      el,
      /** @type {Extract<HTMLTag, {content: unknown}>} */ (tagObject),
    )
  }
  setAttributes(el, tagObject)
  return el
}

/**
 *
 * @param {HTMLElement} el
 * @param {HTMLTag} tagObject
 */
function setAttributes(el, tagObject) {
  if (tagObject.attributes !== undefined) {
    for (const [attrName, attrVal] of Object.entries(tagObject.attributes)) {
      el.setAttribute(attrName, attrVal)
    }
  }
}

/**
 *
 * @param {HTMLElement} el
 * @param {Extract<HTMLTag, {content: unknown}>} tagObject
 */
function setContent(el, tagObject) {
  if (Array.isArray(tagObject.content)) {
    tagObject.content.forEach((subTagObject) => {
      if (typeof subTagObject === 'string') {
        el.appendChild(document.createTextNode(subTagObject))
        return
      }
      el.appendChild(buildTagElement(subTagObject))
    })
  }
  if (typeof tagObject.content === 'string') {
    el.textContent = tagObject.content
  }
}
