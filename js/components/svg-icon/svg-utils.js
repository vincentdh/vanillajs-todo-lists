/**
 * XML Namespace for SVG specification.
 *
 * @type {"http://www.w3.org/2000/svg"}
 * @see {@link http://www.w3.org/2000/svg}
 */
export const SVG_NS = 'http://www.w3.org/2000/svg'

/**
 * Wrapper for document.createElementNS to create HTML elements
 * using {@link SVG_NS}.
 *
 * @see {@link https://developer.mozilla.org/fr/docs/Web/API/Document/createElementNS}
 * @param {string} elementName Element name to create
 * @returns {SVGElement}
 */
function createSvgElement(elementName) {
  return document.createElementNS(SVG_NS, elementName)
}

/**
 * Create a &lt;svg&gt; element with Lucide default attributes.
 * Icon size is 32x32 by default.
 *
 * @returns {SVGSVGElement}
 */
function createSVGTag() {
  const tag = /** @type {SVGSVGElement} */ (createSvgElement('svg'))
  tag.setAttribute('width', '32')
  tag.setAttribute('height', '32')
  tag.setAttribute('viewBox', '0 0 24 24')
  tag.setAttribute('fill', 'none')
  tag.setAttribute('stroke', 'currentColor')
  tag.setAttribute('stroke-width', '2')
  tag.setAttribute('stroke-linecap', 'round')
  tag.setAttribute('stroke-linejoin', 'round')
  return tag
}

/**
 * Create a &lt;rect&gt; element.
 *
 * @returns {SVGRectElement}
 */
function createSVGRect() {
  return /** @type {SVGRectElement} */ (createSvgElement('rect'))
}

/**
 * Create a &lt;circle&gt; element.
 *
 * @returns {SVGCircleElement}
 */
function createSVGCircle() {
  return /** @type {SVGCircleElement} */ (createSvgElement('circle'))
}

/**
 * Create a &lt;path&gt; element
 *
 * @param {string} pathData SVG path commands
 * @returns {SVGPathElement}
 */
function createPath(pathData) {
  const p = /** @type {SVGPathElement} */ (createSvgElement('path'))
  p.setAttribute('d', pathData)
  return p
}

/**
 * Add multiple &lt;path&gt; to an <svg> element using an array of string.
 *
 * @param {SVGSVGElement} svg
 * @param {string[]} paths
 */
function appendPaths(svg, paths) {
  for (const path of paths) {
    svg.appendChild(createPath(path))
  }
}

export {
  createSvgElement,
  createSVGTag,
  createSVGRect,
  createSVGCircle,
  createPath,
  appendPaths,
}
