/**
 * @interface
 */
export class StorageInterface {
  /**
   * @return {number}
   */
  get length() {
    throw new Error('Not implemented')
  }

  constructor() {
    if (new.target === StorageInterface) {
      throw new TypeError('StorageInterface is abstract; extend it instead')
    }
  }

  /**
   * @param {string} _key
   * @returns {string | null}
   */
  getItem(_key) {
    throw new Error('Not implemented')
  }

  /**
   * @param {number} _index
   * @return {string | null}
   */
  key(_index) {
    throw new Error('Not implemented')
  }

  /**
   *
   * @param {string} _key
   * @return {void}
   */
  removeItem(_key) {
    throw new Error('Not implemented')
  }

  /**
   *
   * @param {string} _key
   * @param {string} _value
   */
  setItem(_key, _value) {
    throw new Error('Not implemented')
  }
}
