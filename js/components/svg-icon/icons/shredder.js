import { appendPaths, createSVGTag } from '../svg-utils.js'

/** @type {SVGSVGElement} */
const shredderIcon = createSVGTag()
shredderIcon.ariaLabel = 'Shredder icon'

/** @type {string[]} */
const paths = [
  'M4 13V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v5',
  'M14 2v5a1 1 0 0 0 1 1h5',
  'M10 22v-5',
  'M14 19v-2',
  'M18 20v-3',
  'M2 13h20',
  'M6 20v-3',
]

appendPaths(shredderIcon, paths)

export { shredderIcon }
