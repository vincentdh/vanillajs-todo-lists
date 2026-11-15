/** @import { StorageService } from '../lib/services/storage.js' */
import { missingKeys } from '../lib/missing-keys.js'
import { ListItem } from './item.js'

const MANDATORY_KEYS = new Set(['id', 'name', 'items'])

/**
 * @typedef {Object} ListData
 * @property {string} id
 * @property {string} name
 * @property {Array<string>} items
 */

export class List {
  /**
   * @readonly
   * @type {Set<ListItem>}
   */
  get completed() {
    const completedSet = new Set()
    for (const item of this.items.values()) {
      if (item.completed) completedSet.add(item.id)
    }
    return completedSet
  }

  /**
   * @readonly
   * @type {string}
   */
  get id() {
    return this.#data.id
  }

  /**
   * @readonly
   * @type {Map<string, ListItem>}
   */
  get items() {
    /** @type {Map<string, ListItem>} */
    const itemMap = new Map()
    this.#data.items.forEach((item) => {
      if (!itemMap.has(item)) {
        try {
          itemMap.set(item, ListItem.load(item, this.#store))
        } catch {
          console.warn(`Listed item does not exists. [${item}]`)
        }
      }
    })

    return itemMap
  }

  /**
   * @readonly
   * @type {string}
   */
  get name() {
    return this.#data.name
  }

  /**
   * @readonly
   * @type {Set<ListItem>}
   */
  get todo() {
    const incompletedSet = new Set()
    for (const item of this.items.values()) {
      if (!item.completed) incompletedSet.add(item.id)
    }
    return incompletedSet
  }

  /** @type ListData */
  #data

  /** @type StorageService */
  #store

  /**
   *
   * @param {ListData} data
   * @param {StorageService} store
   */
  constructor(data, store) {
    const missings = missingKeys(MANDATORY_KEYS, new Set(Object.keys(data)))
    if (missings.length > 0) {
      throw new Error(`[List] Invalid data. Missing: ${missings.join(', ')}`)
    }
    this.#data = data
    this.#store = store
  }

  /**
   * @param {string} listName
   * @param {StorageService} store
   * @returns {List}
   */
  static create(listName, store) {
    /** @type {ListData} */
    const data = {
      id: self.crypto.randomUUID(),
      name: listName,
      items: /**@type {Array<ListItem>} */ new Array(),
    }
    return new List(data, store)
  }

  /**
   * @param {string} task
   * @returns {ListItem | undefined}
   */
  add(task) {
    try {
      const item = ListItem.create(task, this.#store)
      this.#data.items.push(item.id)
      this.#store.save(`list-${this.#data.id}`, this)
      return item
    } catch (e) {
      console.trace('Error when creating item.', { e })
    }
  }

  /**
   * @param {string} itemId
   */
  deleteItem(itemId) {
    const item = this.items.get(itemId)
    if (item !== undefined) {
      item.delete()
      const idx = this.#data.items.findIndex((item) => item === itemId)
      this.#data.items.splice(idx, 1)
      this.save()
    }
  }

  destroy() {
    this.items.forEach((item) => {
      item.delete()
    })
    this.#store.delete(`list-${this.#data.id}`)
  }

  /**
   * @param {string | null} newName
   */
  rename(newName) {
    if (
      newName === null ||
      typeof newName !== 'string' ||
      newName.trim() === ''
    )
      throw TypeError('New name is not a valid string')
    this.#data.name = newName
    this.save()
  }

  save() {
    this.#store.save(`list-${this.id}`, this)
  }

  /**
   * @param {string} itemId
   */
  setItemCompleted(itemId) {
    const item = this.items.get(itemId)
    if (item !== undefined) {
      item.completed = !item.completed
      item.save()
    }
  }

  /**
   * @returns {{ id: string, name: string, items: Array<string> }}
   */
  toJSON() {
    return {
      id: this.#data.id,
      name: this.#data.name,
      items: this.#data.items,
    }
  }
}
