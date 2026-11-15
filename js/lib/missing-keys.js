/**
 * Set.prototype.isSubsetOf is Baseline 2024 (MDN), so it is only used where the
 * browser supports it. The fallback returns the same result.
 *
 * It is a scaling choice: isSubsetOf skips building the difference when the
 * data is valid. Measured in Node 24 with 10,000 candidate keys and 100
 * required keys, valid data took about 40% less time with isSubsetOf. The
 * models only check 3 or 4 keys, where the filter is a few tens of nanoseconds
 * faster, so this does not speed up the app itself.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/isSubsetOf
 */
const canUseSetMethods = typeof Set.prototype.isSubsetOf === 'function'

/**
 * Returns the mandatory keys that are missing from `keys`.
 *
 * @param {ReadonlySet<string>} mandatory
 * @param {ReadonlySet<string>} keys
 * @returns {string[]}
 */
export function missingKeys(mandatory, keys) {
  if (canUseSetMethods && mandatory.isSubsetOf(keys)) return []
  return [...mandatory].filter((key) => !keys.has(key))
}
