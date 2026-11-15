---
title: Data persistence
group: Under the hood/Data and styling
order: 40
---

# Data persistence

The application keeps its lists and its tasks in the `localStorage` of the
browser. There is no server, and nothing else holds the data: the components ask
the models, and the models read the storage each time.

This page describes the layers between a component and `localStorage`, and the
format of what is stored. The [architecture page](/under-the-hood/architecture)
explains why `localStorage` is the only store.

## Layers

```text
components
  → lists (Lists)                  entry point: create, get and list the lists
    → List, ListItem               models: one list, one task
      → store (StorageService)     JSON and keys
        → LocalStorageAdapter      implements StorageInterface
          → localStorage
```

| File                                                                                     | Exports                                                                                                        | Role                            |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| [`js/lib/interfaces/storage-interface.js`](/module/lib-interfaces-storage-interface)     | [`StorageInterface`](/module/lib-interfaces-storage-interface/storageinterface)                                | The contract of a storage       |
| [`js/lib/adapters/local-storage-adapter.js`](/module/lib-adapters-local-storage-adapter) | [`LocalStorageAdapter`](/module/lib-adapters-local-storage-adapter/localstorageadapter)                        | The contract, on `localStorage` |
| [`js/lib/services/storage.js`](/module/lib-services-storage)                             | [`StorageService`](/module/lib-services-storage/storageservice), [`store`](/module/lib-services-storage/store) | JSON, search by key, cleanup    |
| [`js/lib/errors/storage-error.js`](/module/lib-errors-storage-error)                     | [`StorageError`](/module/lib-errors-storage-error/storageerror)                                                | The error of the storage layer  |
| [`js/models/lists.js`](/module/models-lists)                                             | [`Lists`](/module/models-lists/lists), [`lists`](/module/models-lists)                                         | The collection of lists         |
| [`js/models/list.js`](/module/models-list)                                               | [`List`](/module/models-list/list)                                                                             | One list and its operations     |
| [`js/models/item.js`](/module/models-item)                                               | [`ListItem`](/module/models-item/listitem)                                                                     | One task                        |
| [`js/lib/missing-keys.js`](/module/lib-missing-keys)                                     | [`missingKeys`](/module/lib-missing-keys/missingkeys)                                                          | Validation of the loaded data   |

### `StorageInterface`

[`StorageInterface`](/module/lib-interfaces-storage-interface/storageinterface)
is the contract of a key-value storage: `getItem()`, `setItem()`,
`removeItem()`, `key()` and `length`, the same names as the Web Storage API.

JavaScript has no interfaces, so the contract is a class that cannot be used as
it is:

- The constructor throws when the class is instantiated directly. It detects
  this with `new.target`.
- Each method throws `Not implemented`. A subclass must override it.

### `LocalStorageAdapter`

[`LocalStorageAdapter`](/module/lib-adapters-local-storage-adapter/localstorageadapter)
extends
[`StorageInterface`](/module/lib-interfaces-storage-interface/storageinterface)
and forwards each call to `localStorage`. It is the only file of the application
that names `localStorage`.

### `StorageService`

[`StorageService`](/module/lib-services-storage/storageservice) receives an
adapter in its constructor and adds what the models need.

| Method         | What it does                                                                                                            |
| -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `get(key)`     | Reads a key and parses the JSON. Throws [`StorageError`](/module/lib-errors-storage-error/storageerror) if it is absent |
| `save(key, v)` | Serializes an object with `JSON.stringify()` and writes it                                                              |
| `delete(key)`  | Removes a key                                                                                                           |
| `search(re)`   | Returns the keys that match a regular expression                                                                        |
| `nuke()`       | Removes every key of the application                                                                                    |

`get()` returns `unknown`: the service does not know the shape of what it reads,
and the models check it.

The constructor refuses an adapter that is not an instance of
[`StorageInterface`](/module/lib-interfaces-storage-interface/storageinterface).

The module creates one adapter and one service, and exports the service as
[`store`](/module/lib-services-storage/store). Every module that imports `store`
shares the same instance.

## Models

### `Lists`

[`lists`](/module/models-lists) is the entry point of the components. It is the
only instance of [`Lists`](/module/models-lists/lists), created in its module.

| Method         | Returns                                                               |
| -------------- | --------------------------------------------------------------------- |
| `create(name)` | A new [`List`](/module/models-list/list), already saved               |
| `get(id)`      | The [`List`](/module/models-list/list) with this identifier           |
| `getIndex()`   | An array with every [`List`](/module/models-list/list) of the storage |

### `List`

A [`List`](/module/models-list/list) wraps the stored data of one list in a
private field and exposes it through getters: `id`, `name` and `items`.

| Method                 | What it does                                         |
| ---------------------- | ---------------------------------------------------- |
| `add(task)`            | Creates a task, adds its identifier and saves        |
| `setItemCompleted(id)` | Inverts the state of a task and saves the task       |
| `deleteItem(id)`       | Deletes a task, removes its identifier and saves     |
| `rename(name)`         | Changes the name and saves. Throws on an empty name  |
| `destroy()`            | Deletes every task of the list, then the list itself |
| `save()`               | Writes the list                                      |

