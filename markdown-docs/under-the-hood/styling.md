---
title: Styling
group: Under the hood/Data and styling
order: 41
---

# Styling

The application is styled with plain CSS files. There is no preprocessor, no
utility framework and no CSS-in-JS library. The styles are split in two levels:

- **One global stylesheet**, `css/style.css`, linked from `index.html`. It
  declares the theme and lays out the page.
- **One stylesheet for each component**, next to its JavaScript file. It is
  imported as a module and adopted by the shadow root of the component, so its
  rules apply to that component only.

| File                                    | Scope                                                                             |
| --------------------------------------- | --------------------------------------------------------------------------------- |
| `css/style.css`                         | The page: theme tokens and layout                                                 |
| `css/scrollbar-webkit.css`              | Scrollbars, with `::-webkit-scrollbar`                                            |
| `css/scrollbar-non-webkit.css`          | Scrollbars, with the standard properties                                          |
| `js/components/app-header/style.css`    | [`app-header`](/module/components-app-header/appheader)                           |
| `js/components/app-main/style.css`      | [`app-main`](/module/components-app-main/appmain)                                 |
| `js/components/nav-lists/style.css`     | [`nav-lists`](/module/components-nav-lists/navlists)                              |
| `js/components/list-view/index.css`     | [`list-view`](/module/components-list-view/listview)                              |
| `js/components/button-custom/style.css` | [`button-custom`](/module/components-button-custom/buttoncustom)                  |
| `js/components/container-box/style.css` | [`container-box`](/module/components-container-box/containerbox)                  |
| `js/components/svg-icon/style.css`      | [`svg-icon`](/module/components-svg-icon/svgicon), adopted by the containing root |
| [`js/modal.js`](/module/modal)          | [`Modal`](/module/modal/modal): the styles are a string                           |

## How a component gets its styles

Every component uses a toplevel `await` with the function
[`loadStylesheet()`](/module/utils-loadstylesheet/loadstylesheet) to import it's
CSS stylesheet.

```js
import { loadStylesheet } from '../../utils/loadStylesheet.js'

const stylesheet = await loadStylesheet(new URL('./style.css', import.meta.url))
```

The [`loadStylesheet()`](/module/utils-loadstylesheet/loadstylesheet) returns a
`CSSStyleSheet` object, not text.

The component gives this object to its base class, which adds it to the
`adoptedStyleSheets` of the shadow root:

```js
constructor() {
  super()
  this.stylesheets.push(stylesheet)
  this.adoptStyleSheets()
}
```

- The file is loaded and parsed once, when the module is loaded. Every instance
  of the component adopts the same `CSSStyleSheet` object.
- No `<style>` or `<link>` element is added to the shadow tree.
- The file stays a real `.css` file, with the syntax highlighting, the
  formatting and the linting of the editor.

Two parts of the application work differently, and their pages explain how:
[`svg-icon`](/under-the-hood/components/svg-icon) has no shadow root and gives
its stylesheet to the root that contains it, and
[`Modal`](/under-the-hood/components/modal) carries its styles as a string.

## Scoped selectors

A stylesheet adopted by a shadow root only applies inside it, and the styles of
the page do not enter it. The selectors of a component can therefore be short:
`ul`, `li`, `#content`, `#header`. There is no naming convention to avoid
collisions, because there is nothing to collide with.

The host element is styled with `:host`, and with `:host(…)` when the style
depends on the state of the component.

## Theme

The shadow boundary stops selectors, but not inheritance. Custom properties are
inherited, so a property declared on `:root` is readable in every component. The
theme is a set of custom properties in `css/style.css`:

| Property                                   | Role                                        |
| ------------------------------------------ | ------------------------------------------- |
| `--background-color`, `--foreground-color` | The page background and the text            |
| `--surface`                                | The background of the header and the dialog |
| `--border-color`                           | The borders, the markers and the scrollbar  |
| `--accent`                                 | The highlights: focus, hover, accent button |
| `--danger-bg`, `--warn-bg`, `--info-bg`    | The backgrounds of the button variants      |
| `--danger-fg`, `--warn-fg`, `--info-fg`    | The text colors of the button variants      |
| `--unit`                                   | The base length, `0.25rem`                  |
| `--spacing`, `--radius`                    | Two and four units                          |
| `--font`                                   | The font family, `sans-serif`               |
| `--shadow-highlight`                       | The glow of a focused or hovered element    |
| `--scrollbar-thumb`, `--scrollbar-track`   | The colors of the scrollbars                |

- **Colors.** The colors are written with `oklch()`.
- **Lengths.** The spacing and the radius are multiples of `--unit`, so the
  whole scale changes with one value.
- **One theme.** The application has a single, dark theme.
- **Font.** The text uses the default sans-serif font of the system. No font
  file is downloaded.

### Variants through private properties

