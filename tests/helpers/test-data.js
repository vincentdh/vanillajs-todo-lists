/**
 * Test data fixtures for Playwright tests
 */

export const setupTestListWithItems = async (page, listId, listName, items) => {
  await page.evaluate(
    ({ id, name, itemIds }) => {
      const listData = {
        id,
        name,
        items: itemIds.map((item) => item.id),
      }
      localStorage.setItem(`list-${id}`, JSON.stringify(listData))

      itemIds.forEach((item) => {
        localStorage.setItem(`item-${item.id}`, JSON.stringify(item))
      })
    },
    { id: listId, name: listName, itemIds: items },
  )
}

export const getStoredList = async (page, listId) => {
  return await page.evaluate((id) => {
    const data = localStorage.getItem(`list-${id}`)
    return data ? JSON.parse(data) : null
  }, listId)
}

export const getStoredItem = async (page, itemId) => {
  return await page.evaluate((id) => {
    const data = localStorage.getItem(`item-${id}`)
    return data ? JSON.parse(data) : null
  }, itemId)
}

export const clearAllStorage = async (page) => {
  await page.evaluate(() => {
    localStorage.clear()
  })
}
