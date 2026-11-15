---
title: container-box
group: Under the hood/Components
order: 32
---

# `container-box`

[`container-box`](/module/components-container-box/containerbox) is the bordered
panel of the application: a heading, a scrollable content area and a footer. It
is a platform component: it is configured through attributes and uses the
[`QueuableComponent`](/module/lib-interfaces-queuable-component-mixin/queuablecomponent)
mixin to render. The two panels of the application,
[`nav-lists`](/module/components-nav-lists/navlists) and
[`list-view`](/module/components-list-view/listview), are each built inside one.

| File                                                                                     | Content                                                                   |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [`js/components/container-box/index.js`](/module/components-container-box)               | The [`ContainerBox`](/module/components-container-box/containerbox) class |
| [`js/components/container-box/constants.js`](/module/components-container-box-constants) | The names of the observed attributes                                      |
| `js/components/container-box/style.css`                                                  | The styles, adopted by the shadow root                                    |

## Usage

```html
<container-box heading="Groceries" heading-level="2" no-padding>
  <!-- Default slot: the content, which scrolls when it is too tall -->
  <ul>
    <li>Milk</li>
  </ul>

  <!-- Shown in the header, to the right of the heading -->
  <div slot="actions">
    <button-custom variant="ghost" icon="pencil-line">Rename</button-custom>
  </div>

  <!-- Shown under the content -->
  <div slot="footer">
    <button-custom variant="danger">Delete list</button-custom>
  </div>
</container-box>
```

The application creates the element in JavaScript, with
`document.createElement('container-box')` and `setAttribute()`.

## Attributes

| Attribute       | Values            | Default | Effect                                    |
| --------------- | ----------------- | ------- | ----------------------------------------- |
| `heading`       | Any text          | empty   | Sets the text of the heading.             |
| `heading-level` | A heading level   | `1`     | Sets the heading element: `<h1>`, `<h2>`… |
| `no-padding`    | Present or absent | absent  | Removes the padding of the content area.  |

Each attribute has a setter in `_attributeSetters`. A setter compares the new
value with the current one and returns `false` when nothing changes, so no
render is queued.

## Slots

The component does not create its content. The parent element provides it, and
three slots place it in the box.

| Slot      | Where it is shown                        | Used by                                                                                                    |
| --------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| (default) | The content area, between the two others | [`nav-lists`](/module/components-nav-lists/navlists), [`list-view`](/module/components-list-view/listview) |
| `actions` | The header, to the right of the heading  | [`list-view`](/module/components-list-view/listview) (the "Rename List" button)                            |
| `footer`  | The footer, centered                     | [`nav-lists`](/module/components-nav-lists/navlists), [`list-view`](/module/components-list-view/listview) |

The slotted elements stay in the light DOM of the parent component. The parent
keeps its references to them, adds its listeners and styles them with its own
stylesheet.

## Structure

The constructor builds the shadow tree once. It is never rebuilt afterwards.

```text
#container
├── #header
│   ├── <h1 id="box-title">        the heading
│   └── #actions
│       └── <slot name="actions">
├── #content
│   └── <slot>                     the default slot
└── #footer
    └── <slot name="footer">
```

The elements are identified by an `id`. The shadow root scopes them: an `id` of
the shadow tree cannot collide with an `id` of the page or of another instance.

## Rendering

`_render()` does not rebuild the tree. It applies the changes that are pending,
and nothing else.

Each attribute has two private fields: the current value (`#heading`) and the
next value (`#nextHeading`), which is `null` when there is nothing to apply.

1. The setter stores the new value in the "next" field and returns `true`.
2. The mixin queues one render in a microtask, whatever the number of attributes
   that changed.
3. `_render()` applies each "next" value that is not `null`, copies it to the
   current value and sets it back to `null`.

What `_render()` does for each attribute:

- **`heading`:** it replaces the text of the heading element.
- **`heading-level`:** it replaces the heading element with a new one of the
  requested level, which receives the current text.
- **`no-padding`:** it adds or removes the `nopadding` class on the content
  area.

`_render()` returns immediately when the element is not connected. The pending
values are kept, and they are applied by the render that `connectedCallback`
queues.

## Styling

- **Height.** The host element is a block that takes the full height of its
  parent. The inner container is a flex column.
- **Scrolling.** The header and the footer keep their size (`flex: none`). The
  content area takes the remaining height (`flex: 1` and `min-height: 0`) and
  scrolls vertically (`overflow-y: auto`). The heading and the footer therefore
  stay visible while the content scrolls.
- **Scrollbar.** The component adopts two stylesheets: its own, and the shared
  scrollbar stylesheet exported by [`js/utils/index.js`](/module/utils).
- **Theme.** The border, the radius and the spacing come from the custom
  properties `--border-color`, `--radius` and `--spacing`, declared in
  `css/style.css`. Custom properties are inherited through the shadow boundary.
- **Header.** The header is a flex row with `justify-content: space-between`:
  the heading is on the left and the `actions` slot on the right.

## Typing

The attribute names are declared once, in `constants.js`, as a constant array.
The union type
[`ContainerBoxAttribute`](/module/components-container-box-constants/containerboxattribute)
is derived from it:

```js
export const CONTAINER_BOX_ATTRIBUTES = /** @type {const} */ ([
  'heading',
  'heading-level',
  'no-padding',
])

/** @typedef {typeof CONTAINER_BOX_ATTRIBUTES[number]} ContainerBoxAttribute */
```

The same array feeds `observedAttributes` at runtime. `_attributeSetters` has
the type `Record<ContainerBoxAttribute, AttributeSetter>`, so the type checker
reports an attribute that has no setter, and a setter that has no attribute.

## Decisions

### The content is provided through slots

- **What:** the box has three slots (default, `actions` and `footer`). The
  parent component creates the content and keeps control of it.
- **Why:** the two panels share the same frame, so the frame is one standard
  component. Their content is markup, often a lot of it, and an attribute can
  only carry a string. Slots are the native way to give markup to a component.
- **Skill demonstrated:** composition with default and named slots.

### The heading is an attribute

- **What:** the heading text comes from the `heading` attribute, and the box
  creates the heading element itself. In
  [`button-custom`](/module/components-button-custom/buttoncustom), the label is
  the text content of the element.
- **Why:** the heading is a plain string, and a string does not need a slot.
- **Alternative:** a `heading` slot, filled by the parent with its own heading
  element.

### The heading level is configurable

- **What:** `heading-level` selects the heading element. The default is level 1,
  and the two panels of the application set level 2.
- **Why:** the level of a heading depends on the place where the box is used,
  not on its appearance. The parent knows that place, so the parent sets the
  level. The application only shows level 2, because it has no other place that
  needs a box.
- **Alternative:** a fixed heading element.

### A render applies the pending changes only

- **What:** the tree is built once in the constructor. `_render()` patches the
  heading and the padding from the "next" fields.
  [`button-custom`](/module/components-button-custom/buttoncustom) does the
  opposite: it rebuilds its shadow tree on each render.
- **Why:** the difference is intentional. The project demonstrates several
  methods, and the two platform components show two ways to render (see
  [Why it is built this way](/portfolio-context/why-it-is-built-this-way)).
- **Alternative:** rebuilding the shadow tree on each render, as
  [`button-custom`](/module/components-button-custom/buttoncustom) does.
- **Cost:** two fields for each attribute, and a render method that must handle
  each attribute separately.
