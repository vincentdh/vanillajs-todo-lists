import { test, expect } from '@playwright/test'

const FIXTURE_URL = '/tests/harness/load-stylesheet.css'

test.describe('loadStylesheet', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/harness/load-stylesheet.html')
    await page.waitForFunction(() => window.harnessReady === true)
  })

  test('returns a CSSStyleSheet whose rules apply once adopted', async ({
    page,
  }) => {
    const result = await page.evaluate(async (url) => {
      const target = document.getElementById('target')
      const read = () => {
        const style = getComputedStyle(target)
        return { borderTopWidth: style.borderTopWidth, color: style.color }
      }

      const before = read()
      const stylesheet = await window.loadStylesheet(url)
      document.adoptedStyleSheets = [stylesheet]

      return {
        after: read(),
        before,
        isCSSStyleSheet: stylesheet instanceof CSSStyleSheet,
        selectors: Array.from(stylesheet.cssRules, (rule) => rule.selectorText),
      }
    }, FIXTURE_URL)

    expect(result.isCSSStyleSheet).toBe(true)
    expect(result.selectors).toEqual(['#target', '.framed'])

    // The fixture values are not the defaults: the rules are what sets them.
    expect(result.before.color).not.toBe('rgb(1, 2, 3)')
    expect(result.before.borderTopWidth).toBe('0px')
    expect(result.after).toEqual({
      borderTopWidth: '7px',
      color: 'rgb(1, 2, 3)',
    })
  })

  test('throws when the HTTP status is not 200', async ({ page }) => {
    const outcome = await page.evaluate(async () => {
      try {
        await window.loadStylesheet('/tests/harness/does-not-exist.css')
        return { threw: false }
      } catch (error) {
        return {
          isError: error instanceof Error,
          message: error.message,
          threw: true,
        }
      }
    })

    expect(outcome.threw).toBe(true)
    expect(outcome.isError).toBe(true)
    expect(outcome.message).toMatch(/^Unable to load stylesheet: HTTP\/404\b/)
  })
})
