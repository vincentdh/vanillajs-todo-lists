// Type declarations for non-JS imports used by the app

// CSS modules: `import stylesheet from './style.css' with { type: 'css' }`
declare module '*.css' {
  const stylesheet: CSSStyleSheet
  export default stylesheet
}

// JSON modules: `import data from '../data/randomdata.json' with { type: 'json' }`
declare module '*.json' {
  const data: any
  export default data
}

// Custom events types
interface HTMLElementEventMap {
  'list-selected': import('../js/components/nav-lists/list-selected-event.js').ListSelectedEvent
  'list-renamed': import('../js/components/list-view/list-renamed-event.js').ListRenamedEvent
  'list-deleted': import('../js/components/list-view/list-deleted-event.js').ListDeletedEvent
}
