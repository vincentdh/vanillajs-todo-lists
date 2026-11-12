import { BasicComponentInterface } from '../../lib/interfaces/basic-component-interface.js'
import { Modal } from '../../modal.js'
import { lists } from '../../models/lists.js'
import stylesheet from './index.css' with { type: 'css' }
import { ListDeletedEvent } from './list-deleted-event.js'
import { ListRenamedEvent } from './list-renamed-event.js'

/** @import { ContainerBox } from '../container-box/index.js' */
/** @import { List } from '../../models/list.js' */
/** @import { ListItem } from '../../models/item.js' */

export class ListView extends BasicComponentInterface {
  /**
   * @readonly
   * @type {{}}
   */
  static get observedAttributes() {
    return ['list-id']
  }

  /**
   * @readonly
   * @type {string}
   */
  static get tag() {
    return 'list-view'
  }

  /** @type {HTMLDivElement | null} */
  #actions = null

  /** @type {ContainerBox | null} */
  #containerBox = null

  /** @type {HTMLDivElement | null} */
  #content = null

  /** @type {HTMLSpanElement | null} */
  #footer = null

  /** @type {List | null} */
  #list = null

  constructor() {
    super()
    this.stylesheets.push(stylesheet)
    this.adoptStyleSheets()

    this.#createElements()
    if (this.#containerBox !== null) {
      this.root.appendChild(this.#containerBox)
    }
  }

  /**
   * @param {'list-id'} attribute
   * @param {string | null} _
   * @param {string | null} newValue
   */
  attributeChangedCallback(attribute, _, newValue) {
    if (attribute !== 'list-id') {
      throw new Error('Unwatched attribute changed')
    }
    if (this.#list && newValue === this.#list.id) return

    if (newValue === null) {
      this.#list = null
      this.render()
    } else {
      this.#loadList(newValue)
    }
  }

  /**
   * @returns {void}
   */
  connectedCallback() {
    this.render()
  }

  render() {
    if (!this.isConnected) {
      console.warn('not connected yet')
      return
    }
    this.#clearView()
    this.#updateFooter()
    if (this.#list) {
      this.#renderList()
    } else {
      this.#renderNoList()
    }
  }

  #clearView() {
    const contentElement = this.root.getElementById('content')
    if (contentElement !== null) {
      contentElement.textContent = ''
    }
  }

  #createElements() {
    const box = /** @type {ContainerBox} */ (
      document.createElement('container-box')
    )

    box.id = 'container'
    box.setAttribute('heading', '')
    box.setAttribute('heading-level', '2')
    box.setAttribute('no-padding', 'true')
    this.#containerBox = box

    const content = document.createElement('div')
    content.id = 'content'
    content.innerText = ''

    this.#content = content
    this.#containerBox.appendChild(this.#content)

    const footerSlot = /** @type {HTMLSpanElement} */ (
      document.createElement('span')
    )
    footerSlot.slot = 'footer'
    this.#footer = footerSlot
    this.#containerBox.appendChild(this.#footer)

    const actions = document.createElement('div')
    actions.id = 'actions'
    actions.slot = 'actions'

    const renameBtn = document.createElement('button-custom')
    renameBtn.setAttribute('icon', 'pencil-line')
    renameBtn.setAttribute('variant', 'ghost')
    renameBtn.innerText = 'Rename List'
    renameBtn.addEventListener('click', this.#renameList)

    actions.appendChild(renameBtn)
    this.#actions = actions
    this.#containerBox.appendChild(this.#actions)
  }

  /**
   * @returns {HTMLFormElement}
   */
  #createForm() {
    const form = document.createElement('form')

    const input = document.createElement('input')
    input.name = 'task'
    input.ariaLabel = 'New task input field'
    form.appendChild(input)

    const addBtn = document.createElement('button-custom')
    addBtn.setAttribute('type', 'submit')
    addBtn.innerText = '+ Add'

    form.appendChild(addBtn)

    form.addEventListener('submit', this.#formSubmitted)

    return form
  }

  /**
   * @param {ListItem} item
   * @param {number} [order=0]
   * @returns {HTMLDivElement}
   */
  #createItemElement(item, order = 0) {
    const divElement = document.createElement('div')

    const divItem = document.createElement('div')
    divItem.classList.add('item-label')

    const actions = document.createElement('div')
    const delBtn = document.createElement('button-custom')
    delBtn.setAttribute('variant', 'danger')
    delBtn.setAttribute('icon', 'eraser')
    delBtn.setAttribute('hide-label', 'true')
    delBtn.innerText = 'Delete item'

    const completedBtn = document.createElement('button-custom')
    completedBtn.setAttribute('variant', 'ghost')
    completedBtn.setAttribute('icon', 'square-check-big')
    completedBtn.setAttribute('hide-label', 'true')
    completedBtn.innerText = 'Mark uncompleted'

    const notCompletedBtn = document.createElement('button-custom')
    notCompletedBtn.setAttribute('variant', 'ghost')
    notCompletedBtn.setAttribute('icon', 'square')
    notCompletedBtn.setAttribute('hide-label', 'true')
    notCompletedBtn.innerText = 'Mark completed'
    actions.appendChild(delBtn)

    const spanName = document.createElement('span')
    spanName.innerText = item.description

    divItem.appendChild(completedBtn)
    divItem.appendChild(notCompletedBtn)
    divItem.appendChild(spanName)

    divElement.appendChild(divItem)
    divElement.appendChild(actions)

    divElement.style.setProperty('--i', order.toString())
    divElement.setAttribute('item-id', item.id)

    if (item.completed) {
      divElement.classList.add('completed')
    }
    delBtn.addEventListener('click', () => this.#itemDeleteHandler(divElement))
    completedBtn.addEventListener('click', () =>
      this.#itemDoneHandler(divElement),
    )
    notCompletedBtn.addEventListener('click', () =>
      this.#itemDoneHandler(divElement),
    )

    return divElement
  }

  /**
   *
   * @returns {HTMLDivElement}
   */
  #createItemsList() {
    const div = document.createElement('div')
    div.id = 'items'

    let z = 0
    if (this.#list !== null) {
      this.#list.items.forEach((element) => {
        div.appendChild(this.#createItemElement(element, ++z))
      })
    }

