import { createSVGRect, createSVGTag } from '../svg-utils.js'

/** @type {SVGSVGElement} */
const squareIcon = createSVGTag()
squareIcon.ariaLabel = 'Square icon'

/** @type {SVGRectElement} */
const rect = createSVGRect()
rect.setAttribute('height', '18')
rect.setAttribute('width', '18')
rect.setAttribute('x', '3')
rect.setAttribute('y', '3')
rect.setAttribute('rx', '2')

squareIcon.appendChild(rect)

export { squareIcon }
