import { test, expect } from '@playwright/test';

/**
 * Star rating E2E tests
 *
 * Covers:
 * - Star rating buttons are visible on each product card
 * - Clicking a star updates the displayed rating
 * - Rating persists after page navigation (localStorage)
 * - Star rating is present in the product detail modal
 */

test.describe('Star rating on product catalog', () => {
  test.beforeEach(async ({ page }) => {
    // Clear product ratings stored in localStorage before each test
    await page.goto('/products');
    await page.evaluate(() => localStorage.removeItem('product-ratings'));
    await page.reload();
  });

  test('Star rating buttons are visible on the product cards', async ({ page }) => {
    // Wait for at least one product card to load
    await expect(page.locator('h3').first()).toBeVisible();

    // Each product card should have a star rating group
    const ratingGroups = page.locator('[role="group"][aria-label*="Rate"]');
    await expect(ratingGroups.first()).toBeVisible();
  });

  test('Clicking a star sets the rating and shows confirmation text', async ({ page }) => {
    // Wait for products to load
    await expect(page.locator('h3').first()).toBeVisible();

    // Click the 4th star of the first product
    const firstProductRating = page.locator('[role="group"][aria-label*="Rate"]').first();
    const fourthStar = firstProductRating.locator('button[aria-label*="4 star"]');
    await fourthStar.click();

    // The rating confirmation text should update
    const ratingText = page.locator('p[aria-live="polite"]').first();
    await expect(ratingText).toContainText('Your rating: 4 / 5');
  });

  test('Rating persists after navigating away and back', async ({ page }) => {
    // Wait for products to load
    await expect(page.locator('h3').first()).toBeVisible();

    // Click the 3rd star of the first product
    const firstProductRating = page.locator('[role="group"][aria-label*="Rate"]').first();
    const thirdStar = firstProductRating.locator('button[aria-label*="3 star"]');
    await thirdStar.click();

    // Verify rating text is shown
    await expect(page.locator('p[aria-live="polite"]').first()).toContainText('Your rating: 3 / 5');

    // Navigate away and come back
    await page.goto('/');
    await page.goto('/products');

    // Rating should still be visible after reload
    await expect(page.locator('h3').first()).toBeVisible();
    const ratingTextAfterNav = page.locator('p[aria-live="polite"]').first();
    await expect(ratingTextAfterNav).toContainText('Your rating: 3 / 5');
  });

  test('Star rating is present in the product detail modal', async ({ page }) => {
    // Wait for product cards to load
    await expect(page.locator('h3').first()).toBeVisible();

    // Click the first product image to open modal
    await page.locator('div[class*="relative h-56"]').first().click();

    // Modal should be open
    const modal = page.locator('div[class*="fixed inset-0"]').last();
    await expect(modal).toBeVisible();

    // The modal should contain a "Your Rating" heading and star buttons
    await expect(modal.locator('h3:has-text("Your Rating")')).toBeVisible();
    await expect(modal.locator('[role="group"][aria-label*="Rate"]')).toBeVisible();
  });

  test('Rating stars are keyboard accessible', async ({ page }) => {
    // Wait for products to load
    await expect(page.locator('h3').first()).toBeVisible();

    // Tab to the first star button
    const firstStar = page
      .locator('[role="group"][aria-label*="Rate"]')
      .first()
      .locator('button')
      .first();

    await firstStar.focus();
    await expect(firstStar).toBeFocused();

    // Press Enter to select it
    await firstStar.press('Enter');
    const ratingText = page.locator('p[aria-live="polite"]').first();
    await expect(ratingText).toContainText('Your rating: 1 / 5');
  });
});
