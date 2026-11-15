/**
 * Javascript recreation of "https://lucide.dev/icons/list-todo"
 */

import { createSVGTag, createSVGRect, appendPaths } from '../svg-utils.js'

/** @type {SVGSVGElement} */
const listTodoIcon = createSVGTag()
listTodoIcon.ariaLabel = 'List To-do icon'

/** @type {SVGRectElement} */
const rect = createSVGRect()
rect.setAttribute('x', '3')
rect.setAttribute('y', '4')
rect.setAttribute('width', '6')
rect.setAttribute('height', '6')
rect.setAttribute('rx', '1')

/** @type {string[]} */
const paths = ['M13 5h8', 'M13 12h8', 'M13 19h8', 'm3 17 2 2 4-4']

appendPaths(listTodoIcon, paths)

listTodoIcon.appendChild(rect)

export { listTodoIcon }
