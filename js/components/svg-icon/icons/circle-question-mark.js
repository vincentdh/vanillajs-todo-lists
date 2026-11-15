/**
 * Javascript recreation of "https://lucide.dev/icons/circle-question-mark"
 */
import { appendPaths, createSVGCircle, createSVGTag } from '../svg-utils.js'

/**
 *
 * @type {SVGSVGElement}
 */
const circleQuestionMarkIcon = createSVGTag()
circleQuestionMarkIcon.ariaLabel = 'Circle Question Mark icon'

/**
 *
 * @type {SVGCircleElement}
 */
const circle = createSVGCircle()
circle.setAttribute('cx', '12')
circle.setAttribute('cy', '12')
circle.setAttribute('r', '10')

circleQuestionMarkIcon.appendChild(circle)

/**
 *
 * @type {string[]}
 */
const paths = ['M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3', 'M12 17h.01']

appendPaths(circleQuestionMarkIcon, paths)

export { circleQuestionMarkIcon }
