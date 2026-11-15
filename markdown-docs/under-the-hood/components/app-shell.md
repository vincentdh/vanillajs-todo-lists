---
title: App shell
group: Under the hood/Components
order: 36
---

# App shell

The app shell is the part of the page that does not depend on the selected list:
the header, and the element that holds the two panels. It is made of two app
components, [`app-header`](/module/components-app-header/appheader) and
[`app-main`](/module/components-app-main/appmain). Both extend
[`BasicComponentInterface`](/module/lib-interfaces-basic-component-interface/basiccomponentinterface)
directly and build their content when they are connected.

| File                                                                                                         | Content                                                                                       |
| ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| [`js/components/app-header/index.js`](/module/components-app-header)                                         | The [`AppHeader`](/module/components-app-header/appheader) class                              |
| `js/components/app-header/style.css`                                                                         | The styles of the header                                                                      |
| [`js/components/app-header/license-acknowledgment.js`](/module/components-app-header-license-acknowledgment) | The license text, as data                                                                     |
| [`js/components/app-main/index.js`](/module/components-app-main)                                             | The [`AppMain`](/module/components-app-main/appmain) class                                    |
| `js/components/app-main/style.css`                                                                           | The layout of the two panels                                                                  |
| [`js/utils/html-builder.js`](/module/utils-html-builder)                                                     | [`buildTagElement()`](/module/utils-html-builder/buildtagelement)                             |
| [`js/utils/html-builder.types.js`](/module/utils-html-builder/types)                                         | The types of the objects it accepts                                                           |
| [`js/utils/index.js`](/module/utils)                                                                         | [`randomPick()`](/module/utils/randompick) and [`randomMinMax()`](/module/utils/randomminmax) |
| `data/randomdata.json`                                                                                       | The demo data offered on first launch                                                         |

## `app-header`

### Structure of the header

```text
header
├── h1
│   ├── svg-icon  name="logo"       accessible name: "Application logo"
│   └── slot  name="title"          default text: "VanillaJS To-do Lists"
└── div
    ├── button-custom  icon="scale"                  the licenses
    ├── button-custom  icon="circle-question-mark"   the documentation (a link)
    └── button-custom  icon="bomb"                   "Nuke data"
```

The three actions are
[`button-custom`](/under-the-hood/components/button-custom) elements with the
`ghost` variant, an icon of 32 pixels and a hidden label. The label stays the
accessible name of each button.

### Actions

| Action        | What it does                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------ |
| Licenses      | Opens a large, scrollable dialog with the licenses of the icons                                                    |
| Documentation | A [`button-custom`](/module/components-button-custom/buttoncustom) in link mode, which opens the site in a new tab |
| "Nuke data"   | Asks for confirmation, calls `store.nuke()`, then reloads the page                                                 |

Both dialogs are [`Modal`](/under-the-hood/components/modal) instances. The
confirmation of "Nuke data" uses the `danger` variant for its confirm button.
What `nuke()` removes is described in
[Data persistence](/under-the-hood/data-persistence).

### The license text

The icons come from Lucide, which is distributed under the ISC license; some of
them derive from Feather, under the MIT license. Both licenses ask that their
notice is reproduced. The application shows them in a dialog.

The text is not written as HTML. `license-acknowledgment.js` exports one object
that describes the elements, and
[`buildTagElement()`](/module/utils-html-builder/buildtagelement) turns it into
DOM nodes:

```js
export const LICENSE_ACKNOWLEDGMENT = {
  tag: 'div',
  content: [
    { tag: 'h2', content: 'Lucide License' },
    { tag: 'p', content: 'ISC License' },
    { tag: 'hr', attributes: { width: '75%' } },
  ],
}
```

- `tag` is the name of the element, and `attributes` an optional object of
  attributes.
- `content` is a string, or an array that mixes strings and other objects. A
  string becomes a text node, and an object is built by a recursive call.
- The [`HTMLTag`](/module/utils-html-builder/types/htmltag) type lists the
  allowed tags and what each may contain, so a mistake in the object is reported
  by the type checker.

The node is given to the dialog as its `descriptionNode`.

## `app-main`

### Structure of the main area

```text
main
├── nav-lists
└── list-view
```

[`app-main`](/module/components-app-main/appmain) creates the two panels and
connects them. It listens to the `list-selected` event of
[`nav-lists`](/under-the-hood/components/nav-lists), and writes the identifier
it carries in the `list-id` attribute of
[`list-view`](/under-the-hood/components/list-view). The two panels do not know
each other; the [architecture page](/under-the-hood/architecture) explains this
communication.

The host is a flex row with a gap. The widths of the panels are set by the
panels themselves; see [Styling](/under-the-hood/styling).

### Demo data

When the component is connected and the storage holds no list, it offers to
create demo data. Nothing is written unless the visitor accepts.

`data/randomdata.json` is imported as a JSON module, with
`with { type: 'json' }`. It holds ten categories, from `professional` to
`zombie_apocalypse`. Each category has the same shape:

```json
{
  "household": {
    "listNames": ["…", "…"],
    "items": ["…", "…"]
  }
}
```

When the visitor accepts, the component:

1. picks a random number of categories, between one and all of them;
2. for each category, picks one of its list names and creates the list with
   `lists.create()`;
3. adds every item of the category, in a random order, with `list.add()`;
4. calls `refresh()` on [`nav-lists`](/module/components-nav-lists/navlists),
   which reads the lists again and selects the first one.

The random choices use two helpers of [`js/utils/index.js`](/module/utils):
[`randomMinMax()`](/module/utils/randomminmax) returns an integer between two
bounds, and [`randomPick()`](/module/utils/randompick) returns a number of
elements of an array, without repetition, after a Fisher–Yates shuffle.

## Decisions

### The title is a slot with a default text

- **What:** the title of the header is a `<slot name="title">` whose default
  content is "VanillaJS To-do Lists". No element of the application fills this
  slot.
- **Why:** a slot leaves room for more than plain text, for example an image or
  an icon.
- **Alternative:** the text written directly in the `<h1>`.

### "Nuke data" reloads the page

- **What:** after the storage is emptied, the component calls
  `location.reload()`.
- **Why:** the reload puts every component back in its initial state, without an
  event or a method to synchronize each of them.
- **Alternative:** an event that
  [`nav-lists`](/module/components-nav-lists/navlists) and
  [`list-view`](/module/components-list-view/listview) listen to, or a call to
  `refresh()`.

### The license text is data, built by `buildTagElement()`

- **What:** the license text is an object, and a small module builds the
  elements from it. The module has this single use.
- **Why:** `innerHTML` is avoided, as explained in
  [Why it is built this way](/portfolio-context/why-it-is-built-this-way). The
  builder itself is there to demonstrate: a data structure that describes HTML
  elements, and a recursive function that builds them.
- **Alternative:** a series of `document.createElement()` calls, or an HTML
  string.
- **Skill demonstrated:** a recursive, data-driven DOM builder with a typed
  input.

### The demo data is offered, not created

- **What:** on a first visit, a dialog offers to create demo data. The
  application writes nothing if the visitor refuses.
- **Why:** a visitor sees a filled application without any effort, and nothing
  is stored in the browser without consent.
- **Alternative:** creating the demo data silently, or starting with an empty
  application.
