import { describe, expect, it } from 'vitest'

import { StorageError } from '../../js/lib/errors/storage-error.js'
import { StorageInterface } from '../../js/lib/interfaces/storage-interface.js'
import { StorageService } from '../../js/lib/services/storage.js'
import { InMemoryStorage } from '../helpers/in-memory-storage.js'

/**
 * @returns {{ adapter: InMemoryStorage, service: StorageService }}
 */
function setup() {
  const adapter = new InMemoryStorage()
  return { adapter, service: new StorageService(adapter) }
}

describe('StorageInterface', () => {
  it('cannot be instantiated directly', () => {
    expect(() => new StorageInterface()).toThrow(TypeError)
  })
})

describe('StorageService constructor', () => {
  it('accepts any StorageInterface adapter', () => {
    expect(() => new StorageService(new InMemoryStorage())).not.toThrow()
  })

  it('rejects objects that only have the right methods', () => {
    const duckTyped = {
      length: 0,
      getItem() {},
      key() {},
      removeItem() {},
      setItem() {},
    }
    expect(() => new StorageService(duckTyped)).toThrow(StorageError)
  })
})

describe('StorageService save and get', () => {
  it('round-trips an object', () => {
    const { service } = setup()
    service.save('list-1', { title: 'Groceries', items: [] })
    expect(service.get('list-1')).toEqual({ title: 'Groceries', items: [] })
  })

  it('stores objects as JSON', () => {
    const { adapter, service } = setup()
    service.save('item-1', { done: true })
    expect(adapter.getItem('item-1')).toBe('{"done":true}')
  })

  it('throws a StorageError for a missing key', () => {
    const { service } = setup()
    expect(() => service.get('list-missing')).toThrow(StorageError)
  })

  it('throws a StorageError after the key is deleted', () => {
    const { service } = setup()
    service.save('list-1', { title: 'x' })
    service.delete('list-1')
    expect(() => service.get('list-1')).toThrow(StorageError)
  })
})

describe('StorageService search', () => {
  it('returns the keys that match the filter', () => {
    const { service } = setup()
    service.save('list-1', {})
    service.save('list-2', {})
    service.save('item-1', {})
    expect(service.search('^list-').sort()).toEqual(['list-1', 'list-2'])
  })

  it('returns an empty array when nothing matches', () => {
    const { service } = setup()
    service.save('item-1', {})
    expect(service.search('^list-')).toEqual([])
  })
})

describe('StorageService nuke', () => {
  it('removes list- and item- keys and keeps other keys', () => {
    const { adapter, service } = setup()
    service.save('list-1', {})
    service.save('item-1', {})
    adapter.setItem('settings', 'keep')
    service.nuke()
    expect(adapter.length).toBe(1)
    expect(adapter.getItem('settings')).toBe('keep')
  })

  it('removes adjacent matching keys without skipping any', () => {
    const { adapter, service } = setup()
    service.save('list-a', {})
    service.save('list-b', {})
    service.save('item-1', {})
    service.nuke()
    expect(adapter.length).toBe(0)
  })
})
