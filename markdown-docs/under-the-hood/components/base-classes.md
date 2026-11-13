---
title: Base classes
group: Under the hood/Components
order: 30
---

# Component base classes

Every custom element of the application extends `BasicComponentInterface`. The components are split into two groups:

- **App components** (`app-header`, `app-main`, `list-view`, `nav-lists`) extend `BasicComponentInterface` directly.
- **Platform components** (`button-custom`, `container-box`, `svg-icon`) also use the `QueuableComponent` mixin, which turns attribute changes into batched renders.

| File                                             | Exports                   |
| ------------------------------------------------ | ------------------------- |
| `js/lib/interfaces/basic-component-interface.js` | `BasicComponentInterface` |
| `js/lib/interfaces/queuable-component-mixin.js`  | `QueuableComponent`       |

## `BasicComponentInterface`

`BasicComponentInterface` extends `HTMLElement` and gives each component three things.

- **A tag name.** The static getter `tag` throws `Not implemented` in the base class. Each component overrides it, and `js/app.js` uses it to register the element: `customElements.define(SVGIcon.tag, SVGIcon)`.
- **A shadow root.** The constructor attaches an open shadow root and the `root` getter returns it. A component can opt out by calling `super(true)`. In that case, reading `root` throws an error. `svg-icon` is the only component that opts out: it renders its `<svg>` in the light DOM.
- **Stylesheet adoption.** A component pushes its `CSSStyleSheet` objects into the `stylesheets` array, then calls `adoptStyleSheets()`. The method appends them to `root.adoptedStyleSheets` and empties the array, so calling it again does not adopt the same sheet twice.

A typical constructor looks like this:

```js
import stylesheet from './style.css' with { type: 'css' }

export class AppHeader extends BasicComponentInterface {
  static get tag() {
    return 'app-header'
  }

  constructor() {
    super()
    this.stylesheets.push(stylesheet)
    this.adoptStyleSheets()
  }
}
```

## `QueuableComponent`

`QueuableComponent` is a mixin: a function that takes a base class and returns a new class that extends it.

```js
export class SVGIcon extends QueuableComponent(BasicComponentInterface) {
  // ...
}
```

The mixin implements `attributeChangedCallback` and `connectedCallback`, and asks the component for two members.

| Member              | Provided by   | Role                                                                                                                               |
| ------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `_attributeSetters` | the component | One function per observed attribute. It validates the new value, stores it, and returns `true` if the component must render again. |
| `_render()`         | the component | Updates the DOM from the stored values.                                                                                            |
| `_scheduleRender()` | the mixin     | Queues one call to `_render()`.                                                                                                    |

If a component does not provide `_attributeSetters` or `_render()`, the mixin's default implementation throws an error that names the component.

### How a render is scheduled

1. The browser calls `attributeChangedCallback` when an observed attribute changes.
2. The mixin calls the matching setter from `_attributeSetters`.
3. If the setter returns `true` and the element is connected, the mixin calls `_scheduleRender()`.
4. `_scheduleRender()` queues `_render()` in a microtask with `queueMicrotask`. A private flag prevents a second microtask from being queued while one is pending.

As a result, several attribute changes made in the same task produce a single render:

```js
const button = document.createElement('button-custom')
button.setAttribute('variant', 'ghost')
button.setAttribute('icon', 'bomb')
button.setAttribute('icon-size', '32px')
// _render() runs once, after the current task
```

`connectedCallback` also calls `_scheduleRender()`, so a component renders once when it enters the document, with every attribute that was set before.

### Typing

The mixin is generic. It reads the type of the attribute names from the `observedAttributes` of the base class, and requires `_attributeSetters` to have exactly one setter per attribute name. Forgetting a setter, or adding one for an unknown attribute, is a type error.

The base constructor is typed with `any[]` parameters. This is a TypeScript requirement for mixins: a mixin base constructor must have a single rest parameter of type `any[]`.

## Decisions

### The shadow root is open

- **What:** every component attaches its shadow root with `mode: 'open'`.
- **Why:** the Shadow DOM is used mainly for CSS isolation, and the mode has no effect on that. An open root keeps the component internals reachable from outside, which made some tests easier to write.
- **Alternative:** `mode: 'closed'`, which hides `shadowRoot` from outside code.

### The `root` getter can attach the shadow root

- **What:** the constructor attaches the shadow root, and the `root` getter attaches one if none exists yet.
- **Why:** the private field is typed `ShadowRoot | undefined`, because a component can opt out of the shadow root. The branch in the getter is a safety net that lets the getter return a plain `ShadowRoot`. Returning `ShadowRoot | undefined` would force a check in every component, each time it uses `root`.
- **Cost:** in practice the branch does not run, because the constructor has already attached the root.

### Rendering is batched in a microtask

- **What:** `_scheduleRender()` defers `_render()` with `queueMicrotask`.
- **Why:** the render is asynchronous. It does not run in the middle of the code that changes the attributes, but once that code has finished, so several changes produce one render.
- **Alternative:** `requestAnimationFrame`, which waits for the next frame. A microtask runs earlier, before the browser paints, so the component is never painted in an intermediate state.

### A mixin instead of a second base class

- **What:** the render scheduling is a mixin applied to `BasicComponentInterface`, not a class that the platform components extend.
- **Why:** to demonstrate the mixin pattern together with its typing, which is the complex part: the attribute names are inferred from the base class and checked against the setters.
- **Alternative:** an intermediate base class between `BasicComponentInterface` and the platform components.
- **Cost:** the typing is harder to read, and it needs `any[]` for the base constructor.

### `_render` and `_attributeSetters` are protected by convention

- **What:** the two members that the mixin declares and the component implements start with an underscore.
- **Why:** JavaScript has no `protected` keyword. The underscore marks a member that belongs to the contract between the mixin and the component, and that outside code should not call.
- **Comparison with the app components:** `list-view` and `nav-lists` have a public `render()` method that does a similar job. Nothing enforces that method or its name: these components do not use the mixin, so they have no contract to follow.
