/**
 * Application entry point.
 *
 * Custom components are registered and appends to the body.
 *
 * > ![NOTE]
 * > This file must be loaded with the attribute `type=module`
 *
 * @example
 * <script type="module" src="/js/app.js"></script>
 *
 * @module
 */
import {
  SVGIcon,
  AppHeader,
  AppMain,
  ButtonCustom,
  ListView,
  NavLists,
  ContainerBox,
} from './components/index.js'

try {
  customElements.define(SVGIcon.tag, SVGIcon)
  customElements.define(AppHeader.tag, AppHeader)
  customElements.define(AppMain.tag, AppMain)
  customElements.define(ButtonCustom.tag, ButtonCustom)
  customElements.define(ListView.tag, ListView)
  customElements.define(NavLists.tag, NavLists)
  customElements.define(ContainerBox.tag, ContainerBox)

  document.body.appendChild(document.createElement('app-header'))
  document.body.appendChild(document.createElement('app-main'))
} catch (e) {
  console.error(`App error: ${e}`)
}
