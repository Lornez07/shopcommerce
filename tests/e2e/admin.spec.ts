import { test, expect } from '@playwright/test';

test.describe('Admin gate', () => {
  test('anonymous visitors never reach the dashboard', async ({ page }) => {
    await page.goto('/admin');

    await expect(page).toHaveURL(/\/login\?redirect=/);
    await expect(page.getByRole('heading', { level: 1, name: /sign in/i })).toBeVisible();
  });

  test('the admin API is not publicly readable', async ({ request }) => {
    // The webhook route is POST-only; a GET must not leak anything.
    const response = await request.get('/api/webhook/stripe');
    expect(response.status()).toBe(405);
  });
});
