import { test, expect } from '@playwright/test';

/**
 * Product catalog discovery E2E tests
 * Implements: frontend/tests/features/product-navigation.feature
 *
 * Covers:
 * - Navigation from home page to product catalog
 * - Product search with valid matches
 * - Product search with no matches (empty state)
 */

test.describe('Product catalog discovery', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate away from about:blank so localStorage context is available
    await page.goto('/');
  });

  test('Navigate from the home page to the product catalog', async ({ page }) => {
    // Given I am on the home page
    await page.goto('/');
    await expect(page.locator('h1:has-text("Smart Cat Tech")')).toBeVisible();

    // When I select the Products navigation link
    await page.click('nav a:has-text("Products")');

    // Then I land on the product catalog page
    await expect(page).toHaveURL(/\/products/);

    // And I see the catalog header "Products"
    await expect(page.locator('h1:has-text("Products")')).toBeVisible();
  });

  test('Search for a product by name', async ({ page }) => {
    // Given I am viewing the product catalog
    await page.goto('/products');
    await expect(page.locator('h1:has-text("Products")')).toBeVisible();

    // And the catalog includes "SmartFeeder One"
    // Wait for product grid to load
    const productGrid = page.locator('div[class*="grid"]').filter({ hasText: 'SmartFeeder One' });
    await expect(productGrid).toBeVisible();

    // When I search for "SmartFeeder"
    const searchInput = page.locator('input[aria-label="Search products"]');
    await searchInput.fill('SmartFeeder');

    // Then the results list shows "SmartFeeder One"
    const productCard = page.locator('h3:has-text("SmartFeeder One")');
    await expect(productCard).toBeVisible();

    // And the product description is visible in the results
    const description = page.locator('text=/AI-powered feeder.*nap cycles/i').first();
    await expect(description).toBeVisible();
  });

  test('Search for a product with no matches', async ({ page }) => {
    // Given I am viewing the product catalog
    await page.goto('/products');
    await expect(page.locator('h1:has-text("Products")')).toBeVisible();

    // Wait for initial products to load
    await expect(page.locator('div[class*="grid"]').first()).toBeVisible();

    // When I search for "Space Tuna"
    const searchInput = page.locator('input[aria-label="Search products"]');
    await searchInput.fill('Space Tuna');

    // Then I see the empty state message "No products found"
    const emptyState = page.locator('[role="status"]');
    await expect(emptyState).toContainText('No products found');

    // And I am prompted to adjust the search filters
    await expect(emptyState).toContainText(/clearing.*changing.*search filters/i);
  });

  test('View product details and add to cart from the modal', async ({ page }) => {
    // Given I am viewing the product catalog
    await page.goto('/products');
    await expect(page.locator('h1:has-text("Products")')).toBeVisible();

    // When I open the SmartFeeder One product details
    await page.locator('img[alt="SmartFeeder One"]').first().click();

    // Then I see the enriched product details in the modal
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('h2:has-text("SmartFeeder One")')).toBeVisible();
    await expect(modal).toContainText('SKU: CAT-FEED-001');
    await expect(modal).toContainText('Unit: piece');
    await expect(modal).toContainText('25% OFF');
    await expect(modal).toContainText('$129.99');
    await expect(modal).toContainText('$97.49');

    // And the modal quantity is independent from the product card quantity
    const modalQuantity = modal.locator(
      'span[aria-label="Quantity of SmartFeeder One in product details"]',
    );
    await expect(page.locator('#qty-1')).toHaveText('0');
    await page.getByLabel('Increase quantity of SmartFeeder One in product details').click();
    await page.getByLabel('Increase quantity of SmartFeeder One in product details').click();
    await expect(modalQuantity).toHaveText('2');
    await expect(page.locator('#qty-1')).toHaveText('0');

    // When I add the modal selection to the cart
    await modal.getByRole('button', { name: 'Add to Cart' }).click();

    // Then I receive a non-blocking confirmation and the modal quantity resets
    await expect(page.locator('[role="status"]').first()).toContainText('Added 2 items to cart');
    await expect(modalQuantity).toHaveText('0');
    await expect(page.locator('#qty-1')).toHaveText('0');
  });
});
