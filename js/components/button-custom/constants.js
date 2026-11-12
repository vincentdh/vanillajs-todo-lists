/** @readonly */
const BUTTON_VARIANTS = /** @type {const} */ ([
  'default',
  'accent',
  'info',
  'warn',
  'danger',
  'ghost',
])
/** @typedef {typeof BUTTON_VARIANTS[number]} ButtonVariant */

/** @readonly */
const BUTTON_TYPES = /** @type {const} */ (['button', 'submit', 'reset'])
/** @typedef {typeof BUTTON_TYPES[number]} ButtonType */

/** @readonly */
const BUTTON_ATTRIBUTES = /** @type {const} */ ([
  'disabled',
  'type',
  'icon',
  'icon-size',
  'variant',
  'hide-label',
  'href',
  'href-target',
])
/** @typedef {typeof BUTTON_ATTRIBUTES[number]} ButtonCustomAttributes */

export { BUTTON_VARIANTS, BUTTON_TYPES, BUTTON_ATTRIBUTES }
