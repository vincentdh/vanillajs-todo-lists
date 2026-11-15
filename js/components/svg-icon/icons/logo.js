/**
 * Application logo. Original SVG created by: Claude.ai
 */
import { appendPaths, createSvgElement, createSVGTag } from '../svg-utils.js'

/** @type {SVGSVGElement} */
const logoIcon = createSVGTag()

logoIcon.setAttribute('viewBox', '0 0 32 32')

appendPaths(logoIcon, [
  'M16 24H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v9',
  'm8 9 2 2 4-4',
  'M17 9h3',
  'm8 15 2 2 4-4',
  'M17 15h3',
])

/** @type {SVGEllipseElement} */
const ellipse = /** @type {SVGEllipseElement} */ (createSvgElement('ellipse'))

ellipse.setAttribute('cx', '24')
ellipse.setAttribute('cy', '20')
ellipse.setAttribute('rx', '5')
ellipse.setAttribute('ry', '2')

logoIcon.appendChild(ellipse)

appendPaths(logoIcon, ['M19 20v7a5 2 0 0 0 10 0v-7', 'M19 23.5a5 2 0 0 0 10 0'])

export { logoIcon }
