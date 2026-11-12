import { test, expect } from '@playwright/test'

import {
  setupTestListWithItems,
  clearAllStorage,
} from '../helpers/test-data.js'

const itemRow = (page, description) =>
  page.locator('list-view [item-id]', { hasText: description })

test.describe('Advanced Workflows', () => {
  test('handles multiple lists operations', async ({ page }) => {
    await page.goto('/')

    // Setup multiple lists
    await page.evaluate(() => {
      const lists = [
        { id: '1', name: 'Shopping', items: [] },
        { id: '2', name: 'Work', items: [] },
        { id: '3', name: 'Personal', items: [] },
      ]

      lists.forEach((list) => {
        localStorage.setItem(`list-${list.id}`, JSON.stringify(list))
      })
    })

    await page.reload()
    // Verify all lists are shown in navigation
    const nav = page.locator('nav-lists')
    await expect(nav).toContainText('Shopping')
    await expect(nav).toContainText('Work')
    await expect(nav).toContainText('Personal')
  })

  test('switches between lists smoothly', async ({ page }) => {
    await page.goto('/')

    // Setup multiple lists with different items
    await page.evaluate(() => {
      const list1Data = {
        id: '1',
        name: 'List 1',
        items: ['item-1a', 'item-1b'],
      }
      const list2Data = {
        id: '2',
        name: 'List 2',
        items: ['item-2a', 'item-2b'],
      }

      localStorage.setItem('list-1', JSON.stringify(list1Data))
      localStorage.setItem('list-2', JSON.stringify(list2Data))

      const items = [
        { id: 'item-1a', description: 'Task 1A', completed: false },
        { id: 'item-1b', description: 'Task 1B', completed: false },
        { id: 'item-2a', description: 'Task 2A', completed: false },
        { id: 'item-2b', description: 'Task 2B', completed: false },
      ]

      items.forEach((item) => {
        localStorage.setItem(`item-${item.id}`, JSON.stringify(item))
      })
    })

    await page.reload()
    await page.waitForTimeout(500)

    // Click on List 1
    await page.locator('nav-lists').locator('text=List 1').click()
    await expect(page.locator('list-view')).toContainText('Task 1A')

    // Click on List 2
    await page.locator('nav-lists').locator('text=List 2').click()
    await expect(page.locator('list-view')).toContainText('Task 2A')

    // Back to List 1
    await page.locator('nav-lists').locator('text=List 1').click()
    await expect(page.locator('list-view')).toContainText('Task 1A')
  })

  test('maintains state during rapid operations', async ({ page }) => {
    await page.goto('/')
    const listId = 'test-list'

    await clearAllStorage(page)
    await setupTestListWithItems(page, listId, 'Test', [])

    await page.reload()
    await page.locator('nav-lists li', { hasText: 'Test' }).click()

    // Add multiple items rapidly
    const input = page.locator('list-view').getByRole('textbox')
    for (let i = 0; i < 5; i++) {
      await input.fill(`Item ${i + 1}`)
      await page.keyboard.press('Enter')
    }

    // Verify all items were added
    const listView = page.locator('list-view')
    for (let i = 0; i < 5; i++) {
      await expect(listView).toContainText(`Item ${i + 1}`)
    }
  })

  test('completes each item and keeps the state after reload', async ({
    page,
  }) => {
    await page.goto('/')
    await clearAllStorage(page)
    await setupTestListWithItems(page, 'test-list', 'Test', [
      { id: 'item-1', description: 'Task 1', completed: false },
      { id: 'item-2', description: 'Task 2', completed: false },
      { id: 'item-3', description: 'Task 3', completed: false },
    ])
    await page.reload()
    await page.locator('nav-lists li', { hasText: 'Test' }).click()

    for (const description of ['Task 1', 'Task 2', 'Task 3']) {
      await itemRow(page, description)
        .getByRole('button', { name: 'Mark completed' })
        .click()
      await expect(itemRow(page, description)).toHaveClass(/completed/)
    }

    await page.reload()
    await page.locator('nav-lists li', { hasText: 'Test' }).click()
    for (const description of ['Task 1', 'Task 2', 'Task 3']) {
      await expect(itemRow(page, description)).toHaveClass(/completed/)
    }
  })

  test('deletes a completed item and keeps the others', async ({ page }) => {
    await page.goto('/')
    await clearAllStorage(page)
    await setupTestListWithItems(page, 'test-list', 'Test', [
      { id: 'item-1', description: 'Task 1', completed: true },
      { id: 'item-2', description: 'Task 2', completed: false },
      { id: 'item-3', description: 'Task 3', completed: true },
    ])
    await page.reload()
    await page.locator('nav-lists li', { hasText: 'Test' }).click()

    await itemRow(page, 'Task 1').hover()
    await itemRow(page, 'Task 1')
      .getByRole('button', { name: 'Delete item' })
      .click()
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Yes, delete it.' })
      .click()

    await expect(itemRow(page, 'Task 1')).toHaveCount(0)
    await expect(itemRow(page, 'Task 2')).toHaveCount(1)
    await expect(itemRow(page, 'Task 3')).toHaveClass(/completed/)
  })

  test('shows a change made in one tab after reloading another tab', async ({
    browser,
  }) => {
    const context = await browser.newContext()
    const page1 = await context.newPage()
    const page2 = await context.newPage()
    const listId = 'shared-list'

    await page1.goto('/')
    await clearAllStorage(page1)
    await setupTestListWithItems(page1, listId, 'Shared', [
      { id: 'item-1', description: 'Shared Task', completed: false },
    ])
    await page1.reload()
    await page1.locator('nav-lists li', { hasText: 'Shared' }).click()

    await page2.goto('/')
    await page2.locator('nav-lists li', { hasText: 'Shared' }).click()
    await expect(itemRow(page2, 'Shared Task')).toHaveCount(1)

    // Complete the item in the first tab
    await itemRow(page1, 'Shared Task')
      .getByRole('button', { name: 'Mark completed' })
      .click()
    await expect(itemRow(page1, 'Shared Task')).toHaveClass(/completed/)

    // The second tab shows the change after it reloads
    await page2.reload()
    await page2.locator('nav-lists li', { hasText: 'Shared' }).click()
    await expect(itemRow(page2, 'Shared Task')).toHaveClass(/completed/)

    await context.close()
  })

  test('shows an item edited in localStorage after reload', async ({
    page,
  }) => {
    await page.goto('/')
    const listId = 'test-list'

    // Setup initial state
    await page.evaluate((id) => {
      const listData = {
        id: id,
        name: 'Test',
        items: ['item-1'],
      }
      localStorage.setItem(`list-${id}`, JSON.stringify(listData))

      const itemData = {
        id: 'item-1',
        description: 'Original Task',
        completed: false,
      }
      localStorage.setItem('item-item-1', JSON.stringify(itemData))
    }, listId)

    await page.reload()

    // Verify initial state
    await expect(page.locator('list-view')).toContainText('Original Task')

    // Modify in storage
    await page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem('item-item-1'))
      data.description = 'Modified Task'
      localStorage.setItem('item-item-1', JSON.stringify(data))
    })

    // Reload to see changes
    await page.reload()
    await page.waitForTimeout(500)

    // Should show modified task
    await expect(page.locator('list-view')).toContainText('Modified Task')
  })
})
