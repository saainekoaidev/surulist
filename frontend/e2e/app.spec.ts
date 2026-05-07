import { test, expect, type Page } from "@playwright/test";

// All tests share one DB — run serially to avoid interference
test.describe.configure({ mode: "serial" });

const API = "http://localhost:3001/api";

// Helper: delete all categories (cascades to todos) via API
async function cleanupAll(page: Page) {
  const res = await page.request.get(`${API}/categories`);
  const categories = await res.json();
  for (const cat of categories) {
    await page.request.delete(`${API}/categories/${cat.id}`);
  }
}

// Helper: clear localStorage to reset show-all preference
async function clearLocalStorage(page: Page) {
  await page.evaluate(() => localStorage.clear());
}

test.describe("Category management (US-002, US-003)", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupAll(page);
    await page.goto("/");
    await clearLocalStorage(page);
    await page.reload();
  });

  test.afterEach(async ({ page }) => {
    await cleanupAll(page);
  });

  test("shows placeholder when no categories exist", async ({ page }) => {
    const select = page.locator(".toolbar select");
    await expect(select).toBeDisabled();
    await expect(select).toContainText("目的を追加してください");
  });

  test("can add a category via dialog", async ({ page }) => {
    await page.getByRole("button", { name: "編集" }).click();
    await expect(page.locator(".dialog")).toBeVisible();

    await page.getByRole("button", { name: "+ 追加" }).click();
    await page.getByPlaceholder("目的名を入力").fill("仕事");
    await page.getByPlaceholder("目的名を入力").press("Enter");

    await page.getByRole("button", { name: "閉じる" }).click();
    await expect(page.locator(".dialog")).not.toBeVisible();

    const select = page.locator(".toolbar select");
    await expect(select).toBeEnabled();
    await expect(select.locator("option", { hasText: "仕事" })).toHaveCount(1);
  });

  test("can rename a category", async ({ page }) => {
    await page.request.post(`${API}/categories`, { data: { name: "旧名" } });
    await page.reload();

    await page.getByRole("button", { name: "編集" }).click();
    // Scope to dialog list to avoid matching the <option> in the select
    await page.locator(".dialog-list").getByText("旧名").click();

    const input = page.locator(".dialog-list input");
    await input.fill("新名");
    await input.press("Enter");

    await page.getByRole("button", { name: "閉じる" }).click();

    const select = page.locator(".toolbar select");
    await expect(select.locator("option", { hasText: "新名" })).toHaveCount(1);
  });

  test("can delete a category without todos", async ({ page }) => {
    await page.request.post(`${API}/categories`, { data: { name: "削除対象" } });
    await page.reload();

    await page.getByRole("button", { name: "編集" }).click();

    page.on("dialog", (dialog) => dialog.accept());
    await page.locator(".dialog-list").getByTitle("削除").click();

    await page.getByRole("button", { name: "閉じる" }).click();

    const select = page.locator(".toolbar select");
    await expect(select).toBeDisabled();
  });

  test("shows todo count in delete confirmation when category has todos", async ({ page }) => {
    const catRes = await page.request.post(`${API}/categories`, { data: { name: "テスト目的" } });
    const cat = await catRes.json();
    await page.request.post(`${API}/todos`, { data: { text: "タスク1", categoryId: cat.id } });
    await page.reload();

    await page.getByRole("button", { name: "編集" }).click();

    let confirmMessage = "";
    page.on("dialog", async (dialog) => {
      confirmMessage = dialog.message();
      await dialog.dismiss();
    });
    await page.locator(".dialog-list").getByTitle("削除").click();

    expect(confirmMessage).toContain("1件の Todo も削除されます");
  });
});

