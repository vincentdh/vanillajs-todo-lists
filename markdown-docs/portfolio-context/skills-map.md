---
title: Skills map
group: Portfolio context
order: 20
---

# Skills map

Each table lists a skill, the file that shows it best, and the documentation
page that explains it.

## Design patterns

| Skill                                                     | Where in the code                                                                                                                                                                                        | Explained in                                                        |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Adapter                                                   | [`js/lib/adapters/local-storage-adapter.js`](/module/lib-adapters-local-storage-adapter)                                                                                                                 | [Data persistence](/under-the-hood/data-persistence)                |
| Abstract interface, enforced at runtime with `new.target` | [`js/lib/interfaces/storage-interface.js`](/module/lib-interfaces-storage-interface)                                                                                                                     | [Data persistence](/under-the-hood/data-persistence)                |
| Dependency injection                                      | [`js/lib/services/storage.js`](/module/lib-services-storage), [`js/models/lists.js`](/module/models-lists)                                                                                               | [Data persistence](/under-the-hood/data-persistence)                |
| Static factory methods                                    | [`js/models/list.js`](/module/models-list), [`js/models/item.js`](/module/models-item)                                                                                                                   | [Data persistence](/under-the-hood/data-persistence)                |
| Custom error class and error chaining with `cause`        | [`js/lib/errors/storage-error.js`](/module/lib-errors-storage-error), [`js/models/item.js`](/module/models-item)                                                                                         | [Data persistence](/under-the-hood/data-persistence)                |
| Serialization of private state with `toJSON()`            | [`js/models/list.js`](/module/models-list), [`js/models/item.js`](/module/models-item)                                                                                                                   | [Data persistence](/under-the-hood/data-persistence)                |
| Module-level singleton                                    | [`js/lib/services/storage.js`](/module/lib-services-storage), [`js/models/lists.js`](/module/models-lists)                                                                                               | [Architecture](/under-the-hood/architecture)                        |
| Observer, through typed custom events                     | [`js/components/nav-lists/list-selected-event.js`](/module/components-nav-lists-list-selected-event), [`js/components/list-view/list-renamed-event.js`](/module/components-list-view-list-renamed-event) | [Architecture](/under-the-hood/architecture)                        |
| Abstract base class for components                        | [`js/lib/interfaces/basic-component-interface.js`](/module/lib-interfaces-basic-component-interface)                                                                                                     | [Components: base classes](/under-the-hood/components/base-classes) |
| Mixin (class factory)                                     | [`js/lib/interfaces/queuable-component-mixin.js`](/module/lib-interfaces-queuable-component-mixin)                                                                                                       | [Components: base classes](/under-the-hood/components/base-classes) |
| Render batching in a microtask                            | [`js/lib/interfaces/queuable-component-mixin.js`](/module/lib-interfaces-queuable-component-mixin)                                                                                                       | [Components: base classes](/under-the-hood/components/base-classes) |
| Promise-based API for a user interaction                  | [`js/modal.js`](/module/modal)                                                                                                                                                                           | [Components: modal](/under-the-hood/components/modal)               |
| Strict validation of a configuration object               | [`js/modal.js`](/module/modal)                                                                                                                                                                           | [Components: modal](/under-the-hood/components/modal)               |
| Data-driven DOM builder                                   | [`js/utils/html-builder.js`](/module/utils-html-builder)                                                                                                                                                 | [Components: app shell](/under-the-hood/components/app-shell)       |

## Web platform APIs

| Skill                                               | Where in the code                                                                                    | Explained in                                                          |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Custom elements and their lifecycle callbacks       | [`js/app.js`](/module/app), `js/components/`                                                         | [Architecture](/under-the-hood/architecture)                          |
| Shadow DOM                                          | [`js/lib/interfaces/basic-component-interface.js`](/module/lib-interfaces-basic-component-interface) | [Components: base classes](/under-the-hood/components/base-classes)   |
| Constructable stylesheets (`adoptedStyleSheets`)    | [`js/lib/interfaces/basic-component-interface.js`](/module/lib-interfaces-basic-component-interface) | [Styling](/under-the-hood/styling)                                    |
| CSS and JSON module imports (import attributes)     | [`js/components/app-main/index.js`](/module/components-app-main)                                     | [Styling](/under-the-hood/styling)                                    |
| Default and named slots                             | [`js/components/container-box/index.js`](/module/components-container-box)                           | [Components: container-box](/under-the-hood/components/container-box) |
| Form-associated custom element (`ElementInternals`) | [`js/components/button-custom/index.js`](/module/components-button-custom)                           | [Components: button-custom](/under-the-hood/components/button-custom) |
| Observed attributes with validation                 | [`js/components/button-custom/index.js`](/module/components-button-custom)                           | [Components: button-custom](/under-the-hood/components/button-custom) |
| SVG built with `createElementNS`                    | [`js/components/svg-icon/svg-utils.js`](/module/components-svg-icon-svg-utils)                       | [Components: svg-icon](/under-the-hood/components/svg-icon)           |
| Event delegation                                    | [`js/components/nav-lists/index.js`](/module/components-nav-lists)                                   | [Components: nav-lists](/under-the-hood/components/nav-lists)         |
| `FormData` and form submission                      | [`js/components/list-view/index.js`](/module/components-list-view)                                   | [Components: list-view](/under-the-hood/components/list-view)         |
| `MutationObserver`                                  | [`js/modal.js`](/module/modal)                                                                       | [Components: modal](/under-the-hood/components/modal)                 |
| Web Storage API                                     | [`js/lib/adapters/local-storage-adapter.js`](/module/lib-adapters-local-storage-adapter)             | [Data persistence](/under-the-hood/data-persistence)                  |
| `crypto.randomUUID()`                               | [`js/models/list.js`](/module/models-list), [`js/models/item.js`](/module/models-item)               | [Data persistence](/under-the-hood/data-persistence)                  |

