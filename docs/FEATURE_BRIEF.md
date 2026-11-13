# Feature brief — Daymark modules

This is the contract for the feature owners. Read `AGENTS.md` first, then the shared code.

## Cross-cutting data & helpers

- Types: `src/types/domain.ts`
- Store + hooks: `src/lib/store.ts` (`useAppData`, `useAppStore`, `actions`)
- Calculations: `src/lib/calc.ts`
- Dates: `src/lib/dates.ts`
- Money: `src/lib/format.ts`
- Constants: `src/lib/constants.ts`
- Motion: `src/lib/motion.ts`
- Shared UI: `src/components/ui/*`, charts: `src/components/charts/*`

Only use the actions you see in `store.ts`. For missing actions, ask the Lead. Do not write directly to IndexedDB.

### Important action groups

- Settings: `updateSettings`, `setWidgetVisible`, `setDashboardWidgets`, `resetDashboardWidgets`
- Categories: `addCategory`, `updateCategory`, `deleteCategory`
- Transactions: `addTransaction`, `updateTransaction`, `deleteTransaction`
- Budgets: `setBudget`, `setBudgets`, `copyBudgets`
- Goals: `addGoal`, `updateGoal`, `deleteGoal`, `addContribution`, `deleteContribution`
- Shopping: `addShoppingList`, `updateShoppingList`, `deleteShoppingList`, `addShoppingItem`, `updateShoppingItem`, `deleteShoppingItem`, `toggleShoppingItem`, `setAllShoppingItemsPurchased`, `completeShoppingList`, `reopenShoppingList`, `recordShoppingToFinance`, `unlinkShoppingTransaction`
- Inventory: `addInventoryItem`, `updateInventoryItem`, `adjustInventoryQuantity`, `deleteInventoryItem`
- Meals: `addMealPlan`, `updateMealPlan`, `deleteMealPlan`
- Devices/packages: `addDevice`, `updateDevice`, `deleteDevice`, `addDataPackage`, `updateDataPackage`, `updateRemainingQuota`, `deleteDataPackage`
- Subscriptions: `addSubscription`, `updateSubscription`, `toggleSubscription`, `deleteSubscription`, `paySubscription`
- Checklists/tasks: `addChecklist`, `updateChecklist`, `deleteChecklist`, `addTask`, `updateTask`, `toggleTask`, `deleteTask`
- Reviews: `addReview`, `updateReview`, `deleteReview`
- Data: `markBackup`, `replaceData`, `resetData`, `loadDemoData`, `clearAllData`

## Finance — `src/features/finance/**`

Page title: **Keuangan**. Eyebrow: Finance. Tabs: Transaksi / Anggaran / Target.

Must support:

- Month navigation and month-specific totals.
- Metric cards: income, expense, balance, budget remaining (use count-up animation for money).
- Add/edit/delete income and expense transactions. Fields: type, amount, category, date, note. Validate.
- User-created categories with name, type, color, and icon choice; edit and delete (guard against categories in use).
- Category management modal accessible from the page.
- Transactions: search, type filter, category filter, date-from/date-to filters, clear filters; grouped by date; edit/delete with confirmation.
- Spending distribution donut by category + compact trend chart for the selected month.
- Budgets: monthly per-category amounts (setBudgets), total progress, budget vs actual rows, warnings at ≥80% and over budget, copy from previous month action.
- Savings goals CRUD; progress rings/bars; add/delete contributions; detail view with contribution history.
- Empty states and warnings. Use `formatMoney`/`MoneyText` with app currency.
- Do not create a separate transaction when adding a savings contribution (contributions are independent in v1).

## Shopping — `src/features/shopping/**`

Page title: **Daftar belanja**. Eyebrow: Shopping.

Must support:

- Multiple lists with names/notes/optional budget. List index + detail (`/shopping/:listId`). On mobile, opening a list shows the detail with a back link.
- Add/edit/delete list; list card shows progress, item count, estimate, status (active/done).
- Items: name, category (grouped by `SHOPPING_CATEGORIES`), quantity+unit, estimated price, actual price, purchased toggle, note. Add via modal; edit/delete.
- Animated completion state for items; completed section or styling.
- Totals: estimated total, actual purchased total, projection, difference; list budget progress.
- “Tandai semua” and “Selesaikan belanja” / “Buka kembali”.
- “Catat ke Finance” modal: choose expense category and date → `recordShoppingToFinance`. Prevent duplicate; display linked state and allow undo (`unlinkShoppingTransaction`).
- Empty state and actionable guidance. All copy Indonesian.

