import { test, expect } from '@playwright/test'

import {
  setupTestListWithItems,
  getStoredList,
  getStoredItem,
  clearAllStorage,
} from '../helpers/test-data.js'

const LIST_ID = '123e4567-e89b-12d3-a456-426614174000'

const navItem = (page, name) => page.locator('nav-lists li', { hasText: name })

const createListButton = (page) =>
  page.getByRole('button', { name: 'Create New List' })

test.describe('List Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearAllStorage(page)
    await page.reload()
    // A fresh profile with no lists shows the welcome dialog; decline it.
    await page
      .getByRole('button', { name: "It's fine, I'll create a list myself" })
      .click()
  })

  test('creates a new list', async ({ page }) => {
    await createListButton(page).click()

    const dialog = page.getByRole('dialog')
    await dialog.getByRole('textbox').fill('My Test List')
    await dialog.getByRole('button', { name: 'Add' }).click()

    await expect(navItem(page, 'My Test List')).toHaveCount(1)
    await expect(
      page.locator('list-view container-box#container'),
    ).toHaveAttribute('title', 'My Test List')
  })

  test('does not create a list when the prompt is cancelled', async ({
    page,
  }) => {
    await createListButton(page).click()

    const dialog = page.getByRole('dialog')
    await dialog.getByRole('textbox').fill('Cancelled List')
    await dialog.getByRole('button', { name: 'Cancel' }).click()

    await expect(dialog).toHaveCount(0)
    await expect(navItem(page, 'Cancelled List')).toHaveCount(0)
    await expect(page.locator('nav-lists li')).toHaveCount(0)
  })

  test('deletes a list', async ({ page }) => {
    await setupTestListWithItems(page, LIST_ID, 'Test List', [])
    await page.reload()
    await navItem(page, 'Test List').click()

    await page.getByRole('button', { name: 'Delete list' }).click()
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Yes, delete it.' })
      .click()

    await expect(navItem(page, 'Test List')).toHaveCount(0)
    expect(await getStoredList(page, LIST_ID)).toBeNull()
  })

  test('removes the items of a deleted list from localStorage', async ({
    page,
  }) => {
    const items = [
      { id: 'item-clean-1', description: 'Task 1', completed: false },
      { id: 'item-clean-2', description: 'Task 2', completed: true },
    ]
    await setupTestListWithItems(page, LIST_ID, 'Test List', items)
    await page.reload()
    await navItem(page, 'Test List').click()

    await page.getByRole('button', { name: 'Delete list' }).click()
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Yes, delete it.' })
      .click()
    await expect(navItem(page, 'Test List')).toHaveCount(0)

    expect(await getStoredList(page, LIST_ID)).toBeNull()
    for (const item of items) {
      expect(await getStoredItem(page, item.id)).toBeNull()
    }
  })

  test('renames a list', async ({ page }) => {
    await setupTestListWithItems(page, LIST_ID, 'Original Name', [])
    await page.reload()
    await navItem(page, 'Original Name').click()

    await page.getByRole('button', { name: 'Rename List' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('textbox').fill('New Name')
    await page.keyboard.press('Enter')

    await expect(navItem(page, 'New Name')).toHaveCount(1)
    await expect(navItem(page, 'Original Name')).toHaveCount(0)
    expect((await getStoredList(page, LIST_ID)).name).toBe('New Name')
  })

  test('shows the selected list name as the view title', async ({ page }) => {
    await setupTestListWithItems(page, LIST_ID, 'Test List', [])
    await page.reload()
    await navItem(page, 'Test List').click()

    await expect(
      page.locator('list-view container-box#container'),
    ).toHaveAttribute('title', 'Test List')
  })
})
