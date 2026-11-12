import { beforeEach, describe, expect, it } from 'vitest'

import { StorageError } from '../../../js/lib/errors/storage-error.js'
import { List } from '../../../js/models/list.js'
import { lists } from '../../../js/models/lists.js'
import { resetLocalStorage } from '../../helpers/browser-globals.js'

// `lists` is a singleton that uses the default store, which reads the global
// localStorage. Each test starts with an empty in-memory localStorage.
beforeEach(() => {
  resetLocalStorage()
})

describe('Lists.create', () => {
  it('returns a List with the given name', () => {
    const list = lists.create('Work')

    expect(list).toBeInstanceOf(List)
    expect(list.name).toBe('Work')
    expect(list.items.size).toBe(0)
  })

  it('saves the new list under list-<id>', () => {
    const list = lists.create('Work')

    expect(JSON.parse(localStorage.getItem(`list-${list.id}`))).toEqual({
      id: list.id,
      name: 'Work',
      items: [],
    })
  })
})

describe('Lists.get', () => {
  it('returns the list for its id', () => {
    const created = lists.create('Home')

    const found = lists.get(created.id)

    expect(found.id).toBe(created.id)
    expect(found.name).toBe('Home')
  })

  it('accepts the full list-<id> key too', () => {
    const created = lists.create('Home')

    const found = lists.get(`list-${created.id}`)

    expect(found.id).toBe(created.id)
  })

  it('throws a StorageError for an unknown id', () => {
    expect(() => lists.get('unknown')).toThrow(StorageError)
  })
})

describe('Lists.getIndex', () => {
  it('returns an empty array when no list exists', () => {
    expect(lists.getIndex()).toEqual([])
  })

  it('returns every saved list', () => {
    const first = lists.create('First')
    const second = lists.create('Second')

    const ids = lists
      .getIndex()
      .map((list) => list.id)
      .sort()

    expect(ids).toEqual([first.id, second.id].sort())
  })

  it('ignores item keys', () => {
    const list = lists.create('With items')
    list.add('a task')

    const index = lists.getIndex()

    expect(index.map((l) => l.id)).toEqual([list.id])
  })
})
