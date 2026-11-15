import { describe, expect, it } from 'vitest'

import { StorageError } from '../../../js/lib/errors/storage-error.js'
import { StorageService } from '../../../js/lib/services/storage.js'
import { ListItem } from '../../../js/models/item.js'
import '../../helpers/browser-globals.js'
import { InMemoryStorage } from '../../helpers/in-memory-storage.js'

/**
 * @returns {{ adapter: InMemoryStorage, store: StorageService }}
 */
function setup() {
  const adapter = new InMemoryStorage()
  return { adapter, store: new StorageService(adapter) }
}

describe('ListItem.create', () => {
  it('creates an uncompleted item with a generated id', () => {
    const { store } = setup()
    const item = ListItem.create('Buy milk', store)

    expect(item.description).toBe('Buy milk')
    expect(item.completed).toBe(false)
    expect(item.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    )
  })

  it('persists the new item under item-<id>', () => {
    const { store } = setup()
    const item = ListItem.create('Buy milk', store)

    expect(store.get(`item-${item.id}`)).toEqual({
      id: item.id,
      description: 'Buy milk',
      completed: false,
    })
  })

  it('gives each item a different id', () => {
    const { store } = setup()
    const first = ListItem.create('a', store)
    const second = ListItem.create('a', store)

    expect(first.id).not.toBe(second.id)
  })

  it.each([
    ['an empty string', ''],
    ['whitespace only', '   \n\t'],
    ['a number', 42],
    ['null', null],
  ])('rejects a description that is %s', (_label, description) => {
    const { store } = setup()

    expect(() => ListItem.create(description, store)).toThrow(
      'Invalid description',
    )
  })

  it('rejects a store that is not a StorageService', () => {
    expect(() => ListItem.create('x', {})).toThrow('Missing store')
  })
})

describe('ListItem.load', () => {
  it('returns the stored item', () => {
    const { store } = setup()
    const created = ListItem.create('Read book', store)

    const loaded = ListItem.load(created.id, store)

    expect(loaded.id).toBe(created.id)
    expect(loaded.description).toBe('Read book')
    expect(loaded.completed).toBe(false)
  })

  it('throws a ReferenceError for an unknown id', () => {
    const { store } = setup()

    let caught
    try {
      ListItem.load('missing-id', store)
    } catch (e) {
      caught = e
    }

    expect(caught).toBeInstanceOf(ReferenceError)
    expect(caught.message).toBe('Cannot find item id missing-id')
    expect(caught.cause).toBeInstanceOf(StorageError)
  })

  it('rejects a store that is not a StorageService', () => {
    expect(() => ListItem.load('id', null)).toThrow('Missing store')
  })
})

describe('ListItem constructor', () => {
  it('throws when a mandatory key is missing', () => {
    const { store } = setup()

    expect(() => new ListItem({ id: '1', description: 'x' }, store)).toThrow(
      '[Item] Invalid data. Missing: completed',
    )
  })

  it('stores the data when the item is not in the store yet', () => {
    const { store } = setup()

    new ListItem({ id: '1', description: 'x', completed: false }, store)

    expect(store.get('item-1')).toEqual({
      id: '1',
      description: 'x',
      completed: false,
    })
  })
})

describe('ListItem description', () => {
  it('is trimmed when read', () => {
    const { store } = setup()
    const item = ListItem.create('  padded  ', store)

    expect(item.description).toBe('padded')
  })

  it('is trimmed when set', () => {
    const { store } = setup()
    const item = ListItem.create('first', store)

    item.description = '  second  '

    expect(item.description).toBe('second')
  })

  it('rejects a whitespace-only value when set', () => {
    const { store } = setup()
    const item = ListItem.create('first', store)

    expect(() => {
      item.description = '   '
    }).toThrow('Invalid description')
    expect(item.description).toBe('first')
  })
})

describe('ListItem completed state', () => {
  it('is not saved until save() is called', () => {
    const { store } = setup()
    const item = ListItem.create('task', store)

    item.completed = true

    expect(item.completed).toBe(true)
    expect(store.get(`item-${item.id}`).completed).toBe(false)
  })

  it('is saved by save()', () => {
    const { store } = setup()
    const item = ListItem.create('task', store)

    item.completed = true
    item.save()

    expect(store.get(`item-${item.id}`).completed).toBe(true)
    expect(ListItem.load(item.id, store).completed).toBe(true)
  })
})

describe('ListItem.delete', () => {
  it('removes the item from the store', () => {
    const { store } = setup()
    const item = ListItem.create('task', store)

    item.delete()

    expect(() => store.get(`item-${item.id}`)).toThrow(StorageError)
  })
})

describe('ListItem.toJSON', () => {
  it('returns only the public fields', () => {
    const { store } = setup()
    const item = ListItem.create('task', store)

    expect(item.toJSON()).toEqual({
      id: item.id,
      description: 'task',
      completed: false,
    })
  })

  it('is used by JSON.stringify', () => {
    const { store } = setup()
    const item = ListItem.create('task', store)

    expect(JSON.parse(JSON.stringify(item))).toEqual(item.toJSON())
  })
})
