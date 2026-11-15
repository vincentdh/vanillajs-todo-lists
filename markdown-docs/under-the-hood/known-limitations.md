---
title: Known limitations
group: Under the hood
order: 90
---

# Known limitations

This page lists the choices that the author considers imperfect, and what is
planned for each. The other pages explain the choices that the author stands by;
this one says where the limits are. What the application is not meant to do is
described in
[Why it is built this way](/portfolio-context/why-it-is-built-this-way).

## The application does not start in every browser

- **What:** the components import their stylesheets as CSS module scripts
  (`with { type: 'css' }`). Safari does not support them, and Firefox only since
  version 147. In these browsers the page stays empty. Other features have a
  limited availability too, such as `:state()` and `contrast-color()`. The
  versions are listed in [Styling](/under-the-hood/styling).
- **Plan:** remove the features with a limited availability, or give them an
  alternative.

## `button-custom` overwrites an `aria-label` set by the caller

- **What:** the component computes its accessible name from its text content and
  writes it as an `aria-label` attribute on its host. An `aria-label` set by the
  caller is replaced. A native `<button>` lets `aria-label` override the name
  that comes from its content.
- **Plan:** move the ARIA defaults to `ElementInternals`. The text content will
  remain the default name, and an `aria-label` set by the caller will override
  it.
- **See:** [`button-custom`](/under-the-hood/components/button-custom).