A component can also use custom properties for itself.
[`button-custom`](/module/components-button-custom/buttoncustom) declares two of
them, `--btn-background-color` and `--btn-color`. Each variant is a rule that
only sets these two properties, and a single rule applies them:

```css
:host(:state(danger)) {
  --btn-background-color: var(--danger-bg);
  --btn-color: var(--danger-fg);
}
```

## Page layout

The page never scrolls. Each panel scrolls inside its own box.

```text
body                 flex column, full height, overflow clipped
├── app-header       fixed height: 20 units
└── app-main         takes the rest; flex row with a gap
    ├── nav-lists    between 250 and 375 pixels wide
    └── list-view    takes the rest of the row
```

Inside a panel, [`container-box`](/under-the-hood/components/container-box)
repeats the same idea in a column: the header and the footer keep their size,
and the content takes the rest and scrolls. This relies on `min-height: 0` on
each flex item of the chain, without which a flex item never becomes smaller
than its content.

## States

The components show their state in three ways.

| Technique      | Where                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Custom states  | [`button-custom`](/module/components-button-custom/buttoncustom): `:host(:state(danger))`, `:host(:state(icon))`                      |
| Classes        | [`list-view`](/module/components-list-view/listview): `.completed`; [`nav-lists`](/module/components-nav-lists/navlists): `.selected` |
| Pseudo-classes | `:hover` and `:focus-visible` in every interactive component                                                                          |

Keyboard focus is drawn with `:focus-visible`, so a mouse click does not leave
an outline.

## Scrollbars

The scrollbars are thin and take the border color of the theme. Two stylesheets
do the same job in two ways: one with the standard properties `scrollbar-width`
and `scrollbar-color`, the other with the `::-webkit-scrollbar` pseudo-elements.
One of them is loaded at startup as a `CSSStyleSheet` and exported by
[`js/utils/index.js`](/module/utils).
[`container-box`](/module/components-container-box/containerbox) adopts it next
to its own stylesheet.

## Motion

- [`button-custom`](/module/components-button-custom/buttoncustom) animates the
  label of a `ghost` button with a transition on `max-width`.
- [`list-view`](/module/components-list-view/listview) plays an entrance
  animation on each task, delayed by the position of the task.
- [`Modal`](/module/modal/modal) fades in and out with transitions on `opacity`
  and `transform`.

[`list-view`](/module/components-list-view/listview) and
[`Modal`](/module/modal/modal) remove their animation under
`prefers-reduced-motion: reduce`.

## Requirements

The stylesheets use recent features of the platform: CSS module scripts with
import attributes, `adoptedStyleSheets`, the `:state()` pseudo-class, `oklch()`
and `color-mix()`. Two of them set the minimum versions.

The versions below come from caniuse.com, read in November 2026.

| Browser         | CSS module scripts, `with { type: 'css' }` | `:state()` | Minimum       |
| --------------- | ------------------------------------------ | ---------- | ------------- |
| Chrome and Edge | 123                                        | 125        | 125           |
| Opera           | 109                                        | 111        | 111           |
| Firefox         | 147                                        | 126        | 147           |
| Safari          | Not supported                              | 17.4       | Not supported |

Safari supports import attributes for JSON modules only. It cannot load a
component that imports a `.css` file, so the application does not start in
Safari. [Known limitations](/under-the-hood/known-limitations) explains what is
planned.

## Decisions

### Stylesheets are imported as modules and adopted

- **What:** each component imports its `.css` file with `with { type: 'css' }`
  and adds the resulting `CSSStyleSheet` to `adoptedStyleSheets`.
- **Why:** every instance of a component shares one stylesheet object, the
  styles stay in a real `.css` file that the editor understands, and no bundler
  is needed.
- **Alternative:** a `<style>` element in each shadow root, with the CSS in a
  JavaScript string, or a `<link rel="stylesheet">` in each shadow root.
- **Cost:** the browser must support CSS module scripts and import attributes;
  see "Requirements" above.
- **Skill demonstrated:** constructable stylesheets, CSS module scripts and
  import attributes.

### The theme is a set of custom properties

- **What:** the colors, the spacing and the font are custom properties on
  `:root`. The components read them and declare no color of their own.
- **Why:** custom properties are inherited through the shadow boundary, so they
  are the way to share a theme between components whose styles are isolated.
- **Alternative:** repeating the values in each stylesheet, or exposing `part`
  attributes and styling the components from the page with `::part()`.
- **Skill demonstrated:** CSS custom properties and style encapsulation.

### A single dark theme

- **What:** the application has one theme. It does not follow
  `prefers-color-scheme`.
- **Why:** a deliberate choice for this demo.
- **Alternative:** a light theme, selected with `prefers-color-scheme` or
  `light-dark()`.
- **Possible improvement:** a light theme that follows the setting of the
  system.
