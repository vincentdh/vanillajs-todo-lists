/**
 * Module responsible of the application header.
 */
import { BasicComponentInterface } from '../../lib/interfaces/basic-component-interface.js'
import { store } from '../../lib/services/storage.js'
import { Modal } from '../../modal.js'
import { buildTagElement } from '../../utils/html-builder.js'
import { LICENSE_ACKNOWLEDGMENT } from './license-acknowledgment.js'
import stylesheet from './style.css' with { type: 'css' }

/** @import { SVGIcon } from '../svg-icon/index.js' */

/**
 * @class
 * @extends BasicComponentInterface
 */
export class AppHeader extends BasicComponentInterface {
  /**
   *
   * @readonly
   * @type {string}
   */
  static get tag() {
    return 'app-header'
  }

  /** @type {HTMLDivElement} */
  #actionsContainer = document.createElement('div')

  /** @type {HTMLElement | null} */
  #appHeader = null

  /** @type {SVGIcon | null} */
  #appIcon = null

  /*** @type {HTMLElement| null} */
  #helpLink = null

  /*** @type {HTMLElement | null} */
  #licenseButton = null

  /*** @type {HTMLElement | null} */
  #nukeButton = null

  /** @type {HTMLSlotElement | null} */
  #titleSlot = null

  /**
   *
   */
  constructor() {
    super()
    this.stylesheets.push(stylesheet)
    this.adoptStyleSheets()
  }

  /**
   * @returns {void}
   */
  connectedCallback() {
    this.#createHeader()
    if (this.#appHeader !== null) {
      this.root.appendChild(this.#appHeader)
    }
  }

  #createAppIcon() {
    this.#appIcon = /** @type {SVGIcon} */ (document.createElement('svg-icon'))
    this.#appIcon.setAttribute('name', 'logo')
    this.#appIcon.ariaLabel = 'Application logo'
  }

  #createHeader() {
    this.#appHeader = document.createElement('header')
    const h1 = document.createElement('h1')

    this.#createAppIcon()
    this.#createTitleSlot()

    if (this.#appIcon !== null) {
      h1.appendChild(this.#appIcon)
    }
    if (this.#titleSlot !== null) {
      h1.appendChild(this.#titleSlot)
    }

    this.#createLicenseButton()
    this.#createHelpLink()
    this.#createNukeButton()

    this.#appHeader.appendChild(h1)
    this.#appHeader.appendChild(this.#actionsContainer)
  }

  #createHelpLink() {
    const link = document.createElement('button-custom')
    link.setAttribute('href', './docs')
    link.setAttribute('href-target', '_blank')
    link.setAttribute('variant', 'ghost')
    link.setAttribute('hide-label', 'true')
    link.setAttribute('icon', 'circle-question-mark')
    link.setAttribute('icon-size', '32px')
    link.innerText = 'Documentation'
    this.#helpLink = link
    this.#actionsContainer.appendChild(this.#helpLink)
  }

  #createLicenseButton() {
    const button = document.createElement('button-custom')
    button.setAttribute('variant', 'ghost')
    button.setAttribute('hide-label', 'true')
    button.setAttribute('icon', 'scale')
    button.setAttribute('icon-size', '32px')
    button.innerText = 'Show Open Source Licenses Acknowledgements modal'
    button.addEventListener('click', this.#showLicense)

    this.#licenseButton = button
    this.#actionsContainer.appendChild(this.#licenseButton)
  }

  #createNukeButton() {
    const button = document.createElement('button-custom')
    button.setAttribute('variant', 'ghost')
    button.setAttribute('hide-label', 'true')
    button.setAttribute('icon', 'bomb')
    button.setAttribute('icon-size', '32px')
    button.innerText = 'Nuke data'
    button.addEventListener('click', this.#nukeStorage)

    this.#nukeButton = button
    this.#actionsContainer.appendChild(this.#nukeButton)
  }

  #createTitleSlot() {
    this.#titleSlot = document.createElement('slot')
    this.#titleSlot.name = 'title'
    this.#titleSlot.innerText = 'VanillaJS To-do Lists'
  }

  #nukeStorage = async () => {
    const modal = new Modal({
      title: 'Delete everything!',
      description:
        'All data will be wipped! Are you sure you want to continue?',
      showCancel: true,
      cancelLabel: 'CANCEL!',
      closeVariant: 'danger',
      closeLabel: 'Yes, NUKE IT!',
    })
    if ((await modal.open()) !== null) {
      store.nuke()
      location.reload()
    }
  }

  #showLicense = () => {
    const licenseDiv = buildTagElement(LICENSE_ACKNOWLEDGMENT)

    new Modal({
      title: 'Open Source Licenses Acknowledgements',
      descriptionNode: licenseDiv,
      scrollableDescription: true,
      large: true,
    }).open()
  }
}
