/**
 * @module components/svg-icon/icons
 */
import { bombIcon } from './icons/bomb.js'
import { circleQuestionMarkIcon } from './icons/circle-question-mark.js'
import { eraserIcon } from './icons/eraser.js'
import { listTodoIcon } from './icons/list-todo.js'
import { logoIcon } from './icons/logo.js'
import { pencilLineIcon } from './icons/pencil-line.js'
import { scaleIcon } from './icons/scale.js'
import { shredderIcon } from './icons/shredder.js'
import { squareCheckBigIcon } from './icons/square-check-big.js'
import { squareIcon } from './icons/square.js'

/** @readonly */
export const ICON_NAMES = /** @type {const} */ ([
  'list-todo',
  'shredder',
  'scale',
  'eraser',
  'square-check-big',
  'pencil-line',
  'circle-question-mark',
  'square',
  'bomb',
  'logo',
])

/** @typedef {typeof ICON_NAMES[number]} IconName */

/** @type {Record<IconName, SVGElement>} */
export const icons = {
  'list-todo': listTodoIcon,
  shredder: shredderIcon,
  scale: scaleIcon,
  eraser: eraserIcon,
  'square-check-big': squareCheckBigIcon,
  'pencil-line': pencilLineIcon,
  'circle-question-mark': circleQuestionMarkIcon,
  square: squareIcon,
  bomb: bombIcon,
  logo: logoIcon,
}
