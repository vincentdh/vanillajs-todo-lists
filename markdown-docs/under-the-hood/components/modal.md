---
title: Modal
group: Under the hood/Components
order: 37
---

# `Modal`

[`Modal`](/module/modal/modal) is the dialog of the application. It asks a
question, waits for the answer and returns it through a promise. The application
uses it for every confirmation and every prompt.

Unlike the other pages of this section, [`Modal`](/module/modal/modal) is not a
custom element. It is a plain class, in a single file, that creates its own
element when it opens and removes it when it closes.

| File                           | Content                                                                           |
| ------------------------------ | --------------------------------------------------------------------------------- |
| [`js/modal.js`](/module/modal) | The [`Modal`](/module/modal/modal) class, its markup, its styles and its defaults |

## Usage

```js
import { Modal } from './js/modal.js'

const name = await new Modal({
  title: 'Rename List',
  description: 'Enter the new list name',
  showInput: true,
  showCancel: true,
}).open()

if (name !== null) {
  // The user confirmed. `name` is the text of the input.
}
```

`open()` returns a promise that is always settled:

| The user…                                                | The promise resolves with           |
| -------------------------------------------------------- | ----------------------------------- |
| clicks the confirm button, or presses Enter in the input | The value of the input, as a string |
| confirms a dialog that has no input                      | An empty string                     |
| clicks "Cancel" or the close button, or presses Escape   | `null`                              |
| clicks outside the dialog                                | `null`                              |

So `!== null` always means "confirmed". The promise never rejects.

## Where the application uses it

| Dialog                   | Opened by                                               | Kind                              |
| ------------------------ | ------------------------------------------------------- | --------------------------------- |
| Welcome, demo data offer | [`app-main`](/module/components-app-main/appmain)       | Confirmation                      |
| Create a new list        | [`nav-lists`](/module/components-nav-lists/navlists)    | Text input                        |
| Rename List              | [`list-view`](/module/components-list-view/listview)    | Text input with a default value   |
| Delete a task            | [`list-view`](/module/components-list-view/listview)    | Confirmation, with a DOM node     |
| Delete a list            | [`list-view`](/module/components-list-view/listview)    | Confirmation                      |
| Delete everything        | [`app-header`](/module/components-app-header/appheader) | Confirmation                      |
| Open source licenses     | [`app-header`](/module/components-app-header/appheader) | Information, large and scrollable |

## Options

`title` is required, and exactly one of `description` and `descriptionNode`.

| Option                     | Type                                                                       | Default   | Effect                                             |
| -------------------------- | -------------------------------------------------------------------------- | --------- | -------------------------------------------------- |
| `title`                    | string                                                                     | required  | The heading of the dialog                          |
| `description`              | string                                                                     | none      | The text under the heading                         |
| `descriptionNode`          | `Node`                                                                     | none      | A DOM node shown in place of the text              |
| `showClose`                | boolean                                                                    | `true`    | Shows the confirm button                           |
| `closeLabel`               | string                                                                     | `Close`   | The label of the confirm button                    |
| `closeVariant`             | A [`button-custom`](/module/components-button-custom/buttoncustom) variant | `default` | The variant of the confirm button                  |
| `showCancel`               | boolean                                                                    | `false`   | Shows the cancel button                            |
| `cancelLabel`              | string                                                                     | `Cancel`  | The label of the cancel button                     |
| `cancelVariant`            | A [`button-custom`](/module/components-button-custom/buttoncustom) variant | `default` | The variant of the cancel button                   |
| `showHeaderCloseButton`    | boolean                                                                    | `true`    | Shows the "✕" button in the corner                 |
| `disableBackdropDismissal` | boolean                                                                    | `false`   | A click outside the dialog no longer cancels       |
| `showInput`                | boolean                                                                    | `false`   | Shows the input area                               |
| `inputType`                | `text`, `checkbox`, `select`, `radio`                                      | `text`    | The control of the input area                      |
| `inputOptions`             | array                                                                      | none      | The choices of a `select` or a `radio`             |
| `inputDefaultValue`        | string or boolean                                                          | none      | The initial value of the control                   |
| `inputLabel`               | string                                                                     | `Value`   | The label of the control                           |
| `showInputLabel`           | boolean                                                                    | `false`   | Shows the label; otherwise it is visually hidden   |
| `scrollableDescription`    | boolean                                                                    | `false`   | Limits the height and makes the description scroll |
| `large`                    | boolean                                                                    | `false`   | Makes the dialog wider                             |

