# Role Workflow Permission Fix

## Scope

This update fixes the reviewed page-to-API permission mismatches. It does not grant all API access to sub-accounts. The backend checks the requested operation against the user's current role, then applies the existing company, store and warehouse assignments.

The API URLs, request parameters and successful response shapes remain the same. No new API endpoint, database migration or environment setting is required. The frontend adjustment selects a permitted warehouse in the order SKU Change dialog when the original mapped warehouse is unavailable to that user.

## API Access Changes

All paths below start with `/api/v1`. Normal authentication is still required. Existing page access remains valid; the additional callers below can use only the listed operations.

| API | Additional permitted callers |
| --- | --- |
| `GET /warehouses` | Product List, Merchant SKU, Combine SKU, SKU Mapping, Inventory List/Log, Manual Inbound, Inbound, Outbound, order processing pages, Manual Order, Platform Manual Order, Sub Account |
| `GET /stock/merchant/:id` | Order processing pages, for order stock checks |
| `GET /stock/ledger` | Inventory Log |
| `GET /sku-mapping/by-merchant` | Order processing pages, for SKU resolution and SKU Change |
| `GET /sku-mapping/dropdowns` | All signed-in users, for shared application dropdowns |
| `GET /platform-stores` | All signed-in users, for assigned-store lists in dashboard/sidebar/chat |
| `GET /order-management/platform-stores` | All signed-in users, including Dashboard |
| `GET /inbound/manual`, `POST /inbound/manual` | Manual Inbound |
| `GET /inbound/dropdowns`, `GET /inbound/picker` | Manual Inbound |
| `GET /inbound/picker` | Return Order, for its SKU picker |
| Merchant SKU list, dropdown, detail, create, update and delete APIs | Product List, which already uses these operations |
| `DELETE /merchant-skus/bulk` | Inventory List, which already provides this action |
| `GET /inventory`, `PUT /inventory/stock-alert` | Product List |
| `GET /roles` | Sub Account, for its role list |

Inbound and Outbound receive actions now rely on the page permission and warehouse work access instead of requiring a fixed role name such as `manager`. A custom role name does not block these actions.

Read access to warehouse, store or mapping data does not grant permission to change warehouse settings, authorize stores or change global SKU mappings.

## Assignment Checks

- Merchant stock totals include only the user's assigned warehouses within the authenticated company.
- Mapping SKU lists and their tab counts use warehouse and store assignments.
- Warehouse lists use current sub-account assignments instead of a potentially stale cached list.
- Inbound and Outbound changes require warehouse work access. Manual Inbound also checks this before creating stock.
- Stock alerts validate work access to every selected warehouse before updating anything.
- A global SKU deletion requires work access to all warehouses affected by that SKU. Existing stock and order-history deletion restrictions remain in place.
- Existing owner-only and owner/admin-only restrictions remain in place for account/role administration, store administration, subscription checkout and manual stock correction.

## Frontend Test Steps

1. Start or restart the backend using its normal development command. Refresh the frontend and sign out, then sign in again to clear the old session's UI state.
2. As owner, create a temporary role with only **Order Management > Order Processing > New Order** enabled. Assign it to the test sub-account.
3. Give that account one store and one warehouse, with view and work/edit access. Do not add Store Authorization, Warehouse Management, SKU Mapping or Inventory List merely to support New Order.
4. Sign into the sub-account in a separate browser profile or private window. Check that only the permitted navigation is available, plus the pages already available to everyone.
5. Open New Order. The store selector should contain the assigned store. Inspect the browser Network panel: `GET /stock/merchant/:id`, `/warehouses` and `/sku-mapping/by-merchant` should no longer return a page-permission 403.
6. Check To Pack with an order that is actually awaiting packing, has sufficient assigned-warehouse stock, and has not already moved into another section. A successful API response does not guarantee this section has qualifying orders.
7. Open SKU Change and Add More SKU. The warehouse list and SKU results should load within the account's assignments. Use a disposable test order for changes that affect stock or marketplace state.
8. Test Withdraw separately with **Processed Order** permission, because that is the page that owns the Withdraw workflow.
9. Repeat with isolated roles for Manual Inbound, Inbound, Outbound, Inventory Log, Product List, Combine SKU and SKU Mapping. Check their dropdowns and normal operations without granting unrelated pages.
10. Remove a store or warehouse assignment and reload. That resource should disappear. Direct API requests for unassigned resources must be denied or return no accessible records.
11. Make a warehouse view-only. Reading should still work, while protected stock-changing operations must fail.
12. Check negative cases: a New Order-only user must not create warehouses, change global SKU mappings, manage roles or accounts, or perform owner-only checkout actions. An owner should retain the existing workflow.

## Verification

Automated tests cover mounted API permission rules with individual page permissions, denied actions, company and assignment scopes, custom-role inbound/outbound actions, stale warehouse cache handling, and mapping count scoping. They mock database/business operations; they do not pack or ship live orders.

Backend commands:

```powershell
node --test tests/role-permissions.test.cjs tests/workflow-permissions.test.cjs
```

Frontend commands:

```powershell
node --test tests/permissions.test.js tests/role-management-ui.test.cjs
npm run build
```

Original copies for this update are retained in `.role-permission-fix/original` and `.role-permission-fix/original-frontend`. These are review/backup files, not a database backup. Do not use them to overwrite later work without comparing changes first.
