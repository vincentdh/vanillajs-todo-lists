---
title: button-custom
group: Under the hood/Components
order: 31
---

# `button-custom`

`button-custom` is the button of the application. It is a platform component: it
is configured through attributes and uses the `QueuableComponent` mixin to
render.

| File                                       | Content                                         |
| ------------------------------------------ | ----------------------------------------------- |
| `js/components/button-custom/index.js`     | The `ButtonCustom` class                        |
| `js/components/button-custom/constants.js` | The allowed attribute names, variants and types |
| `js/components/button-custom/style.css`    | The styles, adopted by the shadow root          |

## Usage

```html
<!-- A button with an icon and a visible label -->
<button-custom variant="danger" icon="shredder">Delete list</button-custom>

<!-- An icon-only button: the label is hidden but still announced -->
<button-custom variant="ghost" icon="bomb" icon-size="32px" hide-label>
  Nuke data
</button-custom>

<!-- A link that looks like a button -->
<button-custom href="./docs" href-target="_blank">Documentation</button-custom>

<!-- A submit button inside a form -->
<form>
  <input name="task" />
  <button-custom type="submit">Add</button-custom>
</form>
```

The text between the tags is the label. It is always required, even when it is
hidden, because it gives the button its accessible name.

## Attributes

| Attribute     | Values                                                 | Default   | Effect                                                                      |
| ------------- | ------------------------------------------------------ | --------- | --------------------------------------------------------------------------- |
| `variant`     | `default`, `accent`, `info`, `warn`, `danger`, `ghost` | `default` | Sets the colors of the button.                                              |
| `icon`        | An icon name from `svg-icon`                           | none      | Shows the icon before the label.                                            |
| `icon-size`   | Any CSS length                                         | `1rem`    | Sets the width and height of the icon.                                      |
| `hide-label`  | Present or absent                                      | absent    | Hides the label visually.                                                   |
| `type`        | `button`, `submit`, `reset`                            | `button`  | Submits or resets the parent form on click.                                 |
| `disabled`    | Present or absent                                      | absent    | Removes the button from the tab order and stops it from acting on the form. |
| `href`        | A URL                                                  | none      | Renders the button as a link.                                               |
| `href-target` | A link target, such as `_blank`                        | none      | Sets the `target` of the link.                                              |

Each attribute has a setter in `_attributeSetters`. The setter validates the new
value before storing it:

- `variant` and `type` are checked against the lists in `constants.js`.
- `icon` is checked against the icon names exported by `svg-icon`.
- `icon-size` is checked with `CSS.supports('width', value)`, so any length that
  the browser accepts is valid.

An invalid value is reported with `console.error`, and the attribute falls back
to its default: `button` for `type`, `default` for `variant`, `1rem` for
`icon-size`, and no icon for `icon`.

Removing an attribute restores its default: `type` goes back to `button`,
`variant` to `default`, `icon-size` to `1rem`, and the icon is removed.

A setter returns `true` only when the shadow tree must be rebuilt. The setters
of `variant` and `hide-label` always return `false`: these two attributes only
change the custom states of the element, described below.

## Custom states

The component exposes its validated values as custom states, through
`ElementInternals.states`. The stylesheet selects on these states with
`:state()`, not on the attributes.

| State                                                  | Present when                      |
| ------------------------------------------------------ | --------------------------------- |
| `default`, `accent`, `info`, `warn`, `danger`, `ghost` | Always exactly one of them        |
| `icon`                                                 | The button has a valid icon       |
| `hide-label`                                           | The `hide-label` attribute is set |

The states are written in one place, the private method `#syncStates()`, which
rebuilds the set from the stored values. It is called from the constructor and
from an override of `attributeChangedCallback`:

```js
attributeChangedCallback(attribute, oldValue, newValue) {
  super.attributeChangedCallback(attribute, oldValue, newValue)
  this.#syncStates()
}
```

The call to `super` runs the setter and, if needed, queues a render in a
microtask. `#syncStates()` then runs synchronously, so the states are always up
to date before the render, and immediately after `setAttribute()` returns.