### Input types

`showInput` adds one control to the dialog, chosen by `inputType`. The promise
always resolves with a string.

| `inputType` | Control                 | `inputDefaultValue` | Value when the user confirms             |
| ----------- | ----------------------- | ------------------- | ---------------------------------------- |
| `text`      | A text input            | A string            | The text, trimmed                        |
| `checkbox`  | One checkbox            | A boolean           | `on` when it is checked, otherwise `''`  |
| `select`    | A `<select>` list       | One of the choices  | The value of the selected choice         |
| `radio`     | A group of radio inputs | One of the choices  | The value of the checked choice, or `''` |

`inputOptions` is required for `select` and `radio`, and refused for the other
types. Each choice is a string, used as both the value and the label, or an
object with one key: `{ value: 'Label' }`.

The application uses the text input only. The other three types are part of the
module but no component opens them.

### Validation

The constructor checks the whole configuration and throws at once when it is
wrong. A dialog with an invalid configuration never opens.

| Problem                                                                                     | Error        |
| ------------------------------------------------------------------------------------------- | ------------ |
| The configuration is not an object                                                          | `TypeError`  |
| An option is unknown, for example a typing mistake                                          | `TypeError`  |
| An option has the wrong type                                                                | `TypeError`  |
| `title` is missing                                                                          | `TypeError`  |
| Both `description` and `descriptionNode`, or neither                                        | `TypeError`  |
| A variant is not a [`button-custom`](/module/components-button-custom/buttoncustom) variant | `RangeError` |
| `inputType` is not supported                                                                | `RangeError` |
| `inputOptions` is missing for a `select` or a `radio`                                       | `TypeError`  |
| `inputDefaultValue` does not match the type or the choices                                  | `TypeError`  |

The expected types are declared once, in the `modalOptionTypes` object. The same
object gives the list of the known options.

## How it works

### Opening

`open()` does four things:

1. It creates the promise and keeps its `resolve` function.
2. It records the focused element and blocks the scrolling of the page
   (`overflow: hidden` on `<body>`).
3. It mounts the dialog: a `<div>` appended to `<body>`, with an open shadow
   root that receives a `<style>` element and the markup.
4. On the next frame, it adds the `is-open` class, which starts the fade-in
   transition, and moves the focus to the input, or to the dialog itself when
   there is no input.

Calling `open()` again while the dialog is open returns the same promise.

### The markup

The whole markup is one HTML string, parsed once through a `<template>` and
`innerHTML`. It contains every possible part: the two buttons, the close button,
the text input, the `<select>` and the container for the choices. Mounting then
shows or hides each part, with the `hidden` attribute, according to the
configuration.

The texts that come from the configuration are written with `textContent`, never
parsed as HTML. A `descriptionNode` is inserted as a copy, made with
`cloneNode(true)`, so the same [`Modal`](/module/modal/modal) can be opened
again.

This is the one place where the application uses `innerHTML`; see
[Why it is built this way](/portfolio-context/why-it-is-built-this-way).

### Closing

Closing settles the promise first, then plays the fade-out:

1. It gives the result to the promise. The caller continues at once, without
   waiting for the animation.
2. It restores the scrolling of the page and the focus.
3. It removes the `is-open` class, and removes the element from the page 160
   milliseconds later. The transition lasts 150 milliseconds.

The resolver is taken out of the instance before it is called, so the promise
can only be settled once.

A `MutationObserver` watches `<body>`. If something else removes the dialog from
the page while it is open, the observer closes it with `null`, so the promise
never stays pending.

### Keyboard

| Key                        | Effect                               |
| -------------------------- | ------------------------------------ |
| Enter, in the input area   | Confirms                             |
| Escape                     | Cancels                              |
| Tab on the last control    | Moves the focus to the first control |
| Shift+Tab on the first one | Moves the focus to the last control  |

The last two rows are the focus trap: the Tab key cycles through the visible
controls of the dialog.

### Accessibility

- The dialog element has `role="dialog"` and `aria-modal="true"`.
- `aria-labelledby` points to the heading, and `aria-describedby` to the
  description when there is one.
- The input always has a `<label>`. It is visually hidden unless
  `showInputLabel` is set.
- A group of radio buttons has `role="radiogroup"` and is labelled by the same
  label.

## Styling

- **Isolation.** The styles are a string, placed in a `<style>` element of the
  shadow root. The host starts with `all: initial`, so it inherits nothing from
  the page.
