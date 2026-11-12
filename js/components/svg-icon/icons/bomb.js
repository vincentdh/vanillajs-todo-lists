/**
 * Javascript recreation of "https://lucide.dev/icons/bomb"
 */
import { appendPaths, createSVGCircle, createSVGTag } from '../svg-utils.js'

/** @type {SVGSVGElement} */
const bombIcon = createSVGTag()
bombIcon.ariaLabel = 'Bomb icon'

/** @type {SVGCircleElement} */
const circle = createSVGCircle()
circle.setAttribute('cx', '11')
circle.setAttribute('cy', '13')
circle.setAttribute('r', '9')

bombIcon.appendChild(circle)

appendPaths(bombIcon, [
  'M14.35 4.65 16.3 2.7a2.41 2.41 0 0 1 3.4 0l1.6 1.6a2.4 2.4 0 0 1 0 3.4l-1.95 1.95',
  'm22 2-1.5 1.5',
])

export { bombIcon }