Outside code can use the states too, for example `button-custom:state(danger)`
in a selector or in `matches()`.

## Rendering

`_render()` rebuilds the content of the shadow root from the stored values. The
result depends on `href`.

|               | Without `href`                       | With `href`                    |
| ------------- | ------------------------------------ | ------------------------------ |
| Inner element | `<span>`                             | `<a href="…">`                 |
| Role          | The host element has `role="button"` | The link keeps its native role |
| Focus         | The host has `tabindex="0"`          | The link is focusable natively |

In both cases, the inner element contains the optional `<svg-icon>` and a
`<span class="label">` that holds a `<slot>`. The label text stays in the light
DOM and is projected through the slot.

## Keyboard

The host element is not a native button, so the component implements the
keyboard behavior of one:

- **Enter** activates the button on `keydown`. Repeated events from a held key
  are ignored.
- **Space** activates the button on `keyup`. The `keydown` event is cancelled to
  stop the page from scrolling.

Both keys call `click()`, so a keyboard activation and a mouse click follow the
same path.

When the button is rendered as a link, these handlers do nothing and the native
behavior of the `<a>` applies.

## Forms

`button-custom` is a form-associated custom element: the class sets
`static formAssociated = true` and calls `attachInternals()`. The browser then
gives the component a reference to its parent form through
`ElementInternals.form`.

On click, the component reads its `type`:

- `submit` calls `form.requestSubmit()`, which runs the form validation and
  dispatches the `submit` event, as a native submit button does.
- `reset` calls `form.reset()`.
- `button` does nothing.

A disabled button, or a button rendered as a link, never acts on the form.

The application uses this in `list-view`: the "+ Add" button has
`type="submit"`, and the form that contains it handles the `submit` event.

## Accessible name

When `hide-label` is set, the slot is hidden with `display: none`. Hidden
content is not part of the accessible name, so the button would be announced
without a name.

To prevent this, `_render()` reads the text of the nodes assigned to the slot
and copies it to `aria-label`. It does so on every render, whether the label is
hidden or not. If the label is empty, the component logs a warning in the
console.

The `aria-label` is set on the element that carries the role: the host element
for a button, and the inner `<a>` for a link.

The label can also change without any attribute change, for example with
`button.textContent = 'Save'`. A `MutationObserver` watches the content of the
host element and updates `aria-label` when the text changes. The observer starts
in `connectedCallback` and stops in `disconnectedCallback`.

## Styling

- **Layout.** The host element is `inline-block` and the inner element is
  `inline-flex`. A custom element is `inline` by default, and an inline box does
  not grow to contain the padding and border of its content.
- **Variants.** Each variant is a `:host(:state(…))` rule that only sets two
  custom properties, `--btn-background-color` and `--btn-color`. The default
  colors are set on `:host`. A single rule then applies the properties to the
  inner element.
- **Combined states.** Selectors combine states when a style depends on several
  of them, for example
  `:host(:state(icon):state(ghost):not(:state(hide-label)))`.
- **Hover.** The background is lightened with `color-mix()` and the button gets
  a glow.
- **Focus.** Keyboard focus draws a dotted outline with `:focus-visible`.
  Otherwise the outline is transparent, not removed: it stays invisible in
  normal use and becomes visible in forced-colors mode.
- **Ghost buttons.** A `ghost` button with an icon and a visible label shows
  only its icon. The label slides out on hover, with a `max-width` transition.
- **Icon-only buttons.** A button with an icon and a hidden label is round.

## Typing

The lists in `constants.js` are declared as constant arrays, and the union types
are derived from them:

```js
const BUTTON_VARIANTS = /** @type {const} */ ([
  'default',
  'accent',
  'info',
  'warn',
  'danger',
  'ghost',
])
/** @typedef {typeof BUTTON_VARIANTS[number]} ButtonVariant */
```

The same array is used at runtime to validate an attribute and at type-check
time to define `ButtonVariant`, so the two cannot drift apart. The helper
`isOneOf` is a type guard: after `isOneOf(BUTTON_VARIANTS, value)` returns
`true`, `value` has the type `ButtonVariant`.

