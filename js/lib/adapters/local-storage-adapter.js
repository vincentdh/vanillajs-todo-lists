import { StorageInterface } from '../interfaces/storage-interface.js'

export class LocalStorageAdapter extends StorageInterface {
  /**
   * @return {number}
   */
  get length() {
    return localStorage.length
  }

  /**
   * @param {string} key
   * @returns {string | null}
   */
  getItem(key) {
    return localStorage.getItem(key)
  }

  /**
   * @param {number} index
   * @return {string | null}
   */
  key(index) {
    return localStorage.key(index)
  }

  /**
   *
   * @param {string} key
   * @return {void}
   */
  removeItem(key) {
    localStorage.removeItem(key)
  }

  /**
   *
   * @param {string} key
   * @param {string} value
   */
  setItem(key, value) {
    localStorage.setItem(key, value)
  }
}
