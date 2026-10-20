import { test, expect } from '@playwright/test';

test.describe('Magic link sign-in', () => {
  test('collects an email and explains what happens next', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { level: 1, name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByRole('button', { name: /send sign-in link/i })).toBeVisible();
  });

  test('rejects an address with no domain before contacting Supabase', async ({ page }) => {
    await page.goto('/login');

    // "a@b" satisfies the browser's native email check, so the submit reaches
    // the server action — which is what we want to exercise.
    await page.getByLabel('Email').fill('a@b');
    await page.getByRole('button', { name: /send sign-in link/i }).click();

    // Next mounts its own role="alert" route announcer on every page, so an
    // unqualified getByRole('alert') is ambiguous. Scope to the field error.
    await expect(page.getByRole('alert').filter({ hasText: /valid email/i })).toBeVisible();
  });
});
