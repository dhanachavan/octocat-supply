import { test, expect } from '@playwright/test';

/**
 * Star review feature E2E tests
 *
 * Covers:
 * - Star rating buttons are present on product cards
 * - Clicking a star sets the rating and displays it in blue
 * - Rating is reflected in the product detail modal
 * - Rating can be changed after being set
 */

test.describe('Star review feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products');
    await expect(page.locator('h1:has-text("Products")')).toBeVisible();
    // Wait for product grid to load
    await expect(page.locator('[data-testid^="star-"]').first()).toBeVisible();
  });

  test('Star rating buttons are visible on every product card', async ({ page }) => {
    // Each product card should have 5 star buttons
    const firstProductStars = page.locator('[data-testid^="star-1-"]');
    await expect(firstProductStars).toHaveCount(5);

    // Stars should have correct aria labels
    await expect(page.locator('[data-testid="star-1-1"]')).toHaveAttribute('aria-label', 'Rate 1 star');
    await expect(page.locator('[data-testid="star-1-5"]')).toHaveAttribute('aria-label', 'Rate 5 stars');
  });

  test('Clicking a star sets the rating and shows the score', async ({ page }) => {
    // Initially no rating score label shown for product 1
    await expect(page.locator('[data-testid^="star-1-"]').first().locator('..')).not.toContainText('/5');

    // Click the 4th star for product 1
    await page.locator('[data-testid="star-1-4"]').click();

    // The score label should now show 4/5
    const ratingGroup = page.locator('[aria-label*="Rate this product"]').first();
    await expect(ratingGroup).toContainText('4/5');
  });

  test('Rating is synced into the product detail modal', async ({ page }) => {
    // Rate the first product with 3 stars
    await page.locator('[data-testid="star-1-3"]').click();

    // Open the product modal by clicking its image
    const productImage = page.locator('img[alt="SmartFeeder One"]');
    await productImage.click();

    // Modal should be visible
    const modal = page.locator('[class*="fixed inset-0"]');
    await expect(modal).toBeVisible();

    // Modal should show the same 3/5 rating
    await expect(modal).toContainText('3/5');
  });

  test('Rating can be updated by clicking a different star', async ({ page }) => {
    // Set initial rating of 2 stars
    await page.locator('[data-testid="star-1-2"]').click();
    const ratingGroup = page.locator('[aria-label*="Rate this product"]').first();
    await expect(ratingGroup).toContainText('2/5');

    // Update to 5 stars
    await page.locator('[data-testid="star-1-5"]').click();
    await expect(ratingGroup).toContainText('5/5');
  });

  test('Star rating buttons are keyboard accessible', async ({ page }) => {
    const firstStar = page.locator('[data-testid="star-1-1"]');
    await firstStar.focus();
    await expect(firstStar).toBeFocused();

    // Press Enter to rate 1 star
    await firstStar.press('Enter');
    const ratingGroup = page.locator('[aria-label*="Rate this product"]').first();
    await expect(ratingGroup).toContainText('1/5');
  });
});