## Inventory — `src/features/inventory/**`

Page title: **Persediaan**. Eyebrow: Inventory. Tabs: Stok / Meal Planner.

Stock:

- Inventory summary (total, low, out, expiring/expired).
- Search + category filter + status filter.
- Item CRUD: name, category (frozen, ingredients, seasoning, beverage, household), quantity, unit, minStock, purchasedAt, expiresAt, location, note.
- Expiry and low-stock status via `getInventoryStatus`, clear badges, quick +/- quantity, edit/delete.
- Warnings for low stock and approaching expiry; use accents not alarm.

Meal planner:

- Week navigation (Monday start from `settings.weekStartsOn`; use `getWeekRange`).
- 7 days × breakfast/lunch/dinner slots. Show menu title, ingredient count, estimated cost, and note.
- Add/edit/delete meal: date, meal type, title, estimated cost, dynamic ingredient rows (name, qty, unit), note. Prefill from inventory suggestions where practical.
- Right/side summary: weekly estimated cost, aggregated ingredient list, number of planned meals. Responsive layout.
- Empty state prompts to plan the week.

## Planning — `src/features/planning/**`

Page title: **Rencana & tugas**. Eyebrow: Planning.

Must support:

- Checklists CRUD (name, color, icon) with progress ring/bar; selecting a checklist filters tasks. “Semua tugas” default.
- Delete checklist should detach tasks; confirm.
- Task CRUD: title, notes, priority, deadline, status, activity category, checklist, completed toggle. Validate title.
- Filters: status, priority, search, checklist. Group by overdue/today/upcoming/someday/done (use `getTaskBuckets` where possible).
- Animated checkbox completion, line-through/muted completed style, smooth list layout.
- Progress overview for today / this week, overdue count.
- Simple month calendar: prev/next month, day cells with tasks; select a day to see agenda and add a task for that date.
- Empty states.

## Reviews — `src/features/reviews/**`

Page title: **Evaluasi berkala**. Eyebrow: Review.

Must support:

- Create review flow: choose period (daily/weekly/monthly) and anchor date; show computed date range and live metrics using `getReviewSnapshot`.
- Display metrics: total expense, income, prorated budget, budget comparison, savings progress, tasks completed, contributions in period.
- Notes + reflection + optional rating 1–5. Save via `addReview`.
- History list, filter by period, open detail (modal/sheet) with all metrics and notes; edit notes/reflection/rating via `updateReview`; delete with confirmation.
- Empty state with guidance. Use real data; no placeholders.
- Make the hero feel reflective and calm, not another dashboard.

## Internet — `src/features/internet/**`

Page title: **Internet & langganan**. Eyebrow: Internet. Tabs: Paket Data / Langganan.

Data packages:

- Devices CRUD (name, type, note). Device cards/chips show active package summary.
- Data package CRUD: device, provider, package name, price, quota, remaining, purchase date, expiry, note. History list of all purchases.
- Active package cards with quota ring/progress, remaining GB, expiry, status warnings (low quota/expiring/expired); quick update remaining quota.
- Summary: active packages, total remaining GB, low/expiring alerts, last purchase.

Subscriptions:

- Subscription CRUD: name, amount, cycle (weekly/monthly/yearly), next payment date, active, note, category (expense).
- Show next due, monthly equivalent cost, status. `paySubscription` records expense + advances date; confirm then toast.
- Toggle active/pause; delete with confirmation.
- History/upcoming view.

## Shared UX expectations

- Add buttons in the PageHeader.
- Modals use the shared `Modal` (bottom sheet on mobile automatically).
- No dead buttons. Destructive actions always confirm.
- Use `useToast` for results and errors.
- Show help text for ambiguous fields.
- Real empty states, not fake data.
- Do not add a second page-level fixed bottom bar; only the global bottom nav exists.
