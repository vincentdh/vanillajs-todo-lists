---
title: Architecture
group: Under the hood
order: 20
---

# Architecture

This page describes how the application starts, how it is divided into
components, and how the components and the data layer communicate.

## Startup

1. `index.html` contains an empty `<body>`. It loads the global stylesheet
   `css/style.css` and the module `js/app.js`.
2. `js/app.js` imports the seven custom elements from the barrel file
   `js/components/index.js` and registers them with `customElements.define`.
   Each class exposes its tag name through a static `tag` getter.
3. `js/app.js` then appends `<app-header>` and `<app-main>` to the body. These
   two elements create every other element.

Stylesheets and demo data are loaded as modules (`with { type: 'css' }` and
`with { type: 'json' }`), so the application needs no build step.

## Source layout

```text
index.html
css/                      global theme tokens and scrollbar styles
data/randomdata.json      demo data offered on first launch
js/
  app.js                  entry point
  modal.js                modal dialog (a plain class, not a custom element)
  components/             one folder per custom element
  lib/
    interfaces/           base classes: component base, render mixin, storage interface
    adapters/             localStorage adapter
    services/             storage service
    errors/               custom error class
  models/                 Lists, List, ListItem
  utils/                  shared helpers
```

## Component tree

```text
body
├── app-header
│   ├── svg-icon                 application logo
│   └── button-custom × 3        licenses, documentation, delete all data
└── app-main
    ├── nav-lists
    │   └── container-box
    │       ├── ul               one entry per list
    │       └── button-custom    create a list
    └── list-view
        └── container-box
            ├── button-custom    rename the list
            ├── form             input and button-custom to add a task
            ├── items            each task has button-custom actions
            └── button-custom    delete the list
```

The components fall into two groups:

| Group               | Components                                         | Role                                                                                                                                                                                |
| ------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App components      | `app-header`, `app-main`, `nav-lists`, `list-view` | Specific to this application. `app-header` and `app-main` build the page once, in `connectedCallback`. `nav-lists` and `list-view` display the data and expose a `render()` method. |
| Platform components | `button-custom`, `container-box`, `svg-icon`       | Reusable elements configured through attributes. They use the `QueuableComponent` mixin, which batches attribute changes into one render.                                           |

`Modal` is not a custom element. It is a class that any component can
instantiate: `await new Modal({...}).open()` shows the dialog and resolves with
the user's answer.

## Communication between components

Components never call each other's internals. A child tells the rest of the
application what happened through a custom event, and a parent configures a
child through an attribute or a public method.

| Event           | Dispatched by | Handled by  | Effect                                                                                     |
| --------------- | ------------- | ----------- | ------------------------------------------------------------------------------------------ |
| `list-selected` | `nav-lists`   | `app-main`  | `app-main` sets the `list-id` attribute on `list-view`, which loads and renders that list. |
| `list-renamed`  | `list-view`   | `nav-lists` | `nav-lists` updates the name of the matching entry.                                        |
| `list-deleted`  | `list-view`   | `nav-lists` | `nav-lists` reloads the lists, renders them, and selects the first one.                    |

Each event has its own class (`ListSelectedEvent`, `ListRenamedEvent`,
`ListDeletedEvent`) that fixes the event name and the shape of its payload.

`list-renamed` and `list-deleted` bubble. `nav-lists` receives them by listening
on its parent element, the `<main>` that also contains `list-view`.

The flow for selecting a list is:

```text
user clicks a list
  → nav-lists dispatches list-selected
    → app-main sets list-id on list-view
      → list-view loads the list from storage and renders it
```

## Data flow

```text
components
  → lists (Lists)                  entry point of the data layer
    → List, ListItem               models
      → store (StorageService)     JSON serialization and key management
        → LocalStorageAdapter      implements StorageInterface
          → localStorage
```

- There is no in-memory state store. `localStorage` is the single source of
  truth, and the models read from it when they are asked for data.
- `store` and `lists` are created once in their modules and exported. Every
  component that imports them shares the same instance.
- Each list is stored under a `list-<uuid>` key and holds only the identifiers
  of its items. Each item is stored under its own `item-<uuid>` key.

The data layer is described in detail on the data persistence page.

## Decisions

### `localStorage` is the store

- **What:** the application has no separate state store. Components ask the
  models for data, and the models read it from `localStorage`.
- **Why:** `localStorage` already holds the state, so it is used as the store
  itself.
- **Cost:** every read goes through `localStorage` and `JSON.parse`.

### Components communicate through custom events

- **What:** `nav-lists` and `list-view` never call each other. They dispatch
  `list-selected`, `list-renamed` and `list-deleted`, each defined by its own
  event class.
- **Why:** to demonstrate how custom events are created, handled and typed.
- **Alternative:** direct method calls between the two components.
- **Skill demonstrated:** `Event` and `CustomEvent` subclasses, bubbling, and
  JSDoc typing of event payloads.

### Two ways to carry an event payload

- **What:** the event classes carry their data in two different ways.

  | Event class         | Extends       | Payload                                             |
  | ------------------- | ------------- | --------------------------------------------------- |
  | `ListSelectedEvent` | `Event`       | A typed property on the event: `event.selectedList` |
  | `ListRenamedEvent`  | `CustomEvent` | The standard `detail` object: `event.detail.listId` |
  | `ListDeletedEvent`  | `CustomEvent` | None                                                |

- **Why:** to demonstrate both approaches. `detail` is the standard location,
  which any listener can read without knowing the class. A property on a
  subclass gives the listener direct, typed access to the value.
- **Note:** `CustomEvent` only adds `detail` to `Event`. Options such as
  `bubbles` belong to `Event`, so an event that does not use `detail` can extend
  `Event` directly.

### `nav-lists` listens on its parent element

- **What:** `nav-lists` registers its listeners for `list-renamed` and
  `list-deleted` on its parent element, not on `list-view`.
- **Why:** `nav-lists` and `list-view` are siblings, so they always share the
  same parent. Listening on the parent lets `nav-lists` receive the events
  without holding a reference to `list-view`.
- **Cost:** `nav-lists` relies on being placed next to the component that
  dispatches these events.

### The selected list is passed as an attribute

- **What:** `app-main` gives the selected list to `list-view` by setting its
  `list-id` attribute. `list-view` observes the attribute and loads the list
  when it changes.
- **Why:** to demonstrate a dynamic attribute, handled with `observedAttributes`
  and `attributeChangedCallback`.
- **Alternative:** a public method, as `app-main` does with
  `nav-lists.refresh()`.

### Registration errors are only logged

- **What:** `js/app.js` wraps the registration of the components in a
  `try/catch` that writes the error to the console. The user sees no message.
- **Why:** this is a known limitation, kept on purpose. It will be reported as
  an issue on the GitHub repository and fixed from there, to show the complete
  workflow: issue, branch, pull request and CI/CD.
