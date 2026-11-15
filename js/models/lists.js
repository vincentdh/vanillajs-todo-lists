/** @import { ListData } from './list.js' */
import { store, StorageService } from '../lib/services/storage.js'
import { List } from './list.js'

class Lists {
  #store

  /**
   *
   * @param {StorageService} storageService
   */
  constructor(storageService) {
    if (!(storageService instanceof StorageService)) {
      throw new Error('Invalid storage service')
    }
    this.#store = storageService
  }

  /**
   * @param {string} name
   * @returns {List}
   */
  create(name) {
    const newList = List.create(name, store)
    this.#store.save(`list-${newList.id}`, newList)
    return newList
  }

  /**
   *
   * @param {string} listId
   * @returns {List}
   */
  get(listId) {
    if (!listId.startsWith('list-')) listId = 'list-' + listId
    const rawData = /** @type {ListData} */ (this.#store.get(listId))
    return new List(rawData, store)
  }

  /**
   * @returns {Array<List>}
   */
  getIndex() {
    const searchResult = this.#store.search('^list-')
    /** @type {Array<List>} */
    const lists = []
    searchResult.forEach((list) => {
      lists.push(this.get(list))
    })
    return lists
  }
}

/**
 * @type {Lists}
 */
const lists = new Lists(store)

export { Lists, lists }
