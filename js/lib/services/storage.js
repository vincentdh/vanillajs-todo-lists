import { LocalStorageAdapter } from '../adapters/local-storage-adapter.js'
import { StorageError } from '../errors/storage-error.js'
import { StorageInterface } from '../interfaces/storage-interface.js'

export class StorageService {
  /**
   * @type {StorageInterface}
   */
  #storageAdapter

  /**
   *
   * @param {StorageInterface} storageAdapter
   */
  constructor(storageAdapter) {
    if (!(storageAdapter instanceof StorageInterface))
      throw new StorageError('Invalid storage adapter')
    this.#storageAdapter = storageAdapter
  }

  /**
   * @param {string} key
   */
  delete(key) {
    this.#storageAdapter.removeItem(key)
  }

  /**
   * @param {string} key
   * @returns {unknown} The parsed value. Callers must check its shape.
   */
  get(key) {
    const raw = this.#storageAdapter.getItem(key)
    if (raw === null) {
      throw new StorageError(`Key [${key}] not found`)
    }
    return JSON.parse(raw)
  }

  nuke() {
    const keys = []
    for (let i = 0; i < this.#storageAdapter.length; i++) {
      const key = this.#storageAdapter.key(i)
      if (
        key !== null &&
        (key.startsWith('list-') || key.startsWith('item-'))
      ) {
        keys.push(key)
      }
    }
    keys.forEach((key) => {
      this.delete(key)
    })
  }

  /**
   * @param {string} key
   * @param {string | object} data
   */
  save(key, data) {
    if (typeof data === 'object') {
      this.#storageAdapter.setItem(key, JSON.stringify(data))
    }
    if (typeof data === 'string') {
      if (!this.#isJsonString(data)) {
        throw new Error('Data is not a valid JSON string')
      }
      this.#storageAdapter.setItem(key, data)
    }
  }

  /**
   *
   * @param {string} filterString
   * @returns {string[]}
   */
  search(filterString) {
    const filter = new RegExp(filterString)
    const keys = []
    for (let i = 0; i < this.#storageAdapter.length; i++) {
      const key = this.#storageAdapter.key(i)
      if (key !== null && filter.test(key)) {
        keys.push(key)
      }
    }
    return keys
  }

  /**
   * Validate if the string represent a valid JSON.
   *
   * @param {string} str
   * @returns
   */
  #isJsonString(str) {
    try {
      JSON.parse(str)
      return true
    } catch {
      return false
    }
  }
}

/** @type {StorageInterface} */
const storageAdapter = new LocalStorageAdapter()

/** @type {StorageService} */
const store = new StorageService(storageAdapter)

export { store }
