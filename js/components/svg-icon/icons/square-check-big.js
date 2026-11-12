import { appendPaths, createSVGTag } from '../svg-utils.js'

/** @type {SVGSVGElement} */
const squareCheckBigIcon = createSVGTag()
squareCheckBigIcon.ariaLabel = 'Square Check Big icon'

/** @type {string[]} */
const paths = [
  'M21 10.656V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.344',
  'm9 11 3 3L22 4',
]
appendPaths(squareCheckBigIcon, paths)

export { squareCheckBigIcon }
