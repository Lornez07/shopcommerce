import { test, expect } from '@playwright/test';

/**
 * Public storefront paths. These need no session, so they run everywhere.
 * The authenticated purchase flow is covered manually — automating it needs
 * session minting via the Supabase admin API (see tasks.md, Task 14).
 */
test.describe('Storefront', () => {
  test('home renders the catalogue entry points', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', { level: 1, name: /kitchen things worth keeping/i })
    ).toBeVisible();

    await expect(page.getByRole('link', { name: /ceramics/i }).first()).toBeVisible();
  });

  test('a category lists products that open their detail page', async ({ page }) => {
    await page.goto('/category/ceramics');

    await expect(page.getByRole('heading', { level: 1, name: /ceramics/i })).toBeVisible();

    const firstProduct = page.locator('a[href^="/product/"]').first();
    await expect(firstProduct).toBeVisible();
    await firstProduct.click();

    await expect(page).toHaveURL(/\/product\/[0-9a-f-]{36}$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('an unknown category returns 404 rather than a stack trace', async ({ page }) => {
    const response = await page.goto('/category/does-not-exist');
    expect(response?.status()).toBe(404);
  });

  test('an unknown product id returns 404', async ({ page }) => {
    const response = await page.goto('/product/00000000-0000-4000-8000-000000000000');
    expect(response?.status()).toBe(404);
  });

  test('cart and checkout send signed-out visitors to sign in', async ({ page }) => {
    await page.goto('/cart');
    await expect(page).toHaveURL(/\/login\?redirect=/);

    await page.goto('/checkout');
    await expect(page).toHaveURL(/\/login\?redirect=/);
  });
});