## JavaScript language

| Skill                                          | Where in the code                                                          | Explained in                                                  |
| ---------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------- |
| ES modules and a barrel file                   | [`js/components/index.js`](/module/components)                             | [Architecture](/under-the-hood/architecture)                  |
| Private class fields and methods               | [`js/models/list.js`](/module/models-list), [`js/modal.js`](/module/modal) | [Data persistence](/under-the-hood/data-persistence)          |
| Getters, setters and static members            | [`js/models/item.js`](/module/models-item)                                 | [Data persistence](/under-the-hood/data-persistence)          |
| `async` / `await`                              | [`js/components/list-view/index.js`](/module/components-list-view)         | [Components: list-view](/under-the-hood/components/list-view) |
| Feature detection (`Set.prototype.isSubsetOf`) | [`js/lib/missing-keys.js`](/module/lib-missing-keys)                       | [Data persistence](/under-the-hood/data-persistence)          |
| Fisher–Yates shuffle                           | [`js/utils/index.js`](/module/utils)                                       | [Components: app shell](/under-the-hood/components/app-shell) |

## Static typing with JSDoc

| Skill                                    | Where in the code                                                                                  | Explained in                                                          |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Union types derived from constant arrays | [`js/components/button-custom/constants.js`](/module/components-button-custom-constants)           | [Components: button-custom](/under-the-hood/components/button-custom) |
| Type guard (`value is T`)                | [`js/utils/index.js`](/module/utils)                                                               | [Components: button-custom](/under-the-hood/components/button-custom) |
| Function overloads                       | [`js/utils/index.js`](/module/utils)                                                               | [Architecture](/under-the-hood/architecture)                          |
| Generic mixin typing                     | [`js/lib/interfaces/queuable-component-mixin.js`](/module/lib-interfaces-queuable-component-mixin) | [Components: base classes](/under-the-hood/components/base-classes)   |

## Accessibility

| Skill                                                                  | Where in the code                                                          | Explained in                                                          |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Keyboard activation, `role` and `tabindex` on a custom button          | [`js/components/button-custom/index.js`](/module/components-button-custom) | [Components: button-custom](/under-the-hood/components/button-custom) |
| Accessible name kept when the label is hidden                          | [`js/components/button-custom/index.js`](/module/components-button-custom) | [Components: button-custom](/under-the-hood/components/button-custom) |
| Focus trap, focus restoration and `Escape` handling                    | [`js/modal.js`](/module/modal)                                             | [Components: modal](/under-the-hood/components/modal)                 |
| Dialog semantics (`aria-modal`, `aria-labelledby`, `aria-describedby`) | [`js/modal.js`](/module/modal)                                             | [Components: modal](/under-the-hood/components/modal)                 |
| Visually hidden label                                                  | [`js/modal.js`](/module/modal)                                             | [Components: modal](/under-the-hood/components/modal)                 |
| Heading level independent of appearance                                | [`js/components/container-box/index.js`](/module/components-container-box) | [Components: container-box](/under-the-hood/components/container-box) |
| `prefers-reduced-motion`                                               | `js/components/list-view/index.css`, [`js/modal.js`](/module/modal)        | [Styling](/under-the-hood/styling)                                    |

## CSS

| Skill                                            | Where in the code                                        | Explained in                       |
| ------------------------------------------------ | -------------------------------------------------------- | ---------------------------------- |
| Design tokens as custom properties               | `css/style.css`                                          | [Styling](/under-the-hood/styling) |
| `oklch()` colors and `color-mix()`               | `css/style.css`, `js/components/button-custom/style.css` | [Styling](/under-the-hood/styling) |
| `:host` selectors and custom states (`:state()`) | `js/components/button-custom/style.css`                  | [Styling](/under-the-hood/styling) |
| Staggered animation driven by a custom property  | `js/components/list-view/index.css`                      | [Styling](/under-the-hood/styling) |
| Flexbox application layout                       | `css/style.css`, `js/components/app-main/style.css`      | [Styling](/under-the-hood/styling) |
