---
title: Skills map
group: Portfolio context
order: 20
---

# Skills map

Each table lists a skill, the file that shows it best, and the documentation page that explains it.

## Design patterns

| Skill                                                     | Where in the code                                                                                 | Explained in                                                        |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Adapter                                                   | `js/lib/adapters/local-storage-adapter.js`                                                        | Data persistence                                                    |
| Abstract interface, enforced at runtime with `new.target` | `js/lib/interfaces/storage-interface.js`                                                          | Data persistence                                                    |
| Dependency injection                                      | `js/lib/services/storage.js`, `js/models/lists.js`                                                | Data persistence                                                    |
| Static factory methods                                    | `js/models/list.js`, `js/models/item.js`                                                          | Data persistence                                                    |
| Custom error class and error chaining with `cause`        | `js/lib/errors/storage-error.js`, `js/models/item.js`                                             | Data persistence                                                    |
| Serialization of private state with `toJSON()`            | `js/models/list.js`, `js/models/item.js`                                                          | Data persistence                                                    |
| Module-level singleton                                    | `js/lib/services/storage.js`, `js/models/lists.js`                                                | [Architecture](/under-the-hood/architecture)                        |
| Observer, through typed custom events                     | `js/components/nav-lists/list-selected-event.js`, `js/components/list-view/list-renamed-event.js` | [Architecture](/under-the-hood/architecture)                        |
| Abstract base class for components                        | `js/lib/interfaces/basic-component-interface.js`                                                  | [Components: base classes](/under-the-hood/components/base-classes) |
| Mixin (class factory)                                     | `js/lib/interfaces/queuable-component-mixin.js`                                                   | [Components: base classes](/under-the-hood/components/base-classes) |
| Render batching in a microtask                            | `js/lib/interfaces/queuable-component-mixin.js`                                                   | [Components: base classes](/under-the-hood/components/base-classes) |
| Promise-based API for a user interaction                  | `js/modal.js`                                                                                     | Components: modal                                                   |
| Strict validation of a configuration object               | `js/modal.js`                                                                                     | Components: modal                                                   |
| Data-driven DOM builder                                   | `js/utils/html-builder.js`                                                                        | Components: app-header                                              |

## Web platform APIs

| Skill                                               | Where in the code                                | Explained in                                                          |
| --------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------- |
| Custom elements and their lifecycle callbacks       | `js/app.js`, `js/components/`                    | [Architecture](/under-the-hood/architecture)                          |
| Shadow DOM                                          | `js/lib/interfaces/basic-component-interface.js` | [Components: base classes](/under-the-hood/components/base-classes)   |
| Constructable stylesheets (`adoptedStyleSheets`)    | `js/lib/interfaces/basic-component-interface.js` | Styling                                                               |
| CSS and JSON module imports (import attributes)     | `js/components/app-main/index.js`                | [Architecture](/under-the-hood/architecture)                          |
| Default and named slots                             | `js/components/container-box/index.js`           | Components: container-box                                             |
| `<template>` cloning                                | `js/components/container-box/index.js`           | Components: container-box                                             |
| Form-associated custom element (`ElementInternals`) | `js/components/button-custom/index.js`           | [Components: button-custom](/under-the-hood/components/button-custom) |
| Observed attributes with validation                 | `js/components/button-custom/index.js`           | [Components: button-custom](/under-the-hood/components/button-custom) |
| SVG built with `createElementNS`                    | `js/components/svg-icon/svg-utils.js`            | Components: svg-icon                                                  |
| Event delegation                                    | `js/components/nav-lists/index.js`               | Components: nav-lists                                                 |
| `FormData` and form submission                      | `js/components/list-view/index.js`               | Components: list-view                                                 |
| `MutationObserver`                                  | `js/modal.js`                                    | Components: modal                                                     |
| Web Storage API                                     | `js/lib/adapters/local-storage-adapter.js`       | Data persistence                                                      |
| `crypto.randomUUID()`                               | `js/models/list.js`, `js/models/item.js`         | Data persistence                                                      |
| Top-level `await` with `fetch`                      | `js/utils/index.js`                              | Styling                                                               |

## JavaScript language

| Skill                                          | Where in the code                  | Explained in                                 |
| ---------------------------------------------- | ---------------------------------- | -------------------------------------------- |
| ES modules and a barrel file                   | `js/components/index.js`           | [Architecture](/under-the-hood/architecture) |
| Private class fields and methods               | `js/models/list.js`, `js/modal.js` | Data persistence                             |
| Getters, setters and static members            | `js/models/item.js`                | Data persistence                             |
| `async` / `await`                              | `js/components/list-view/index.js` | Components: list-view                        |
| Feature detection (`Set.prototype.isSubsetOf`) | `js/lib/missing-keys.js`           | Data persistence                             |
| Fisher–Yates shuffle                           | `js/utils/index.js`                | [Architecture](/under-the-hood/architecture) |

## Static typing with JSDoc

| Skill                                    | Where in the code                               | Explained in                                                          |
| ---------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------- |
| Union types derived from constant arrays | `js/components/button-custom/constants.js`      | [Components: button-custom](/under-the-hood/components/button-custom) |
| Type guard (`value is T`)                | `js/utils/index.js`                             | [Components: button-custom](/under-the-hood/components/button-custom) |
| Function overloads                       | `js/utils/index.js`                             | [Architecture](/under-the-hood/architecture)                          |
| Generic mixin typing                     | `js/lib/interfaces/queuable-component-mixin.js` | [Components: base classes](/under-the-hood/components/base-classes)   |

## Accessibility

| Skill                                                                  | Where in the code                                  | Explained in                                                          |
| ---------------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------- |
| Keyboard activation, `role` and `tabindex` on a custom button          | `js/components/button-custom/index.js`             | [Components: button-custom](/under-the-hood/components/button-custom) |
| Accessible name kept when the label is hidden                          | `js/components/button-custom/index.js`             | [Components: button-custom](/under-the-hood/components/button-custom) |
| Focus trap, focus restoration and `Escape` handling                    | `js/modal.js`                                      | Components: modal                                                     |
| Dialog semantics (`aria-modal`, `aria-labelledby`, `aria-describedby`) | `js/modal.js`                                      | Components: modal                                                     |
| Visually hidden label                                                  | `js/modal.js`                                      | Components: modal                                                     |
| Heading level independent of appearance                                | `js/components/container-box/index.js`             | Components: container-box                                             |
| `prefers-reduced-motion`                                               | `js/components/list-view/index.css`, `js/modal.js` | Styling                                                               |

## CSS

| Skill                                           | Where in the code                                        | Explained in |
| ----------------------------------------------- | -------------------------------------------------------- | ------------ |
| Design tokens as custom properties              | `css/style.css`                                          | Styling      |
| `oklch()` colors and `color-mix()`              | `css/style.css`, `js/components/button-custom/style.css` | Styling      |
| `:host` selectors and attribute-driven variants | `js/components/button-custom/style.css`                  | Styling      |
| Staggered animation driven by a custom property | `js/components/list-view/index.css`                      | Styling      |
| Flexbox application layout                      | `css/style.css`, `js/components/app-main/style.css`      | Styling      |
