import { expect, test } from '@playwright/test';

const billingStatus = {
  plan: 'starter',
  status: 'inactive',
  billingConfigured: false,
};

test.beforeEach(async ({ page }) => {
  await page.route('**/api/billing/status', (route) => route.fulfill({ json: billingStatus }));
});

test('presents the dashboard and calendar as read-only fictional content', async ({ page }) => {
  await page.goto('/dashboard');

  await expect(page.getByRole('heading', { name: "Northstar's sample workspace" })).toBeVisible();
  await expect(page.getByText('No social accounts are connected and no posts will publish.')).toBeVisible();

  await page.getByRole('link', { name: 'Calendar' }).first().click();
  await expect(page.getByRole('heading', { name: 'Sample content calendar' })).toBeVisible();
  await expect(page.getByText('Read-only sample calendar · April 2025')).toBeVisible();
});

test('presents billing as one sandbox payment with an explicit setup state', async ({ page }) => {
  await page.goto('/billing');

  await expect(page.getByRole('heading', { name: 'One-time payment demo' })).toBeVisible();
  await expect(page.getByText('No recurring charge, billing period, or saved payment consent.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Airwallex setup required' })).toBeDisabled();
});
