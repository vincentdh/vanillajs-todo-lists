/**
 * @typedef {{
 * tag: 'a',
 * content: string | HTMLTagElement | Array<string|HTMLTagElement>,
 * attributes?: Record<string, string>
 * }} HTMLTagA
 */
/**
 * @typedef {{
 * tag: 'h1'|'h2'|'h3'|'h4'|'h5'|'h6',
 * content: string,
 * attributes?: Record<string, string>
 * }} HTMLTagHeading
 */
/**
 * @typedef {{
 * tag: 'p',
 * content: string | Array<string|HTMLTagA|HTMLTagBR|HTMLTagP|HTMLTagHR|HTMLTagSPAN|HTMLTagElement>,
 * attributes?: Record<string, string>
 * }} HTMLTagP
 */
/**
 * @typedef {{
 * tag: 'br',
 * attributes?: Record<string, string>
 * }} HTMLTagBR
 */
/**
 * @typedef {{
 * tag: 'hr',
 * attributes?: Record<string, string>
 * }} HTMLTagHR
 */
/**
 * @typedef {{
 * tag: 'div',  
 * content: string | HTMLTag | Array<string | HTMLTag>,
 * attributes?: Record<string, string>
 * }} HTMLTagDiv
 */
/**
 * @typedef {{
 * tag: 'span',
 * content: string,
 * attributes?: Record<string, string>
 * }} HTMLTagSPAN
 */
/**
 * @typedef {{
 * tag: 'i'|'b'|'s'|'em'|'strong'|'small'|'code'|'abbr'|'sub'|'sup'|'mark',  
 * content: string,
 * attributes?: Record<string, string>
 * }} HTMLTagElement
 */

/**
 * @typedef { HTMLTagA |
 *            HTMLTagHeading |
 *            HTMLTagP |
 *            HTMLTagBR |
 *            HTMLTagHR |
 *            HTMLTagDiv |
 *            HTMLTagSPAN |
 *            HTMLTagElement
 * } HTMLTag
 */

export {}
