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

## `button-custom` overwrites an `aria-label` set by the caller

- **What:** the component computes its accessible name from its text content and
  writes it as an `aria-label` attribute on its host. An `aria-label` set by the
  caller is replaced. A native `<button>` lets `aria-label` override the name
  that comes from its content.
- **Plan:** move the ARIA defaults to `ElementInternals`. The text content will
  remain the default name, and an `aria-label` set by the caller will override
  it.
- **See:** [`button-custom`](/under-the-hood/components/button-custom).
