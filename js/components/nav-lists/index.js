import { BasicComponentInterface } from '../../lib/interfaces/basic-component-interface.js'
import Modal from '../../modal.js'
import { lists } from '../../models/lists.js'
import { ListSelectedEvent } from './list-selected-event.js'
import stylesheet from './style.css' with { type: 'css' }

/** @import { ListRenamedEvent } from '../list-view/list-renamed-event.js' */
/** @import { ContainerBox } from '../container-box/index.js'*/
/** @import {ModalOptions} from '../../modal.js' */
/** @import {List} from '../../models/list.js' */

export class NavLists extends BasicComponentInterface {
  /**
   *
   * @readonly
   * @type {string}
   */
  static get tag() {
    return 'nav-lists'
  }

  get 'list-count'() {
    return this.#storedLists.length
  }

  /**
   *
   * @type {string | null}
   */
  #nextSelection = null

  /** @type {Array<List>} */
  #storedLists = []

  constructor() {
    super()
  }

  /**
   * @returns {void}
   */
  connectedCallback() {
    const template = document.createElement('template')
    const container = this.#createContainerBox()
    const footer = this.#createFooter()

    this.ariaLabel = 'Lists'
    this.role = 'navigation'

    const list = document.createElement('ul')

    container.appendChild(list)
    container.appendChild(footer)
    template.content.appendChild(container)

    this.stylesheets.push(stylesheet)
    this.adoptStyleSheets()

    if (!this.root.hasChildNodes()) {
      this.root.appendChild(template.content.cloneNode(true))
    }

    this.#refreshStoredList()
    this.render()
    this.#attachListeners()
  }

  disconnectedCallback() {
    this.#removeListeners()
  }

  refresh() {
    this.#refreshStoredList()
    this.render()
  }

  render() {
    const ul = document.createElement('ul')
    this.#storedLists.forEach((list) => {
      const li = document.createElement('li')
      li.setAttribute('x-data', list.id)
      li.append(document.createTextNode(list.name))
      ul.appendChild(li)
    })
    const ulElement = this.root.querySelector('ul')
    if (ulElement !== null) {
      ul.addEventListener('click', this.#listClicked)
      ulElement.replaceWith(ul)
    }
    this.#selectList()
  }

  #attachListeners() {
    const parentNode = this.parentNode
    if (parentNode instanceof HTMLElement) {
      parentNode.addEventListener('list-deleted', this.#handleListDeleted)
      parentNode.addEventListener('list-renamed', this.#handleListRenamed)
      const addListElement = this.root.getElementById('addList')
      if (addListElement !== null) {
        addListElement.addEventListener('click', this.#createList)
      }
    }
  }

  /**
   *
   * @returns {ContainerBox}
   */
  #createContainerBox() {
    const container = /** @type {ContainerBox} */ (
      document.createElement('container-box')
    )
    container.setAttribute('heading', 'Lists')
    container.setAttribute('heading-level', '2')
    return container
  }

  /**
   *
   * @returns {HTMLDivElement}
   */
  #createFooter() {
    const footer = document.createElement('div')
    const addBtn = document.createElement('button-custom')
    footer.slot = 'footer'

    addBtn.id = 'addList'
    addBtn.innerText = 'Create New List'
    footer.appendChild(addBtn)

    return footer
  }

  /**
   *
   * @returns {Promise<void>}
   */
  #createList = async () => {
    const listName = await this.#promptListName()
    if (listName && listName !== '') {
      const newList = lists.create(listName)
      this.#nextSelection = newList.id
      this.#refreshStoredList()
      this.render()
    }
  }

  #deselectLists() {
    this.root
      .querySelectorAll('li.selected')
      .forEach((el) => el.classList.remove('selected'))
  }

  #handleListDeleted = () => {
    this.#refreshStoredList()
    this.render()
  }

  /**
   *
   * @param {ListRenamedEvent} e
   */
  #handleListRenamed = (e) => {
    const listId = e.detail.listId
    this.#refreshStoredList()
    const newSelectedListEl = /** @type {HTMLElement} */ (
      this.root.querySelector(`[x-data='${listId}']`)
    )
    const list = this.#storedLists.find((item) => item.id === listId)
    newSelectedListEl.innerText = list?.name || ''
  }

  /**
   *
   * @param {MouseEvent} e
   */
  #listClicked = (e) => {
    const listId = /** @type {Element} */ (e.target).getAttribute('x-data')
    if (listId !== null) {
      this.#selectList(listId)
    }
  }

  /**
   *
   * @returns {Promise<string|null>}
   */
  #promptListName = async () => {
    /** @type ModalOptions */
    const modalConfig = {
      title: 'Create a new list',
      description: 'Enter the list name',
      showCancel: true,
      cancelLabel: 'Cancel',
      closeLabel: 'Add',
      showInput: true,
      disableBackdropDismissal: true,
    }
    const modal = new Modal(modalConfig)
    return await modal.open()
  }

  #refreshStoredList() {
    this.#storedLists = lists.getIndex()
  }

  #removeListeners() {
    const parentNode = this.parentNode
    if (parentNode instanceof HTMLElement) {
      parentNode.removeEventListener('list-deleted', this.#handleListDeleted)
      const addListElement = this.root.getElementById('addList')
      if (addListElement !== null) {
        addListElement.removeEventListener('click', this.#createList)
      }
    }
  }

  /**
   *
   * @param {string} [listId]
   */
  #selectList(listId) {
    let newListId = null
    if (!listId) {
      if (this.#nextSelection !== null) {
        newListId = this.#nextSelection
        this.#nextSelection = null
      } else if (this.#storedLists.length > 0) {
        newListId = this.#storedLists[0].id
      }
    } else {
      newListId = listId
    }
    if (newListId === null) return
    this.#deselectLists()
    const newSelectedList = this.root.querySelector(`[x-data='${newListId}']`)
    if (newSelectedList === null) {
      console.warn(`List ${listId} cannot be found...`)
      return
    }
    newSelectedList.classList.add('selected')
    this.dispatchEvent(new ListSelectedEvent(newListId))
  }
}
