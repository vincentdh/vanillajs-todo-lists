import { test, expect } from '@playwright/test'

/** Builds a tag tree in the page and returns the resulting outerHTML. */
const build = (page, tree) =>
  page.evaluate((tree) => window.buildTagElement(tree).outerHTML, tree)

test.describe('html-builder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/harness/html-builder.html')
    await page.waitForFunction(() => window.harnessReady === true)
  })

  test('builds nested elements with their attributes', async ({ page }) => {
    const html = await build(page, {
      tag: 'div',
      attributes: { id: 'root', class: 'box' },
      content: [
        { tag: 'h2', content: 'Title' },
        {
          tag: 'p',
          attributes: { lang: 'en' },
          content: [{ tag: 'span', content: 'inner' }],
        },
        { tag: 'hr', attributes: { width: '75%' } },
      ],
    })

    expect(html).toBe(
      '<div id="root" class="box"><h2>Title</h2><p lang="en"><span>inner</span></p><hr width="75%"></div>',
    )
  })

  test('renders a string content as text, never as markup', async ({
    page,
  }) => {
    const literal = '<b id="x">not bold</b>'
    const html = await build(page, { tag: 'p', content: literal })

    expect(html).toBe('<p>&lt;b id="x"&gt;not bold&lt;/b&gt;</p>')
    const parsed = await page.evaluate((html) => {
      const el = document.createElement('div')
      el.innerHTML = html
      return {
        boldElements: el.querySelectorAll('b').length,
        text: el.textContent,
      }
    }, html)
    expect(parsed.boldElements).toBe(0)
    expect(parsed.text).toBe(literal)
  })

  test('renders string items in an array as text next to elements', async ({
    page,
  }) => {
    const html = await build(page, {
      tag: 'p',
      content: ['text ', { tag: 'b', content: 'bold' }, ' <i>end</i>'],
    })

    expect(html).toBe('<p>text <b>bold</b> &lt;i&gt;end&lt;/i&gt;</p>')
  })

  test('sets attribute values as attributes, not as markup', async ({
    page,
  }) => {
    const value = '"><script>window.injected = true</script>'
    const result = await page.evaluate((value) => {
      const el = window.buildTagElement({
        tag: 'a',
        attributes: { title: value },
        content: 'link',
      })
      return {
        title: el.getAttribute('title'),
        scripts: el.querySelectorAll('script').length,
        injected: window.injected === true,
      }
    }, value)

    expect(result.title).toBe(value)
    expect(result.scripts).toBe(0)
    expect(result.injected).toBe(false)
  })

  test('builds the licence data into its headings and paragraphs', async ({
    page,
  }) => {
    const result = await page.evaluate(() => {
      const el = window.buildTagElement(window.LICENSE_ACKNOWLEDGMENT)
      const expectedParagraphs = window.LICENSE_ACKNOWLEDGMENT.content.filter(
        (item) => typeof item === 'object' && item.tag === 'p',
      ).length
      return {
        heading: el.querySelector('h2')?.textContent,
        paragraphs: el.querySelectorAll(':scope > p').length,
        expectedParagraphs,
      }
    })

    expect(result.heading).toBe('Lucide License')
    expect(result.paragraphs).toBe(result.expectedParagraphs)
  })
})
