---
title: svg-icon
group: Under the hood/Components
order: 33
---

# `svg-icon`

[`svg-icon`](/module/components-svg-icon/svgicon) displays one icon of the
application, as an inline `<svg>` element. It is a platform component: it is
configured through attributes and uses the
[`QueuableComponent`](/module/lib-interfaces-queuable-component-mixin/queuablecomponent)
mixin to render. Unlike the other components, it has
[no shadow root](#no-shadow-root).

| File                                                                           | Content                                                    |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| [`js/components/svg-icon/index.js`](/module/components-svg-icon)               | The [`SVGIcon`](/module/components-svg-icon/svgicon) class |
| [`js/components/svg-icon/constants.js`](/module/components-svg-icon-constants) | The names of the observed attributes                       |
| [`js/components/svg-icon/icons.js`](/module/components-svg-icon-icons)         | The list of icon names and the icon registry               |
| `js/components/svg-icon/icons/*.js`                                            | One module for each icon                                   |
| [`js/components/svg-icon/svg-utils.js`](/module/components-svg-icon-svg-utils) | Helpers that create SVG elements                           |
| `js/components/svg-icon/style.css`                                             | One rule, adopted by the root that holds the tag           |

## Usage

```html
<!-- An icon at the default size, 32 by 32 pixels -->
<svg-icon name="bomb"></svg-icon>

<!-- A smaller icon, with an accessible name -->
<svg-icon name="logo" width="1rem" height="1rem" aria-label="Logo"></svg-icon>
```

The application uses the component in two places:

- [`app-header`](/module/components-app-header/appheader) shows the `logo` icon
  next to the title.
- [`button-custom`](/module/components-button-custom/buttoncustom) creates an
  [`<svg-icon>`](/module/components-svg-icon/svgicon) when it has an `icon`
  attribute, and passes its `icon-size` as `width` and `height`.

## Attributes

| Attribute | Values                                                                         | Default | Effect                            |
| --------- | ------------------------------------------------------------------------------ | ------- | --------------------------------- |
| `name`    | An icon name from [`ICON_NAMES`](/module/components-svg-icon-icons/icon-names) | none    | Selects the icon to display.      |
| `width`   | An SVG length                                                                  | `32`    | Sets the `width` of the `<svg>`.  |
| `height`  | An SVG length                                                                  | `32`    | Sets the `height` of the `<svg>`. |

Any other attribute of the element is copied to the `<svg>` when the component
renders. This is how an `aria-label` set by the caller reaches the image.

## Icons

The component knows ten icons.

| Name                   | Source                            |
| ---------------------- | --------------------------------- |
| `bomb`                 | Lucide                            |
| `circle-question-mark` | Lucide                            |
| `eraser`               | Lucide                            |
| `list-todo`            | Lucide                            |
| `pencil-line`          | Lucide                            |
| `scale`                | Lucide                            |
| `shredder`             | Lucide                            |
| `square`               | Lucide                            |
| `square-check-big`     | Lucide                            |
| `logo`                 | Original SVG created by Claude.ai |

The Lucide icons are not loaded from the package. Each one is recreated in a
JavaScript module. The license of Lucide is reproduced in
`THIRD_PARTY_NOTICES.md`.

### How an icon is defined

Each module of `icons/` builds one `<svg>` element with the DOM API, when the
module is loaded, and exports it:

```js
import { appendPaths, createSVGCircle, createSVGTag } from '../svg-utils.js'

const bombIcon = createSVGTag()

const circle = createSVGCircle()
circle.setAttribute('cx', '11')
circle.setAttribute('cy', '13')
circle.setAttribute('r', '9')
bombIcon.appendChild(circle)

appendPaths(bombIcon, ['M14.35 4.65 16.3 2.7a2.41…', 'm22 2-1.5 1.5'])

export { bombIcon }
```

The helpers of `svg-utils.js` wrap `document.createElementNS()` with the SVG
namespace. An SVG element created with `document.createElement()` would be an
unknown HTML element, and the browser would not draw it.

[`createSVGTag()`](/module/components-svg-icon-svg-utils/createsvgtag) returns
an `<svg>` with the default attributes of Lucide: a `viewBox` of 24 by 24, no
fill, a stroke width of 2 and round line ends. The stroke color is
`currentColor`, so an icon takes the text color of its parent.

### The registry

`icons.js` imports the ten modules and exports two things:

- [`ICON_NAMES`](/module/components-svg-icon-icons/icon-names), a constant array
  of the names. The union type
  [`IconName`](/module/components-svg-icon-icons/iconname) is derived from it.
- [`icons`](/module/components-svg-icon-icons/icons), an object of type
  `Record<IconName, SVGElement>` that maps each name to its element.

The elements of the registry are never inserted in the page. They are templates:
the component inserts a copy, made with `cloneNode(true)`, so the same icon can
be displayed many times.

[`button-custom`](/module/components-button-custom/buttoncustom) imports
[`ICON_NAMES`](/module/components-svg-icon-icons/icon-names) to validate its own
`icon` attribute.

## Rendering

The constructor calls `super(true)`, which tells
[`BasicComponentInterface`](/module/lib-interfaces-basic-component-interface/basiccomponentinterface)
not to attach a shadow root. The `<svg>` is a child of the
[`<svg-icon>`](/module/components-svg-icon/svgicon) element, in the same tree as
the element itself.

`_render()` follows the same method as
[`container-box`](/module/components-container-box/containerbox): each setter
stores a "next" value, and the render applies the values that are pending.

1. If a name is pending, the component appends a copy of the icon to itself.
2. If a width or a height is pending, the component sets it on the `<svg>`. The
   first render always sets both: the pending dimensions start at 32.
3. The component copies the other attributes of the element to the `<svg>`.

The `name` setter only accepts a value from
[`ICON_NAMES`](/module/components-svg-icon-icons/icon-names), checked with the
type guard [`isOneOf`](/module/utils/isoneof).

## Styling

The stylesheet holds a single rule:

```css
:where(svg-icon) {
  display: inline-flex;
}
```

The component has no shadow root, so it has no place of its own to adopt a
stylesheet. In `connectedCallback`, it finds the root that contains it with
`getRootNode()`, which is the document or the shadow root of a parent component.
It adds the stylesheet to the `adoptedStyleSheets` of that root, unless the
stylesheet is already there.

- The rule is added once for each root, whatever the number of icons in it.
- `:where()` gives the selector a specificity of zero, so any rule of the parent
  that targets [`svg-icon`](/module/components-svg-icon/svgicon) wins.
  [`button-custom`](/module/components-button-custom/buttoncustom) uses this to
  set the margins of its icon.

## Typing

- [`SVG_ICON_ATTRIBUTES`](/module/components-svg-icon-constants/svg-icon-attributes)
  and [`ICON_NAMES`](/module/components-svg-icon-icons/icon-names) are constant
  arrays, and the types
  [`SVGIconAttribute`](/module/components-svg-icon-constants/svgiconattribute)
  and [`IconName`](/module/components-svg-icon-icons/iconname) are derived from
  them, as in the other platform components.
- [`icons`](/module/components-svg-icon-icons/icons) has the type
  `Record<IconName, SVGElement>`: the type checker reports a name of
  [`ICON_NAMES`](/module/components-svg-icon-icons/icon-names) that has no icon
  in the registry, and an icon whose name is not in `ICON_NAMES`.
- [`button-custom`](/module/components-button-custom/buttoncustom) types its
  icon as [`IconName`](/module/components-svg-icon-icons/iconname), so the two
  components share one definition of a valid icon name.

## Decisions

### No shadow root

- **What:** [`svg-icon`](/module/components-svg-icon/svgicon) is the only
  component without a shadow root. The `<svg>` is a light DOM child of the
  element.
- **Why:** to show a custom element that works without a shadow root. A shadow
  root is an option of a custom element, not a requirement, and the demo
  includes one component of each kind.
- **Alternative:** a shadow root that contains the `<svg>`, as in the other
  components. It would have worked too: the color of the parent is inherited
  through a shadow boundary.
- **Cost:** the component cannot adopt its own stylesheet; see the next entry.
- **Skill demonstrated:** custom elements with and without shadow DOM.

### The stylesheet is adopted by the containing root

- **What:** on connection, the component adds its stylesheet to the document or
  to the shadow root that contains it, with a `:where()` selector.
- **Why:** an inline style on the element looks dirty. A stylesheet pushed to
  the containing root gives every icon the same look, wherever it is used.
- **Alternative:** setting `display` as an inline style on the element, or
  declaring the rule in the global stylesheet and in each component that uses an
  icon.
- **Skill demonstrated:** giving a default style to a root that the component
  does not own, with `getRootNode()` and `adoptedStyleSheets`, and letting that
  root override it, with the zero specificity of `:where()`.

### The icons are JavaScript modules

- **What:** each icon is built with `createElementNS()` in its own module, then
  cloned at each use.
- **Why:** the icons were an excellent candidate to demonstrate building
  elements with `createElementNS()`.
- **Alternative:** `.svg` files loaded with `<img>` or `fetch()`, a sprite
  referenced with `<use>`, or the SVG markup in a string parsed with
  `innerHTML`.
- **Cost:** an icon cannot be copied from the Lucide site as it is. Each shape
  is rewritten by hand as DOM calls.
- **Skill demonstrated:** the SVG DOM, XML namespaces and `cloneNode()`.

### The icon names are listed twice

- **What:** [`ICON_NAMES`](/module/components-svg-icon-icons/icon-names) lists
  the names, and [`icons`](/module/components-svg-icon-icons/icons) uses the
  same names as keys. The `Record<IconName, SVGElement>` type keeps the two in
  sync.
- **Why:** to get the type and the list of names without a type cast.
  [`ICON_NAMES`](/module/components-svg-icon-icons/icon-names) is declared with
  `/** @type {const} */`, so the type checker knows each name. The
  [`IconName`](/module/components-svg-icon-icons/iconname) type is derived from
  it, and the same array validates a name at runtime in
  [`svg-icon`](/module/components-svg-icon/svgicon) and
  [`button-custom`](/module/components-button-custom/buttoncustom).
- **Alternative:** a single source, the registry. The type becomes
  `keyof typeof icons`, and the list becomes `Object.keys(icons)`. But
  `Object.keys()` returns `string[]`, so the list must be cast to `IconName[]`:
  the type checker is told what the array holds, it does not verify it.
- **Cost:** a new icon is declared in three places: its module, the list and the
  registry.

### Other attributes are passed to the `<svg>`

- **What:** an attribute that the component does not observe is copied to the
  `<svg>` at each render.
- **Why:** to demonstrate passing attributes through to an inner element. The
  `aria-*` attributes are the use case that justifies it.
- **Alternative:** one observed attribute for each value that the caller may
  set, such as `label`.
