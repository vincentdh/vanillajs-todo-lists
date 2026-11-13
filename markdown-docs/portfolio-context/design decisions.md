---
title: Why it is built this way
group: Portfolio context
order: 10
---

# Why it is built this way

This application is a technical demonstration. This page explains the general
choices that follow from that context. The
[skills map](/portfolio-context/skills-map) lists the skills it demonstrates and
where to find each one.

## No framework and no library

Creating an application with a framework or a library doesn't always mean that
you understand everything that happens under the hood. As this application is a
technical demonstration, I thought it would be more interesting to show plain
JavaScript instead of hooks and framework components. The same applies to
component libraries (for example shadcn/ui).

## No bundler

There is no build step. The browser loads the source files exactly as they are
written, so the code stays readable through standard sources: nothing is
generated, bundled or minified. Stylesheets and JSON data are loaded with native
module imports (`with { type: 'css' }` and `with { type: 'json' }`).

## Types with JSDoc instead of TypeScript

The code is typed with JSDoc comments. The types stay readable next to the code
they describe, and the files need no transpiling before they run in the browser.

## Minimalistic `index.html`

As many JavaScript frameworks do, I kept `index.html` to the bare minimum: the
page is built entirely in JavaScript.

As this is a JavaScript demonstration and not an HTML syntax demo, I avoided
`innerHTML` almost everywhere. The only exception is `modal.js`, where I kept
`innerHTML` for the basic structure. It could have been done by creating the
elements manually, but I chose to demonstrate an alternative.

## No hard standards, various methods

To demonstrate a variety of design patterns and skills, I didn't follow a single
standard for the whole application. Instead, the documentation explains each
approach in detail where it is relevant.