test.describe("Todo CRUD (US-004, US-005, US-006)", () => {
  let categoryId: number;

  test.beforeEach(async ({ page }) => {
    await cleanupAll(page);
    const res = await page.request.post(`${API}/categories`, { data: { name: "E2Eテスト" } });
    const cat = await res.json();
    categoryId = cat.id;
    await page.goto("/");
    await clearLocalStorage(page);
    await page.reload();
    // Wait for category to load and be selected
    await expect(page.locator(".toolbar select")).toHaveValue(String(categoryId));
  });

  test.afterEach(async ({ page }) => {
    await cleanupAll(page);
  });

  test("can add a new todo via button", async ({ page }) => {
    await page.getByRole("button", { name: "+ 新規追加" }).click();

    const input = page.locator(".todo-input");
    await expect(input).toBeVisible();
    await input.fill("新しいタスク");
    await page.getByRole("button", { name: "登録" }).click();

    await expect(page.getByText("新しいタスク")).toBeVisible();
    await expect(page.getByText("1件")).toBeVisible();
  });

  test("can add a new todo via Enter key", async ({ page }) => {
    await page.getByRole("button", { name: "+ 新規追加" }).click();

    const input = page.locator(".todo-input");
    await input.fill("Enterで登録");
    await input.press("Enter");

    await expect(page.getByText("Enterで登録")).toBeVisible();
  });

  test("cancel adding with Escape", async ({ page }) => {
    await page.getByRole("button", { name: "+ 新規追加" }).click();
    await expect(page.locator(".todo-input")).toBeVisible();

    await page.locator(".todo-input").press("Escape");
    await expect(page.locator(".todo-input")).not.toBeVisible();
  });

  test("can edit a todo text", async ({ page }) => {
    await page.request.post(`${API}/todos`, { data: { text: "編集前", categoryId } });
    await page.reload();

    await page.getByText("編集前").click();
    const input = page.locator(".editing-input");
    await expect(input).toBeVisible();
    await input.fill("編集後");
    await page.getByRole("button", { name: "更新" }).click();

    await expect(page.getByText("編集後")).toBeVisible();
    await expect(page.getByText("編集前")).not.toBeVisible();
  });

  test("can change todo status", async ({ page }) => {
    await page.request.post(`${API}/todos`, { data: { text: "ステータス変更", categoryId } });
    await page.reload();

    const statusSelect = page.locator(".status-select");
    await statusSelect.selectOption("Done");

    await page.reload();
    await expect(page.locator(".status-select")).toHaveValue("Done");
  });

  test("can delete a todo with confirmation", async ({ page }) => {
    await page.request.post(`${API}/todos`, { data: { text: "削除対象", categoryId } });
    await page.reload();

    await page.getByText("削除対象").click();

    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "削除" }).click();

    await expect(page.getByText("削除対象")).not.toBeVisible();
    await expect(page.getByText("0件")).toBeVisible();
  });

  test("cancel delete keeps todo", async ({ page }) => {
    await page.request.post(`${API}/todos`, { data: { text: "残すタスク", categoryId } });
    await page.reload();

    // Register dialog handler BEFORE triggering the action
    page.on("dialog", (dialog) => dialog.dismiss());

    await page.getByText("残すタスク").click();
    await page.getByRole("button", { name: "削除" }).click();

    // After dismiss, row stays in edit mode — input still has the value
    await expect(page.locator(".editing-input")).toHaveValue("残すタスク");
    // Escape to exit edit mode, then verify text is still shown
    await page.locator(".editing-input").press("Escape");
    await expect(page.getByText("残すタスク")).toBeVisible();
  });

  test("shows row numbers and date columns", async ({ page }) => {
    await page.request.post(`${API}/todos`, { data: { text: "タスクA", categoryId } });
    await page.request.post(`${API}/todos`, { data: { text: "タスクB", categoryId } });
    await page.reload();

    await expect(page.getByText("2件")).toBeVisible();

    const rows = page.locator("tbody tr");
    const firstRowNum = rows.nth(0).locator(".col-num");
    const secondRowNum = rows.nth(1).locator(".col-num");
    await expect(firstRowNum).toHaveText("1");
    await expect(secondRowNum).toHaveText("2");
  });

  test("all four statuses are available in dropdown", async ({ page }) => {
    await page.request.post(`${API}/todos`, { data: { text: "ステータステスト", categoryId } });
    await page.reload();

    const statusSelect = page.locator(".status-select");
    const options = statusSelect.locator("option");
    await expect(options).toHaveCount(4);
    await expect(options.nth(0)).toHaveText("Not Started");
    await expect(options.nth(1)).toHaveText("In Progress");
    await expect(options.nth(2)).toHaveText("Pending");
    await expect(options.nth(3)).toHaveText("Done");
  });
});