    return div
  }

  /**
   * @returns {Promise<void>}
   */
  #deleteList = async () => {
    const modal = new Modal({
      title: `Delete ${this.#list?.name || 'EMPTY LIST NAME'} ?`,
      description: 'This cannot be undone. Are you sure?',
      closeLabel: 'Yes, delete it.',
      closeVariant: 'danger',
      showCancel: true,
      cancelLabel: 'No, keep it!',
    })
    const answer = await modal.open()
    if (answer !== null && this.#list !== null) {
      this.#list.destroy()
      this.#list = null
      this.render()
      this.dispatchEvent(new ListDeletedEvent())
    }
  }

  /**
   *
   * @param {SubmitEvent} e
   */
  #formSubmitted = (e) => {
    e.stopImmediatePropagation()
    e.preventDefault()
    const form = this.root.querySelector('form')
    if (form === null) return
    const vals = new FormData(form)

    const task = vals.get('task')

    if (typeof task === 'string' && this.#list !== null) {
      const newItem = this.#list.add(task.trim())
      if (newItem === undefined) return
      const input = form.querySelector('input')
      if (input !== null) {
        input.value = ''
      }
      const item = this.#createItemElement(newItem)

      const itemsElement = this.root.querySelector('#items')
      if (itemsElement !== null) {
        itemsElement.appendChild(item)
        itemsElement.scrollTo({
          top: itemsElement.scrollHeight,
        })
      }
    }
  }

  /**
   * @param {HTMLElement} element
   * @returns {Promise<void>}
   */
  #itemDeleteHandler = async (element) => {
    const itemId = element.getAttribute('item-id')
    if (itemId !== null) {
      const message = document.createElement('p')
      message.append(
        'This operation cannot be undone.',
        document.createElement('br'),
        'Do you want to continue?',
      )
      const confirmModal = new Modal({
        title: `Deleting task: "${element.innerText}"`,
        descriptionNode: message,
        closeLabel: 'Yes, delete it.',
        closeVariant: 'danger',
        showCancel: true,
        cancelLabel: 'Cancel',
      })
      if ((await confirmModal.open()) !== null) {
        this.#list?.deleteItem(itemId)
        element.remove()
      }
    }
  }

  /**
   * @param {Element} element
   */
  #itemDoneHandler = (element) => {
    const itemId = element.getAttribute('item-id')
    if (itemId !== null) {
      element.classList.toggle('completed')
      this.#list?.setItemCompleted(itemId)
    }
  }

  /**
   *
   * @param {string} listId
   */
  #loadList(listId) {
    this.#list = lists.get(listId)
    this.render()
  }

  /**
   * @returns {Promise<void>}
   */
  #renameList = async () => {
    if (this.#list === null) return
    const renameModal = new Modal({
      showCancel: true,
      title: 'Rename List',
      description: 'Enter the new list name',
      showInput: true,
      inputDefaultValue: this.#list.name,
    })
    const newName = await renameModal.open()
    if (newName !== null && newName.trim() !== '') {
      this.#list.rename(newName.trim())
      this.#containerBox?.setAttribute('heading', newName.trim())
      this.dispatchEvent(new ListRenamedEvent(this.#list.id))
    }
  }

  #renderList() {
    const container = this.root.getElementById('container')

    const content = this.root.getElementById('content')

    if (container === null || content === null) return

    content.classList.remove('nolist')
    const formContainer = this.#createForm()
    content.appendChild(formContainer)
    content.appendChild(this.#createItemsList())

    container.setAttribute('heading', this.#list?.name || '')

    formContainer.querySelector('input')?.focus()

    if (this.#actions !== null) {
      this.#containerBox
        ?.querySelector('#actionsPlaceholder')
        ?.replaceWith(this.#actions)
    }
  }

  #renderNoList() {
    const content = this.root.getElementById('content')
    if (content !== null && this.#containerBox !== null) {
      this.#containerBox.setAttribute('heading', '')
      content.classList.add('nolist')
      content.innerText = 'No list selected'
    }
    const actionsPlaceholder = document.createElement('div')
    actionsPlaceholder.setAttribute('id', 'actionsPlaceholder')
    this.#actions?.replaceWith(actionsPlaceholder)
  }

  #updateFooter() {
    if (this.#list !== null) {
      const b = document.createElement('button-custom')
      b.innerText = 'Delete list'
      b.setAttribute('variant', 'danger')
      b.setAttribute('icon', 'shredder')
      b.addEventListener('click', this.#deleteList)

      if (this.#footer !== null) {
        this.#footer.style.width = '100%'
        this.#footer.style.display = 'flex'
        this.#footer.style.justifyContent = 'flex-end'
        this.#footer.replaceChildren(b)
      }
    } else {
      this.#footer?.replaceChildren()
    }
  }
}
