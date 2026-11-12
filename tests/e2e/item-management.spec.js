import { test, expect } from '@playwright/test'

import {
  setupTestListWithItems,
  getStoredList,
  getStoredItem,
  clearAllStorage,
} from '../helpers/test-data.js'

const LIST_ID = '123e4567-e89b-12d3-a456-426614174000'

/** Input used to add a task, rendered inside <list-view>'s shadow root. */
const taskInput = (page) =>
  page.getByRole('textbox', { name: 'New task input field' })

/** Row for a task, identified by its description. */
const itemRow = (page, description) =>
  page.locator('list-view [item-id]', { hasText: description })

/** Delete buttons only render (display: flex) while their row is hovered. */
const deleteButton = (page, description) =>
  itemRow(page, description)
    .hover()
    .then(() =>
      itemRow(page, description).getByRole('button', { name: 'Delete item' }),
    )

const addItem = async (page, description) => {
  await taskInput(page).fill(description)
  await page.keyboard.press('Enter')
  await expect(itemRow(page, description)).toBeVisible()
}

test.describe('Item Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearAllStorage(page)
    await setupTestListWithItems(page, LIST_ID, 'Test List', [])
    await page.reload()
    await page.locator('nav-lists li', { hasText: 'Test List' }).click()
    await expect(taskInput(page)).toBeVisible()
  })

  test('adds a new item to a list', async ({ page }) => {
    await addItem(page, 'New Task')

    const list = await getStoredList(page, LIST_ID)
    expect(list.items).toHaveLength(1)
    const item = await getStoredItem(page, list.items[0])
    expect(item).toMatchObject({ description: 'New Task', completed: false })
  })

  test('marks an item as completed and back', async ({ page }) => {
    await addItem(page, 'Task to Complete')
    const row = itemRow(page, 'Task to Complete')
    const list = await getStoredList(page, LIST_ID)
    const itemId = list.items[0]

    await row.getByRole('button', { name: 'Mark completed' }).click()
    await expect(row).toHaveClass(/completed/)
    expect((await getStoredItem(page, itemId)).completed).toBe(true)

    await row.getByRole('button', { name: 'Mark uncompleted' }).click()
    await expect(row).not.toHaveClass(/completed/)
    expect((await getStoredItem(page, itemId)).completed).toBe(false)
  })

  test('deletes an item from the list', async ({ page }) => {
    await addItem(page, 'Task to Delete')
    await addItem(page, 'Task to Keep')
    const list = await getStoredList(page, LIST_ID)
    const deletedId = list.items[0]

    await (await deleteButton(page, 'Task to Delete')).click()
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Yes, delete it.' })
      .click()

    await expect(itemRow(page, 'Task to Delete')).toHaveCount(0)
    await expect(itemRow(page, 'Task to Keep')).toHaveCount(1)
    expect((await getStoredList(page, LIST_ID)).items).not.toContain(deletedId)
    expect(await getStoredItem(page, deletedId)).toBeNull()
  })

  test('keeps the item when deletion is cancelled', async ({ page }) => {
    await addItem(page, 'Task to Keep Anyway')

    await (await deleteButton(page, 'Task to Keep Anyway')).click()
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Cancel' })
      .click()

    await expect(itemRow(page, 'Task to Keep Anyway')).toHaveCount(1)
    expect((await getStoredList(page, LIST_ID)).items).toHaveLength(1)
  })

  test('shows no items for a new list', async ({ page }) => {
    await expect(page.locator('list-view [item-id]')).toHaveCount(0)
    expect((await getStoredList(page, LIST_ID)).items).toEqual([])
  })

  test('persists items after page reload', async ({ page }) => {
    await addItem(page, 'Persistent Task')

    await page.reload()
    await page.locator('nav-lists li', { hasText: 'Test List' }).click()

    await expect(itemRow(page, 'Persistent Task')).toHaveCount(1)
  })
})
