import { appendPaths, createSVGTag } from '../svg-utils.js'

/** @type {SVGSVGElement} */
const scaleIcon = createSVGTag()
scaleIcon.ariaLabel = 'Scale Icon'

/** @type {string[]} */
const paths = [
  'M12 3v18',
  'm19 8 3 8a5 5 0 0 1-6 0zV7',
  'M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1',
  'm5 8 3 8a5 5 0 0 1-6 0zV7',
  'M7 21h10',
]

appendPaths(scaleIcon, paths)

export { scaleIcon }
