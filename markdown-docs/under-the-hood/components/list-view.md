---
title: list-view
group: Under the hood/Components
order: 34
---

# `list-view`

[`list-view`](/module/components-list-view/listview) is the right panel of the
application. It shows the tasks of the selected list and holds every action on
that list: adding a task, completing or deleting one, renaming the list and
deleting it.

It is an app component: it extends
[`BasicComponentInterface`](/module/lib-interfaces-basic-component-interface/basiccomponentinterface)
directly and renders synchronously, without the
[`QueuableComponent`](/module/lib-interfaces-queuable-component-mixin/queuablecomponent)
mixin.

| File                                                                                               | Content                                                                                          |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [`js/components/list-view/index.js`](/module/components-list-view)                                 | The [`ListView`](/module/components-list-view/listview) class                                    |
| `js/components/list-view/index.css`                                                                | The styles of the panel                                                                          |
| [`js/components/list-view/list-renamed-event.js`](/module/components-list-view-list-renamed-event) | The [`ListRenamedEvent`](/module/components-list-view-list-renamed-event/listrenamedevent) class |
| [`js/components/list-view/list-deleted-event.js`](/module/components-list-view-list-deleted-event) | The [`ListDeletedEvent`](/module/components-list-view-list-deleted-event/listdeletedevent) class |

## Input and output

The component has one input and two outputs.

| Direction | Name           | Kind      | Meaning                                        |
| --------- | -------------- | --------- | ---------------------------------------------- |
| In        | `list-id`      | Attribute | The identifier of the list to show             |
| Out       | `list-renamed` | Event     | The list was renamed; `detail.listId` names it |
| Out       | `list-deleted` | Event     | The list was deleted; the event has no payload |

[`app-main`](/module/components-app-main/appmain) sets `list-id` when
[`nav-lists`](/module/components-nav-lists/navlists) reports a selection. Both
events bubble, and `nav-lists` listens to them on the parent element. The
[architecture page](/under-the-hood/architecture) explains this communication.

When `list-id` changes, the component loads the list with `lists.get()`, keeps
the [`List`](/module/models-list/list) instance in a private field and renders.
When the attribute is removed, it forgets the list and renders the empty state.

## Structure

The constructor builds the fixed part of the panel once: a
[`container-box`](/under-the-hood/components/container-box) and the three
elements that fill its slots.

```text
container-box  heading="<list name>"  heading-level="2"  no-padding
├── div#content                 default slot: the form and the tasks
├── div#actions                 "actions" slot: the "Rename List" button
└── span                        "footer" slot: the "Delete list" button
```

`render()` then fills the content for one of two states.

|                | A list is selected                | No list is selected         |
| -------------- | --------------------------------- | --------------------------- |
| Heading        | The name of the list              | Empty                       |
| Content        | The "new task" form and the tasks | The text "No list selected" |
| `actions` slot | The "Rename List" button          | An empty placeholder        |
| `footer` slot  | The "Delete list" button          | Empty                       |

A render clears the content area and builds it again. With a list, it also moves
the focus to the "new task" input, so the user can type at once.

### A task

Each task is one row, built by `#createItemElement()`:

```text
div  item-id="<uuid>"  class="completed" when the task is done
├── div.item-label
│   ├── button-custom           "Mark uncompleted" (checked box icon)
│   ├── button-custom           "Mark completed" (empty box icon)
│   └── span                    the description
└── div
    └── button-custom           "Delete item"
```

Both box buttons are always in the row. The stylesheet shows one of them,
depending on the `completed` class of the row. The three buttons have a hidden
label, which gives each an accessible name.

## Actions

| Action          | What the component does                                                           |
| --------------- | --------------------------------------------------------------------------------- |
| Add a task      | Calls `list.add()`, empties the input, appends one row and scrolls to it          |
| Toggle a task   | Toggles the `completed` class of the row and calls `list.setItemCompleted()`      |
| Delete a task   | Asks for confirmation, calls `list.deleteItem()` and removes the row              |
| Rename the list | Asks for the new name, calls `list.rename()`, updates the heading, sends an event |
| Delete the list | Asks for confirmation, calls `list.destroy()`, renders, sends an event            |

- **The form.** The "new task" input and the "+ Add" button are in a `<form>`.
  The button is a
  [`button-custom`](/module/components-button-custom/buttoncustom) with
  `type="submit"`, so a click or the Enter key fires the `submit` event of the
  form. The handler reads the value with `FormData`.
- **The dialogs.** The confirmations and the rename prompt use
  [`Modal`](/under-the-hood/components/modal). The handlers are `async`
  functions that wait for the answer: `null` means that the user cancelled.
- **The order on deletion.** `#deleteList` deletes the data, renders the empty
  state, then dispatches `list-deleted`. When
  [`nav-lists`](/module/components-nav-lists/navlists) receives the event and
  reads the lists again, the deleted list is already gone.

The targeted updates of the first three actions do not call `render()`: the
component changes only the row concerned.

## Styling

- **Layout.** The content is a flex column. The form keeps its height, and the
  list of tasks takes the rest and scrolls.
- **Completed tasks.** A completed row has a double line through its text.
- **Entrance animation.** Each row fades in and grows with the `addItem`
  animation. `#createItemElement()` writes the position of the row in the custom
  property `--i`, and the stylesheet delays the animation by
  `calc(var(--i) * 30ms)`, so the rows appear one after the other.
- **Reduced motion.** Under `prefers-reduced-motion: reduce`, the animation is
  removed and the rows are visible at once.
- **Theme.** The spacing, the radius, the border color and the focus shadow come
  from the custom properties of `css/style.css`.

## Decisions

### A render rebuilds the content, an action changes one row

- **What:** selecting a list rebuilds the whole content. Adding, completing or
  deleting a task changes only its row, and a rename only sets the heading.
- **Why:** to touch the DOM as little as possible. Selecting another list
  replaces every row, so `render()` starts by clearing the content; a deleted
  list needs the same thing. An action on one task changes one row, and
  rebuilding all the others would be work for nothing.
- **Alternative:** calling `render()` after every action, or updating the
  existing rows when another list is selected.
- **Possible improvement:** a component for a single task, which would hold the
  actions on that task.

### The component keeps the `List` instance

- **What:** the component loads the list once, when `list-id` changes, and keeps
  the instance. Every action calls a method of that instance.
- **Why:** to read the storage as little as possible. The instance writes each
  of its changes to the storage itself, so it is always up to date and there is
  nothing to read again. Even deleting a task, which changes both the task and
  the list, is one call on the instance.
- **Alternative:** keeping only the identifier, and loading the list again for
  each action.

### Two buttons for the task state

- **What:** each row holds a "Mark completed" and a "Mark uncompleted" button.
  The stylesheet hides one of them according to the `completed` class.
- **Why:** toggling one class is enough. The stylesheet does the rest, so the
  JavaScript never touches the buttons.
- **Alternative:** one button whose icon and label are changed in JavaScript.
