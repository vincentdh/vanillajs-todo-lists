/**
 * Event dispatch when a list have been renamed
 *
 * @class ListRenamedEvent
 * @extends {CustomEvent}
 */
export class ListRenamedEvent extends CustomEvent {
  /**
   * @param {string} listId
   */
  constructor(listId) {
    super('list-renamed', {
      bubbles: true,
      detail: {
        listId,
      },
    })
  }
}
