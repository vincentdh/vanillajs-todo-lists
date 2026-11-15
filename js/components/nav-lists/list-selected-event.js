/**
 * Event dispatched when a list is selected
 *
 * @class ListSelectedEvent
 * @extends {Event}
 */
export class ListSelectedEvent extends Event {
  /** @type {string} */
  selectedList

  /**
   * @param {string} id
   */
  constructor(id) {
    super('list-selected')
    this.selectedList = id
  }
}
