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

  test('Star rating buttons are visible on each product card', async ({ page }) => {
    // Given I am viewing the product catalog
    await page.goto('/products');
    await expect(page.locator('h1:has-text("Products")')).toBeVisible();

    // Wait for product grid to load
    await expect(page.locator('div[class*="grid"]').first()).toBeVisible();

    // Then each product card displays a "Rate this product:" label
    const rateLabels = page.locator('text="Rate this product:"');
    await expect(rateLabels.first()).toBeVisible();

    // And each card shows five blue star buttons (check first card)
    const firstCardStars = page.locator('[data-testid^="star-rating-"]').first();
    await expect(firstCardStars).toBeVisible();
    const starButtons = firstCardStars.locator('button');
    await expect(starButtons).toHaveCount(5);
  });

  test('Rate a product with stars', async ({ page }) => {
    // Given I am viewing the product catalog
    await page.goto('/products');
    await expect(page.locator('h1:has-text("Products")')).toBeVisible();

    // Wait for product grid to load
    await expect(page.locator('div[class*="grid"]').first()).toBeVisible();

    // Find the first product's star rating widget
    const firstStarWidget = page.locator('[data-testid^="star-rating-"]').first();
    await expect(firstStarWidget).toBeVisible();

    // Get the product id from the first widget
    const widgetId = await firstStarWidget.getAttribute('data-testid');
    const productId = widgetId?.replace('star-rating-', '');

    // When I click the 4th star on the first product card
    const fourthStar = page.locator(`[data-testid="star-${productId}-4"]`);
    await fourthStar.click();

    // And the feedback text shows "You rated: 4 / 5 ★"
    const feedback = page.locator(`[data-testid="rating-feedback-${productId}"]`);
    await expect(feedback).toBeVisible();
    await expect(feedback).toContainText('You rated: 4 / 5 ★');
  });

  test('Change an existing star rating', async ({ page }) => {
    // Given I am viewing the product catalog
    await page.goto('/products');
    await expect(page.locator('h1:has-text("Products")')).toBeVisible();

    // Wait for product grid to load
    await expect(page.locator('div[class*="grid"]').first()).toBeVisible();

    // Find the first product's star rating widget
    const firstStarWidget = page.locator('[data-testid^="star-rating-"]').first();
    const widgetId = await firstStarWidget.getAttribute('data-testid');
    const productId = widgetId?.replace('star-rating-', '');

    // Given I have rated a product 4 stars
    await page.locator(`[data-testid="star-${productId}-4"]`).click();
    await expect(page.locator(`[data-testid="rating-feedback-${productId}"]`)).toContainText('4 / 5');

    // When I click the 2nd star on that product
    await page.locator(`[data-testid="star-${productId}-2"]`).click();

    // Then the feedback text shows "You rated: 2 / 5 ★"
    const feedback = page.locator(`[data-testid="rating-feedback-${productId}"]`);
    await expect(feedback).toContainText('You rated: 2 / 5 ★');
  });
});
