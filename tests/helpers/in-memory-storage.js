import { StorageInterface } from '../../js/lib/interfaces/storage-interface.js'

/**
 * Map-backed storage adapter for unit tests. Behaves like localStorage
 * through the StorageInterface contract, without needing a browser.
 */
export class InMemoryStorage extends StorageInterface {
  get length() {
    return this.#map.size
  }

  #map = new Map()

  /**
   * @param {string} key
   * @returns {string | null}
   */
  getItem(key) {
    return this.#map.has(key) ? this.#map.get(key) : null
  }

  /**
   * @param {number} index
   * @returns {string | null}
   */
  key(index) {
    const keys = [...this.#map.keys()]
    return index < keys.length ? keys[index] : null
  }

  /**
   * @param {string} key
   */
  removeItem(key) {
    this.#map.delete(key)
  }

  /**
   * @param {string} key
   * @param {string} value
   */
  setItem(key, value) {
    this.#map.set(key, String(value))
  }
}
