import { test, expect } from "@playwright/test";

test.describe("Login and create car", () => {
  test("should display client form", async ({ page }) => {
    await page.goto("/login");
    // try {
    //   // Попробуем с таймаутом
    //   await page.goto("http://localhost:3000/login", { timeout: 30000 });
    //   console.log('Page loaded successfully');
    // } catch (error) {
    //   console.error('Error loading page:', error);
    //   throw error;
    // }
    await expect(page.getByText("Please log in to continue")).toBeVisible();

    // await expect(
    //   page.locator("body > main > div > form > div > h1"),
    // ).toContainText("Please log in to continue");
    await page.fill('input[name="email"]', "user2@ya.ru");
    await page.fill('input[name="password"]', "123456");
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(
      page.getByText("Welcome to No way ERP (нафиг ERP)"),
    ).toBeVisible();

    await page.goto(
      "/erp/legal-entities/c992cbc4-7640-47f2-8ec9-bc996ea4657b/edit",
    );

    await expect(page.getByText("Юридическое лицо")).toBeVisible();

    await page.click('button[id="add_car"]');

    await expect(page).toHaveURL(
      "/erp/cars/create?customer_id=c992cbc4-7640-47f2-8ec9-bc996ea4657b",
    );
  });
});
