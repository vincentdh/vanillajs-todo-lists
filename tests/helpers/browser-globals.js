/**
 * Browser globals used by the models, provided for Node-based unit tests.
 *
 * - `self` is used by `crypto.randomUUID()` in the models.
 * - `localStorage` is used by the default `store` through LocalStorageAdapter.
 *   It is read at call time, so replacing it before each test is enough.
 */
import { InMemoryStorage } from './in-memory-storage.js'

globalThis.self ??= globalThis

/**
 * Replaces `globalThis.localStorage` with an empty in-memory storage.
 * Call it in `beforeEach` so each test starts from an empty store.
 *
 * @returns {InMemoryStorage}
 */
export function resetLocalStorage() {
  const storage = new InMemoryStorage()
  globalThis.localStorage = storage
  return storage
}