- **Theme.** The dialog still follows the theme: its rules read the custom
  properties of `css/style.css` (`--surface`, `--border-color`, `--accent` and
  others), which cross the shadow boundary.
- **Buttons.** The two action buttons are
  [`button-custom`](/module/components-button-custom/buttoncustom) elements, so
  they look like the buttons of the rest of the application.
- **Transitions.** The overlay fades, and the dialog fades and moves up
  slightly. Under `prefers-reduced-motion: reduce`, the transitions are removed.
- **Parts.** The overlay and the dialog have a `part` attribute, which lets a
  page style them with `::part()`.

## Typing

- [`ModalOptions`](/module/modal/modaloptions) describes what the caller may
  pass. Every option except `title` is optional.
- [`ModalDefaults`](/module/modal/modaldefaults) is built with
  `Required<Pick<…>>`: the options that always have a value once the defaults
  are applied.
- [`ModalConfig`](/module/modal/modalconfig), the intersection of the two, is
  the type of the private configuration. The code that mounts the dialog can
  read a default without checking for `undefined`.

## Decisions

### A hand-written dialog

- **What:** the dialog is built from `<div>` elements. The class implements the
  focus trap, the Escape key, the scroll lock and the return of the focus.
- **Why:** a lot happens in a modal dialog, and writing it by hand shows these
  mechanisms.
- **Alternative:** the native `<dialog>` element with `showModal()`, which
  provides the focus trap, the Escape key, the top layer and an inert page, or
  `window.confirm()` and `window.prompt()`.
- **Cost:** everything that `<dialog>` gives for free is code to write, to test
  and to maintain.
- **Skill demonstrated:** focus management, keyboard handling and ARIA for a
  modal dialog.

### A plain class, not a custom element

- **What:** [`Modal`](/module/modal/modal) is not registered as a custom
  element. The caller creates an instance and calls `open()`.
- **Why:** a dialog is not an element of the page. It is a tool that shows a
  temporary view to the user, then disappears. A class that any module imports
  and opens fits this better than an element placed in the page.
- **Alternative:** a `<modal-dialog>` custom element built on
  [`BasicComponentInterface`](/module/lib-interfaces-basic-component-interface/basiccomponentinterface),
  like the other components.
- **Cost:** the class is not fully independent: it expects
  [`button-custom`](/module/components-button-custom/buttoncustom) to be
  registered, and it reads the custom properties of the theme.

### `open()` returns a promise

- **What:** the answer comes back through a promise: a string when the user
  confirms, `null` when the user cancels.
- **Why:** the calling code reads from top to bottom with `await`, like
  `window.prompt()` and `window.confirm()`.
- **Alternative:** callbacks passed in the configuration, or events dispatched
  by the dialog.
- **Skill demonstrated:** wrapping a user interaction in a promise, and
  `async`/`await` in event handlers.

### The markup and the styles are strings in the module

- **What:** the HTML and the CSS are two template strings in
  [`js/modal.js`](/module/modal). The other components build their elements with
  the DOM API and import a `.css` file.
- **Why:** to demonstrate an alternative to the DOM API, as explained in
  [Why it is built this way](/portfolio-context/why-it-is-built-this-way). The
  styles follow for the same reason, and the whole dialog stays in one file.
- **Alternative:** `document.createElement()` and a stylesheet imported with
  `with { type: 'css' }`, as in the components.

### An invalid configuration throws

- **What:** the constructor throws for any invalid option.
  [`button-custom`](/module/components-button-custom/buttoncustom) does the
  opposite with an invalid attribute: it logs an error and falls back to the
  default.
- **Why:** a wrong option is a mistake of the developer, and throwing shows it
  at once during development. A wrong attribute can come from the markup at
  runtime, and must not break the page.
- **Alternative:** logging and falling back to the default value, as
  [`button-custom`](/module/components-button-custom/buttoncustom) does.

### Input types that the application does not use

- **What:** the class supports `checkbox`, `select` and `radio` inputs. The
  application only opens text inputs and confirmations.
- **Why:** [`Modal`](/module/modal/modal) is written as if it were part of a
  framework: a general dialog, not only the dialogs of this application. It
  still needs components of the application: its buttons are
  [`button-custom`](/module/components-button-custom/buttoncustom) elements, and
  it reads the theme.
- **Alternative:** supporting the text input only.
- **Cost:** code that the application never runs.
