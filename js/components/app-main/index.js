import data from '../../../data/randomdata.json' with { type: 'json' }
import { BasicComponentInterface } from '../../lib/interfaces/basic-component-interface.js'
import { Modal } from '../../modal.js'
import { lists } from '../../models/lists.js'
import { randomMinMax, randomPick } from '../../utils/index.js'
import stylesheet from './style.css' with { type: 'css' }

/** @import { ListView } from '../list-view/index.js' */
/** @import { NavLists } from '../nav-lists/index.js' */
/** @import { ListSelectedEvent } from '../nav-lists/list-selected-event.js' */

/**
 * Shape of data/randomdata.json.
 *
 * @typedef {Record<string, { listNames: string[], items: string[] }>} DemoData
 */

export class AppMain extends BasicComponentInterface {
  /**
   * @readonly
   * @type {string}
   */
  static get tag() {
    return 'app-main'
  }

  /** @type {NavLists | null} */
  #listsNav = null

  /** @type {ListView | null} */
  #listView = null

  constructor() {
    super()
    this.stylesheets.push(stylesheet)
    this.adoptStyleSheets()
  }

  /**
   * @returns {void}
   */
  connectedCallback() {
    const mainElement = document.createElement('main')
    this.#listView = /** @type {ListView} */ (
      document.createElement('list-view')
    )
    mainElement.style.display = 'contents'

    this.#listsNav = /** @type {NavLists} */ (
      document.createElement('nav-lists')
    )
    this.#listsNav.addEventListener('list-selected', this.#handleListSelected)

    mainElement.appendChild(this.#listsNav)
    mainElement.appendChild(this.#listView)

    this.root.appendChild(mainElement)

    if (this.#listsNav['list-count'] === 0) this.#generateData()
  }

  async #generateData() {
    const modal = new Modal({
      title: 'Welcome',
      description:
        'It appears that your browser has no to-do list saved. Would you like to generate random data to test the application?',
      closeLabel: 'Yes, thanks',
      closeVariant: 'accent',
      showCancel: true,
      cancelLabel: "It's fine, I'll create a list myself",
    })
    if ((await modal.open()) !== null) {
      const demoData = /** @type {DemoData} */ (data)
      const categories = /** @type {Array<keyof DemoData>} */ (
        Object.keys(demoData)
      )
      for (const c of randomPick(
        categories,
        randomMinMax(1, categories.length),
      )) {
        const cat = demoData[c]
        const title = randomPick(cat.listNames, 1)[0]
        const items = randomPick(cat.items, cat.items.length)
        const list = lists.create(title)
        for (const item of items) {
          list.add(item)
        }
      }
      if (this.#listsNav !== null) {
        this.#listsNav.refresh()
      }
    }
  }

  /**
   *
   * @param {ListSelectedEvent} e
   */
  #handleListSelected = (e) => {
    if (this.#listView !== null) {
      this.#listView.setAttribute('list-id', e.selectedList)
    }
  }
}