## Decisions

### The host element is the button

- **What:** the shadow root contains a `<span>`, not a native `<button>`. The
  host element itself carries `role="button"` and `tabindex="0"`, and handles
  Enter and Space.
- **Why:** the other components treat `<button-custom>` as the button: they add
  their listeners to it, focus it and call `click()` on it. Making the host the
  button keeps a single interactive element. A native `<button>` in the shadow
  root would add a second one: the focus and the role would belong to the inner
  button, while the listeners stay on the host.
- **Alternative:** a native `<button>` inside the shadow root. The shadow root
  is open, so other components could reach that inner button, but working with
  the custom element itself is more intuitive.
- **Cost:** the component implements by hand what a native button provides:
  keyboard activation, focus and the disabled state.
- **Skill demonstrated:** ARIA roles, focus management, and the keyboard
  behavior of a button.

### One component for buttons and links

- **What:** when `href` is set, the component renders an `<a>` with the same
  appearance and drops the button role.
- **Why:** to mimic the button of component libraries, where giving a URL to the
  button renders a link instead (the `href` property of the MUI and Shoelace
  buttons, for example).
- **Alternative:** a separate link component, or a plain `<a>` styled like a
  button.
- **Cost:** two rendering modes in one component. Each handler must check which
  mode is active.

### An invalid attribute value is logged, not thrown

- **What:** a setter that receives an invalid value writes an error to the
  console and falls back to the default value of the attribute.
- **Why:** a bad attribute does not always make the component unusable, and an
  exception would stop the rendering. Native elements behave the same way:
  `button.setAttribute('type', 'invalid')` never throws, and the button falls
  back to its default type. The component does the same, and adds a console
  message that names the element.
- **Alternative:** throwing an error from the setter.

### The styles follow custom states, not attributes

- **What:** the stylesheet selects on `:state(danger)` or `:state(icon)`, not on
  `[variant='danger']` or `[icon]`.
- **Why:** an attribute selector matches the raw value that the caller wrote.
  With `variant="typo"`, no color rule matched and the button lost its colors,
  while the component had fallen back to `default`. A state is written by the
  component after validation, so the appearance always follows the validated
  value.
- **Alternative:** attribute selectors, with the default colors on `:host` as a
  fallback. This is enough for the variants, but `:host([icon])` still matches
  an invalid icon name.
- **Skill demonstrated:** `ElementInternals.states` and the `:state()`
  pseudo-class.

### The states are synced in `attributeChangedCallback`

- **What:** the component overrides `attributeChangedCallback`, calls the
  mixin's implementation with `super`, then calls `#syncStates()`.
- **Why:** a state change needs no DOM work, so it does not belong in
  `_render()`. The callback runs synchronously, even when the element is not
  connected, as native pseudo-classes such as `:disabled` do. The setters keep
  one job: they validate, store, and report whether a render is needed.
- **Alternative:** updating the states in `_render()`, which is deferred to a
  microtask and skipped while the element is disconnected, or in each setter,
  which spreads the bookkeeping.
- **Skill demonstrated:** overriding a method provided by a mixin and chaining
  to it with `super`.

### The label is the text content

- **What:** the accessible name always comes from the text between the tags,
  even when `hide-label` hides it. The component does not read an `aria-label`
  attribute set by the caller.
- **Why:** a deliberate choice: the text content is the single source of the
  label, visible or not. _(hypothesis)_ This is how a native `<button>` gets its
  name.
- **Alternative:** accepting an `aria-label` attribute, at least as a fallback
  for icon-only buttons.
- **Cost:** an icon-only button still needs its text, and a `MutationObserver`
  is required to keep `aria-label` in sync when the text changes.
- **Skill demonstrated:** slots, `assignedNodes()`, `MutationObserver`, and
  accessible names.

### A complete set of variants

- **What:** the component offers `default`, `accent`, `info`, `warn`, `danger`
  and `ghost`. The application does not use `info` and `warn`.
- **Why:** to show a complete set, as a reusable button component would provide.
