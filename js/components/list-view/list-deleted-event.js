/**
 * Event dispatch when a list have been deleted
 *
 * @class ListDeletedEvent
 * @extends {CustomEvent}
 */
export class ListDeletedEvent extends CustomEvent {
  constructor() {
    super('list-deleted', {
      bubbles: true,
    })
  }
}
