import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { StorageError } from '../../../js/lib/errors/storage-error.js'
import { StorageService } from '../../../js/lib/services/storage.js'
import { ListItem } from '../../../js/models/item.js'
import { List } from '../../../js/models/list.js'
import { InMemoryStorage } from '../../helpers/in-memory-storage.js'
import '../../helpers/browser-globals.js'

/**
 * @returns {{ adapter: InMemoryStorage, store: StorageService }}
 */
function setup() {
  const adapter = new InMemoryStorage()
  return { adapter, store: new StorageService(adapter) }
}

describe('List.create', () => {
  it('creates an empty list with a generated id and the given name', () => {
    const { store } = setup()
    const list = List.create('Groceries', store)

    expect(list.name).toBe('Groceries')
    expect(list.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(list.items.size).toBe(0)
  })

  it('does not write to the store until save() is called', () => {
    const { store } = setup()
    const list = List.create('Groceries', store)

    expect(() => store.get(`list-${list.id}`)).toThrow(StorageError)

    list.save()

    expect(store.get(`list-${list.id}`)).toEqual({
      id: list.id,
      name: 'Groceries',
      items: [],
    })
  })
})

describe('List constructor', () => {
  it('throws when a mandatory key is missing', () => {
    const { store } = setup()

    expect(() => new List({ id: '1', name: 'x' }, store)).toThrow(
      '[List] Invalid data. Missing: items',
    )
  })

  it('reads the items of a list that was stored earlier', () => {
    const { store } = setup()
    const item = ListItem.create('Eggs', store)
    const data = { id: 'l1', name: 'Breakfast', items: [item.id] }

    const list = new List(data, store)

    expect(list.name).toBe('Breakfast')
    expect([...list.items.keys()]).toEqual([item.id])
  })
})

describe('List.add', () => {
  it('returns the new item and appends its id to the list', () => {
    const { store } = setup()
    const list = List.create('Todo', store)

    const item = list.add('Walk the dog')

    expect(item).toBeInstanceOf(ListItem)
    expect(item.description).toBe('Walk the dog')
    expect([...list.items.keys()]).toEqual([item.id])
  })

  it('saves the list and the item', () => {
    const { store } = setup()
    const list = List.create('Todo', store)

    const item = list.add('Walk the dog')

    expect(store.get(`list-${list.id}`).items).toEqual([item.id])
    expect(store.get(`item-${item.id}`).description).toBe('Walk the dog')
  })

  it('keeps items in the order they were added', () => {
    const { store } = setup()
    const list = List.create('Todo', store)

    const first = list.add('first')
    const second = list.add('second')

    expect([...list.items.keys()]).toEqual([first.id, second.id])
  })

  it('returns undefined and adds nothing when the description is empty', () => {
    const { store } = setup()
    const list = List.create('Todo', store)
    const trace = vi.spyOn(console, 'trace').mockImplementation(() => {})

    try {
      expect(list.add('   ')).toBeUndefined()
      expect(trace).toHaveBeenCalledOnce()
    } finally {
      trace.mockRestore()
    }

    expect(list.items.size).toBe(0)
  })
})

describe('List.items', () => {
  let log

  beforeEach(() => {
    log = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    log.mockRestore()
  })

  it('skips ids whose items are missing from the store', () => {
    const { store } = setup()
    const list = new List(
      { id: 'l1', name: 'Broken', items: ['missing-item'] },
      store,
    )

    expect(list.items.size).toBe(0)
    expect(log).toHaveBeenCalledWith(
      'Listed item does not exists. [missing-item]',
    )
  })
})

describe('List completion sets', () => {
  it('splits item ids into todo and completed', () => {
    const { store } = setup()
    const list = List.create('Todo', store)
    const open = list.add('open')
    const done = list.add('done')
    list.setItemCompleted(done.id)

    expect(list.todo).toEqual(new Set([open.id]))
    expect(list.completed).toEqual(new Set([done.id]))
  })

  it('is empty for both sets in an empty list', () => {
    const { store } = setup()
    const list = List.create('Empty', store)

    expect(list.todo.size).toBe(0)
    expect(list.completed.size).toBe(0)
  })
})

describe('List.setItemCompleted', () => {
  it('toggles the completed state and saves it', () => {
    const { store } = setup()
    const list = List.create('Todo', store)
    const item = list.add('task')

    list.setItemCompleted(item.id)
    expect(store.get(`item-${item.id}`).completed).toBe(true)

    list.setItemCompleted(item.id)
    expect(store.get(`item-${item.id}`).completed).toBe(false)
  })
})

describe('List.deleteItem', () => {
  it('removes the item from the list and from the store', () => {
    const { store } = setup()
    const list = List.create('Todo', store)
    const keep = list.add('keep')
    const remove = list.add('remove')

    list.deleteItem(remove.id)

    expect([...list.items.keys()]).toEqual([keep.id])
    expect(store.get(`list-${list.id}`).items).toEqual([keep.id])
    expect(() => store.get(`item-${remove.id}`)).toThrow(StorageError)
  })
})

describe('List.rename', () => {
  it('changes the name and saves it', () => {
    const { store } = setup()
    const list = List.create('Old', store)

    list.rename('New')

    expect(list.name).toBe('New')
    expect(store.get(`list-${list.id}`).name).toBe('New')
  })

  it.each([
    ['an empty string', ''],
    ['whitespace only', '  '],
    ['null', null],
    ['a number', 3],
  ])('rejects %s with a TypeError', (_label, value) => {
    const { store } = setup()
    const list = List.create('Keep me', store)

    expect(() => list.rename(value)).toThrow(TypeError)
    expect(list.name).toBe('Keep me')
  })
})

describe('List.destroy', () => {
  it('removes the list and all of its items from the store', () => {
    const { store } = setup()
    const list = List.create('Gone', store)
    const item = list.add('task')
    list.save()

    list.destroy()

    expect(() => store.get(`list-${list.id}`)).toThrow(StorageError)
    expect(() => store.get(`item-${item.id}`)).toThrow(StorageError)
  })
})

describe('List.toJSON', () => {
  it('returns id, name and item ids', () => {
    const { store } = setup()
    const list = List.create('Shape', store)
    const item = list.add('task')

    expect(list.toJSON()).toEqual({
      id: list.id,
      name: 'Shape',
      items: [item.id],
    })
  })
})
