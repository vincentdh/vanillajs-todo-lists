---
title: nav-lists
group: Under the hood/Components
order: 35
---

# `nav-lists`

[`nav-lists`](/module/components-nav-lists/navlists) is the left panel of the
application. It shows the names of the lists, marks the selected one and creates
new lists.

It is an app component: it extends
[`BasicComponentInterface`](/module/lib-interfaces-basic-component-interface/basiccomponentinterface)
directly and renders synchronously, without the
[`QueuableComponent`](/module/lib-interfaces-queuable-component-mixin/queuablecomponent)
mixin.

| File                                                                                                 | Content                                                                                             |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [`js/components/nav-lists/index.js`](/module/components-nav-lists)                                   | The [`NavLists`](/module/components-nav-lists/navlists) class                                       |
| `js/components/nav-lists/style.css`                                                                  | The styles of the panel                                                                             |
| [`js/components/nav-lists/list-selected-event.js`](/module/components-nav-lists-list-selected-event) | The [`ListSelectedEvent`](/module/components-nav-lists-list-selected-event/listselectedevent) class |

## Input and output

| Direction | Name            | Kind     | Meaning                                                                                       |
| --------- | --------------- | -------- | --------------------------------------------------------------------------------------------- |
| Out       | `list-selected` | Event    | A list was selected; `event.selectedList` is its id                                           |
| In        | `list-renamed`  | Event    | Sent by [`list-view`](/module/components-list-view/listview); the panel updates one name      |
| In        | `list-deleted`  | Event    | Sent by [`list-view`](/module/components-list-view/listview); the panel reads the lists again |
| In        | `refresh()`     | Method   | Reads the lists again and renders                                                             |
| Out       | `list-count`    | Property | The number of lists                                                                           |

[`app-main`](/module/components-app-main/appmain) uses the method and the
property: it reads `list-count` at startup to decide whether to offer the demo
data, and calls `refresh()` once the demo data is created. The events are
explained on the [architecture page](/under-the-hood/architecture).

## Structure

The panel is a [`container-box`](/under-the-hood/components/container-box) with
the heading "Lists".

```text
container-box  heading="Lists"  heading-level="2"
├── ul                          default slot: one <li> for each list
│   └── li  x-data="<uuid>"     class="selected" on the selected list
└── div                         "footer" slot
    └── button-custom#addList   "Create New List"
```

The host element is the navigation landmark of the page: the component sets its
`role` to `navigation` and its `aria-label` to "Lists".

## Rendering

The component keeps an array of [`List`](/module/models-list/list) instances,
read from the data layer with `lists.getIndex()`.

`render()` builds a new `<ul>` from that array, with one `<li>` for each list,
and replaces the previous `<ul>` with it. It then selects a list.

The clicks are handled by one listener on the `<ul>`, not by one listener on
each `<li>`. The handler reads the identifier of the list on the element that
was clicked.

## Selection

`#selectList()` chooses the list to select, in this order:

1. the identifier it receives, when the user clicked a name;
2. the list that was just created, if there is one;
3. the first list of the array.

It adds the `selected` class to the `<li>` and dispatches `list-selected`. As a
render always ends with a selection, the panel selects a list by itself at
startup, after a creation and after a deletion.
[`list-view`](/module/components-list-view/listview) only shows "No list
selected" when there is no list at all.

## Reacting to changes

| Change            | What the component does                                    |
| ----------------- | ---------------------------------------------------------- |
| "Create New List" | Asks for a name, creates the list, renders and selects it  |
| `list-renamed`    | Reads the lists again and changes the text of one `<li>`   |
| `list-deleted`    | Reads the lists again and renders; the first list is shown |
| `refresh()`       | Reads the lists again and renders                          |

The name of a new list is asked with a
[`Modal`](/under-the-hood/components/modal) that has a text input.

## Styling

- **Width.** The panel is between 250 and 375 pixels wide.
  [`list-view`](/module/components-list-view/listview) takes the rest of the
  row.
- **Selected list.** The selected name is bold, and its marker is the
  `disclosure-closed` triangle, colored through `li::marker`.
- **Hover.** A name under the pointer takes the accent color and a bottom border
  drawn with a `radial-gradient()` as `border-image`.
- **Theme.** The colors and the spacing come from the custom properties of
  `css/style.css`.

## Decisions

### One click listener for the whole list

- **What:** the `<ul>` has a single `click` listener, and the handler finds the
  list from the clicked element. In
  [`list-view`](/module/components-list-view/listview), each button of each row
  has its own listener.
- **Why:** it is one of the intentional differences described in
  [Why it is built this way](/portfolio-context/why-it-is-built-this-way): the
  two panels show two ways to listen to clicks.
- **Alternative:** one listener on each `<li>`.
- **Skill demonstrated:** event delegation.

### A list is always selected

- **What:** every render ends by selecting a list: the one just created, or the
  first one.
- **Why:** the application exists to manage lists, so the "No list selected"
  state is avoided as much as possible. Selecting the first list is the simple
  way to do it.
- **Alternative:** leaving the selection empty until the user clicks a name, or
  remembering the last selection in the storage.
- **Possible improvement:** remembering the last selected list.

### The host element is the navigation landmark

- **What:** the component sets `role="navigation"` and `aria-label` on its host
  element, through the `role` and `ariaLabel` properties.
- **Why:** the custom element is the component, and this component has one
  responsibility: navigation. The role therefore belongs to the element itself,
  not to one of its children.
- **Alternative:** a `<nav>` element inside the shadow root.
