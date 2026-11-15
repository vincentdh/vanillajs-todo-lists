/** @import { store } from '../lib/services/storage.js' */

import { StorageError } from '../lib/errors/storage-error.js'
import { missingKeys } from '../lib/missing-keys.js'
import { StorageService } from '../lib/services/storage.js'

const MANDATORY_KEYS = new Set(['description', 'id', 'completed'])

/**
 * @typedef {Object} JsonListItem
 * @property {string} id
 * @property {string} description
 * @property {boolean} completed
 */

/**
 * @class ListItem
 */
export class ListItem {
  get completed() {
    return this.#data.completed
  }

  /**
   * @type {boolean}
   */
  set completed(state) {
    this.#data.completed = state
  }

  get description() {
    return this.#data.description.trim()
  }

  /**
   * @type {string}
   */
  set description(newDescription) {
    if (newDescription.trim() === '') {
      throw new Error('Invalid description')
    }
    this.#data.description = newDescription.trim()
  }

  /**
   * Getter for item ID
   *
   * @readonly
   * @type {string}
   */
  get id() {
    return this.#data.id
  }

  /** @type {JsonListItem} */
  #data

  /** @type {StorageService} */
  #store

  /**
   * @param {JsonListItem} data
   * @param {StorageService} store
   */
  constructor(data, store) {
    if (!(store instanceof StorageService)) {
      throw new Error('Missing store')
    }
    this.#store = store
    const missings = missingKeys(MANDATORY_KEYS, new Set(Object.keys(data)))
    if (missings.length > 0) {
      throw new Error(`[Item] Invalid data. Missing: ${missings.join(', ')}`)
    }
    if (this.#store.search(`item-${data.id}`).length === 0) {
      this.#store.save(`item-${data.id}`, data)
    }
    this.#data = data
  }

  /**
   * Create a ListItem instance using the description
   *
   * @param {string} description
   * @param {StorageService} store
   * @returns {ListItem}
   */
  static create(description, store) {
    if (!(store instanceof StorageService)) {
      throw new Error('Missing store')
    }
    if (typeof description !== 'string' || description.trim() === '') {
      throw new Error('Invalid description')
    }

    return new ListItem(
      {
        description,
        id: self.crypto.randomUUID(),
        completed: false,
      },
      store,
    )
  }

  /**
   * Load list item from store
   *
   * @param {string} id
   * @param {StorageService} store
   * @returns {ListItem}
   */
  static load(id, store) {
    if (!(store instanceof StorageService)) {
      throw new Error('Missing store')
    }
    try {
      return new ListItem(
        /** @type {JsonListItem} */ (store.get(`item-${id}`)),
        store,
      )
    } catch (e) {
      if (e instanceof StorageError) {
        throw new ReferenceError(`Cannot find item id ${id}`, { cause: e })
      } else {
        throw e
      }
    }
  }

  delete() {
    this.#store.delete(`item-${this.id}`)
  }

  save() {
    this.#store.save(`item-${this.id}`, this)
  }

  /**
   * @returns {{ id: string, description: string, completed: boolean }}
   */
  toJSON() {
    return {
      id: this.#data.id,
      description: this.#data.description,
      completed: this.#data.completed,
    }
  }
}