`items` is a getter, not a field. Each access reads every task of the list from
the storage and returns them in a `Map`, keyed by identifier, in the order of
the list. A task that is listed but missing from the storage is skipped, with a
warning in the console.

### `ListItem`

A [`ListItem`](/module/models-item/listitem) wraps one task: `id`, `description`
and `completed`.

- `ListItem.create(description, store)` builds a new task with a new identifier.
- `ListItem.load(id, store)` reads an existing task. A missing task becomes a
  `ReferenceError`, with the
  [`StorageError`](/module/lib-errors-storage-error/storageerror) as its
  `cause`.
- `save()` and `delete()` write and remove the task.

### Identifiers

Lists and tasks get their identifier from `crypto.randomUUID()`. There is no
counter to store, and two identifiers cannot collide.

## What is stored

Each list and each task has its own key. A list holds the identifiers of its
tasks, not the tasks themselves.

```text
list-0b8d…   {"id":"0b8d…","name":"Groceries","items":["7c1e…","a94f…"]}
item-7c1e…   {"id":"7c1e…","description":"Milk","completed":false}
item-a94f…   {"id":"a94f…","description":"Eggs","completed":true}
```

- **Keys.** The prefixes `list-` and `item-` tell the two kinds apart.
  `search('^list-')` finds every list, and `nuke()` removes only the keys with
  one of these prefixes.
- **Order.** The order of the tasks is the order of the `items` array.
- **Writes.** Completing a task rewrites the key of that task only. Adding or
  deleting a task writes the task and the list.

### Serialization

The models keep their data in a private field (`#data`), which
`JSON.stringify()` cannot see. Each model has a `toJSON()` method that returns
the object to write, so `store.save(key, this)` stores exactly these fields.

### Validation

When a model is built from stored data, it checks that the mandatory keys are
present: `id`, `name` and `items` for a list, `id`, `description` and
`completed` for a task. If one is missing, the constructor throws and names it.

The check is done by [`missingKeys()`](/module/lib-missing-keys/missingkeys),
which compares two sets. It uses `Set.prototype.isSubsetOf()` when the browser
has it, and a filter otherwise.

## What happens on each action

| Action          | Reads and writes                                             |
| --------------- | ------------------------------------------------------------ |
| Show the lists  | Finds the `list-` keys and reads each list                   |
| Show a list     | Reads the list, then one key for each task                   |
| Create a list   | Writes the list                                              |
| Add a task      | Writes the task, then the list with the new identifier       |
| Complete a task | Writes the task                                              |
| Delete a task   | Removes the task, then writes the list                       |
| Rename a list   | Writes the list                                              |
| Delete a list   | Removes each task, then the list                             |
| "Nuke data"     | Removes every `list-` and `item-` key, then the page reloads |

## Decisions

### An adapter between the service and `localStorage`

- **What:** the service never calls `localStorage`. It calls an adapter that it
  receives in its constructor, and the adapter implements
  [`StorageInterface`](/module/lib-interfaces-storage-interface/storageinterface).
- **Why:** to demonstrate the adapter pattern and dependency injection, and to
  make the storage replaceable: in memory for the tests, or IndexedDB later.
- **Alternative:** calling `localStorage` directly from the service or from the
  models.
- **Cost:** two more files and one more level of calls, for a single
  implementation.
- **Skill demonstrated:** the adapter pattern and dependency injection.

### An interface written as a class

- **What:**
  [`StorageInterface`](/module/lib-interfaces-storage-interface/storageinterface)
  is a class that throws when it is instantiated and when a method is not
  overridden. The service checks its adapter with `instanceof`.
- **Why:** nothing is compiled, so a contract that only exists in JSDoc is not
  safe enough. The error can be ignored in the editor, and the editor may not
  check JSDoc at all. The tests and the checks of the GitHub repository would
  catch it for this project, but the contract is still enforced at runtime.
- **Alternative:** a JSDoc `@typedef` that describes the methods, checked by the
  type checker only.
- **Cost:** `instanceof` checks the inheritance, not the methods. An adapter
  must extend
  [`StorageInterface`](/module/lib-interfaces-storage-interface/storageinterface),
  and a method that is not overridden only throws when it is called.

### Lists and tasks are stored separately

- **What:** a list is stored with the identifiers of its tasks, and each task
  has its own key.
- **Why:** completing a task rewrites only that task, not the whole list.
- **Alternative:** one key for each list, with its tasks nested in the same
  JSON.
- **Cost:** showing a list reads one key for each task.

### Feature detection in `missingKeys()`

- **What:** [`missingKeys()`](/module/lib-missing-keys/missingkeys) uses
  `Set.prototype.isSubsetOf()` when it exists, and a filter otherwise. The
  comment in the code states that the gain is not measurable for the three or
  four keys that the models check.
- **Why:** to demonstrate feature detection with a fallback.
- **Alternative:** the filter alone.

### "Nuke data" removes the keys one by one

- **What:** `nuke()` removes the keys that start with `list-` or `item-`. It
  does not call `localStorage.clear()`.
- **Why:** to leave alone the data that other pages of the same origin may have
  stored.
- **Alternative:** `localStorage.clear()`.