test.describe("Deadline columns (US-008, US-013)", () => {
  let categoryId: number;

  test.beforeEach(async ({ page }) => {
    await cleanupAll(page);
    const res = await page.request.post(`${API}/categories`, { data: { name: "期限テスト" } });
    const cat = await res.json();
    categoryId = cat.id;
    await page.goto("/");
    await clearLocalStorage(page);
    await page.reload();
    await expect(page.locator(".toolbar select")).toHaveValue(String(categoryId));
  });

  test.afterEach(async ({ page }) => {
    await cleanupAll(page);
  });

  test("Date and Time column headers are visible", async ({ page }) => {
    await expect(page.getByRole("columnheader", { name: "Date", exact: true })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Time", exact: true })).toBeVisible();
  });

  test("can set a deadline date on a todo", async ({ page }) => {
    await page.request.post(`${API}/todos`, { data: { text: "期限設定", categoryId } });
    await page.reload();

    const dateInput = page.locator('.col-date-input input');
    await dateInput.fill("2026/07/01");
    // Wait for the PUT triggered by blur to complete
    const putResp = page.waitForResponse(r => r.url().includes("/api/todos/") && r.request().method() === "PUT");
    await dateInput.blur();
    await putResp;

    // Reload and verify the date persisted (displayed as yyyy/mm/dd)
    await page.reload();
    await expect(page.locator('.col-date-input input')).toHaveValue("2026/07/01");
  });

  test("can set date and time together", async ({ page }) => {
    await page.request.post(`${API}/todos`, { data: { text: "日時設定", categoryId } });
    await page.reload();

    const dateInput = page.locator('.col-date-input input');
    const timeInput = page.locator('.col-time-input input');

    // Set date and wait for PUT to complete
    await dateInput.fill("2026/07/01");
    const datePut = page.waitForResponse(r => r.url().includes("/api/todos/") && r.request().method() === "PUT");
    await dateInput.blur();
    await datePut;

    // Set time and wait for PUT to complete
    await timeInput.fill("14:30");
    const timePut = page.waitForResponse(r => r.url().includes("/api/todos/") && r.request().method() === "PUT");
    await timeInput.blur();
    await timePut;

    // Reload and verify both persisted
    await page.reload();
    await expect(page.locator('.col-date-input input')).toHaveValue("2026/07/01");
    await expect(page.locator('.col-time-input input')).toHaveValue("14:30");
  });

  test("can clear a deadline by clearing date", async ({ page }) => {
    await page.request.post(`${API}/todos`, {
      data: { text: "期限クリア", categoryId, deadline: "2026-07-01T10:00:00Z" },
    });
    await page.reload();

    const dateInput = page.locator('.col-date-input input');
    await expect(dateInput).not.toHaveValue("");

    // Clear the date input and wait for PUT
    await dateInput.fill("");
    const putResp = page.waitForResponse(r => r.url().includes("/api/todos/") && r.request().method() === "PUT");
    await dateInput.blur();
    await putResp;

    await page.reload();
    await expect(page.locator('.col-date-input input')).toHaveValue("");
  });
});

test.describe("Overdue highlighting (US-011, US-012)", () => {
  let categoryId: number;

  test.beforeEach(async ({ page }) => {
    await cleanupAll(page);
    const res = await page.request.post(`${API}/categories`, { data: { name: "超過テスト" } });
    const cat = await res.json();
    categoryId = cat.id;
    await page.goto("/");
    await clearLocalStorage(page);
    await page.reload();
    await expect(page.locator(".toolbar select")).toHaveValue(String(categoryId));
  });

  test.afterEach(async ({ page }) => {
    await cleanupAll(page);
  });

  test("overdue todo shows !! in dedicated column and row number is preserved", async ({ page }) => {
    await page.request.post(`${API}/todos`, {
      data: { text: "超過タスク", categoryId, deadline: "2020-01-01T00:00:00Z" },
    });
    await page.reload();

    const row = page.locator("tbody tr").first();
    await expect(row).toHaveClass(/row-overdue/);
    // !! mark is in the dedicated overdue column
    await expect(row.locator(".col-overdue .overdue-mark")).toHaveText("!!");
    // Row number is still shown (not replaced)
    await expect(row.locator(".col-num")).toHaveText("1");
  });

  test("Done todo does not show overdue styling even with past deadline", async ({ page }) => {
    await page.request.post(`${API}/todos`, {
      data: { text: "完了タスク", categoryId, deadline: "2020-01-01T00:00:00Z" },
    });
    await page.reload();

    const statusSelect = page.locator(".status-select");
    await statusSelect.selectOption("Done");
    await page.reload();

    const row = page.locator("tbody tr").first();
    await expect(row).not.toHaveClass(/row-overdue/);
    await expect(row.locator(".overdue-mark")).toHaveCount(0);
  });

  test("todo without deadline does not show overdue styling", async ({ page }) => {
    await page.request.post(`${API}/todos`, {
      data: { text: "期限なしタスク", categoryId },
    });
    await page.reload();

    const row = page.locator("tbody tr").first();
    await expect(row).not.toHaveClass(/row-overdue/);
    await expect(row.locator(".overdue-mark")).toHaveCount(0);
  });
});

test.describe("Refresh button (US-014)", () => {
  let categoryId: number;

  test.beforeEach(async ({ page }) => {
    await cleanupAll(page);
    const res = await page.request.post(`${API}/categories`, { data: { name: "リフレッシュテスト" } });
    const cat = await res.json();
    categoryId = cat.id;
    await page.goto("/");
    await clearLocalStorage(page);
    await page.reload();
    await expect(page.locator(".toolbar select")).toHaveValue(String(categoryId));
  });

  test.afterEach(async ({ page }) => {
    await cleanupAll(page);
  });

  test("refresh button is visible and re-fetches todos", async ({ page }) => {
    await page.request.post(`${API}/todos`, { data: { text: "リフレッシュ対象", categoryId } });

    // Before refresh, the todo is not visible (added via API after page load)
    await expect(page.getByText("リフレッシュ対象")).not.toBeVisible();

    // Click refresh button to re-fetch
    const refreshBtn = page.locator(".btn-refresh");
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.click();

    // After refresh, the todo should appear
    await expect(page.getByText("リフレッシュ対象")).toBeVisible();
  });
});

test.describe("Show all mode (US-007)", () => {
  let cat1Id: number;
  let cat2Id: number;

  test.beforeEach(async ({ page }) => {
    await cleanupAll(page);
    const cat1Res = await page.request.post(`${API}/categories`, { data: { name: "仕事" } });
    const cat1 = await cat1Res.json();
    cat1Id = cat1.id;
    const cat2Res = await page.request.post(`${API}/categories`, { data: { name: "私用" } });
    const cat2 = await cat2Res.json();
    cat2Id = cat2.id;
    await page.request.post(`${API}/todos`, { data: { text: "仕事タスク", categoryId: cat1Id } });
    await page.request.post(`${API}/todos`, { data: { text: "私用タスク", categoryId: cat2Id } });
    await page.goto("/");
    await clearLocalStorage(page);
    await page.reload();
  });

  test.afterEach(async ({ page }) => {
    await cleanupAll(page);
    await clearLocalStorage(page);
  });

  test("(全て) option is hidden by default", async ({ page }) => {
    const select = page.locator(".toolbar select");
    await expect(select.locator("option", { hasText: "(全て)" })).toHaveCount(0);
  });

  test("enabling show-all adds (全て) to dropdown", async ({ page }) => {
    await page.getByRole("button", { name: "編集" }).click();
    await page.getByLabel("全件表示を許可する").check();
    await page.getByRole("button", { name: "閉じる" }).click();

    const select = page.locator(".toolbar select");
    await expect(select.locator("option", { hasText: "(全て)" })).toHaveCount(1);
  });

  test("selecting (全て) shows grouped todos and disables add button", async ({ page }) => {
    await page.getByRole("button", { name: "編集" }).click();
    await page.getByLabel("全件表示を許可する").check();
    await page.getByRole("button", { name: "閉じる" }).click();

    // Wait for option to appear after dialog closes
    const select = page.locator(".toolbar select");
    await expect(select.locator("option[value='all']")).toHaveCount(1);
    await select.selectOption("all");

    // Wait for todos to load
    await expect(page.getByText("仕事タスク")).toBeVisible({ timeout: 10000 });

    await expect(page.locator(".group-header")).toHaveCount(2);
    await expect(page.getByText("私用タスク")).toBeVisible();

    const headers = page.locator(".group-header");
    await expect(headers.nth(0)).toHaveText("仕事");
    await expect(headers.nth(1)).toHaveText("私用");

    await expect(page.getByText("2件")).toBeVisible();
    await expect(page.getByRole("button", { name: "+ 新規追加" })).toBeDisabled();
  });

  test("disabling show-all removes (全て) and reverts to first category", async ({ page }) => {
    // Enable and select all
    await page.getByRole("button", { name: "編集" }).click();
    await page.getByLabel("全件表示を許可する").check();
    await page.getByRole("button", { name: "閉じる" }).click();
    const select = page.locator(".toolbar select");
    await expect(select.locator("option[value='all']")).toHaveCount(1);
    await select.selectOption("all");
    await expect(page.getByText("仕事タスク")).toBeVisible({ timeout: 10000 });

    // Disable
    await page.getByRole("button", { name: "編集" }).click();
    await page.getByLabel("全件表示を許可する").uncheck();
    await page.getByRole("button", { name: "閉じる" }).click();

    // (全て) gone, showing first category's todos only
    await expect(select.locator("option", { hasText: "(全て)" })).toHaveCount(0);
    await expect(page.getByText("仕事タスク")).toBeVisible();
    await expect(page.getByText("私用タスク")).not.toBeVisible();
  });

  test("editing a todo in all-mode works", async ({ page }) => {
    await page.getByRole("button", { name: "編集" }).click();
    await page.getByLabel("全件表示を許可する").check();
    await page.getByRole("button", { name: "閉じる" }).click();
    const select = page.locator(".toolbar select");
    await expect(select.locator("option[value='all']")).toHaveCount(1);
    await select.selectOption("all");

    // Wait for grouped view
    await expect(page.getByText("仕事タスク")).toBeVisible({ timeout: 10000 });

    await page.getByText("仕事タスク").click();
    const input = page.locator(".editing-input");
    await input.fill("仕事タスク改");
    await input.press("Enter");

    await expect(page.getByText("仕事タスク改")).toBeVisible();
  });
});
