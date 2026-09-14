# Role Permission Fix Verification

## What Changed

- Frontend `src/utils/permissions.js`: platform Order Details now requires at least one selected Order Processing child page. Selecting only a parent, Manual Order, or Platform Manual Order does not grant this route.
- Frontend `src/features/systemConfigaration/roleManagement/RoleManagementPage.jsx`: owners retain Add, Edit and Delete; permitted subaccounts retain the role list and read-only Details.
- Backend `modules/roles/roles.service.js`: Return Order is now retained when saving roles. The permission template includes the missing inventory pages and To Pickup Order as well.
- Backend `utils/permissions.js` and `utils/orderPermissions.js`: shared endpoints can accept the appropriate alternative page permissions.
- Backend route files in `manualOrders`, `packFailedOrders`, `pushSuccessfulOrders`, `withdrawOrders` and `orderActivityLogs`: permission checks run before their business handlers.
- Backend migration `005_create_pages_table.sql`: fresh-install seed includes Return Order.
- Backend migration `053_add_return_order_page_permission.sql`: adds Return Order to an existing database, without changing saved role permissions. This migration was applied to the backend's configured database; all 28 role permission records were verified unchanged.

There are no new API endpoints or request-body fields. The public webhook logging endpoint and its existing optional-key behavior are unchanged. Page checks use the authenticated backend user, not a permission value supplied in the request.

## Before Checking

1. Restart the backend process serving this frontend, or confirm that nodemon has reloaded the changed files. A separately deployed backend also needs these files deployed.
2. Open `http://127.0.0.1:5173/warehouse_management` and sign in as the owner.
3. Use a test role and a test subaccount. Give that subaccount the store and warehouse assignments needed for the workflow; page access does not replace those assignments.
4. After changing its role, sign out and sign back in as the subaccount so the frontend receives the latest permissions.
5. If Return Order was previously checked but lost on save, select it again and save. The discarded selection cannot be reconstructed from existing data.

## Screen Checks

| Test Role Selection | Expected Result |
| --- | --- |
| Owner | Existing pages remain accessible; Role Management has Add, Edit and Delete. |
| Outbound Order only | Outbound appears and its existing subroutes open; Inbound remains inaccessible. |
| New Order only | New Order and its Details open without All Order permission; shared SKU search remains permitted. |
| Processed Order only | Processed Order, Details, Withdraw and its existing packing workflow remain permitted. |
| Shipped, Completed, All Order or Canceled Order individually | The selected page and shared Details open; packing and SKU-change APIs remain denied without New Order or Processed Order. |
| Return Order only | Save, reopen Edit, and confirm Return Order remains checked; Details shows the same selection read-only; the subaccount can open Return Order. |
| Manual Order only | Manual-order list, details and existing creation/shipping endpoints remain permitted. Direct platform Order Details is denied. |
| Platform Manual Order only | Its existing page remains accessible; it does not grant Manual Order access. |
| Role Management only | The role list and Details are available. Add, Edit and Delete controls and modals are unavailable. |
| No order pages selected | Direct navigation to `/warehouse_management/orders/detail/ANY_ID` redirects to Dashboard. Order APIs below return 403. |

Dashboard and Contact retain their existing access for signed-in users. Use designated test orders for packing, shipping or other actions that change order data.

## Direct API Checks

Use your existing API base URL, normally ending in `/api/v1`, and the subaccount's Bearer token. Keep normal request parameters unchanged. An authenticated user missing the required page gets HTTP 403; an allowed request continues through the existing validation and business rules.

| Endpoint After API Base | Required Page Access |
| --- | --- |
| GET `/order-management/pack-failed-orders`, `/push-successful-orders`, `/withdraw-orders` | At least one Order Processing child page. These lists are shared by order-list filtering. |
| POST or DELETE `/order-management/pack-failed-orders` | New Order or Processed Order. |
| POST `/order-management/push-successful-orders` | New Order or Processed Order. |
| POST `/order-management/withdraw-orders` | Processed Order. |
| DELETE `/order-management/withdraw-orders` | New Order or Processed Order, including cleanup after successful packing. |
| GET `/order-management/manual-orders/sku-search` | New Order, Processed Order, Manual Order or Platform Manual Order. |
| Other `/order-management/manual-orders` endpoints | Manual Order. Existing owner-only wallet actions still require owner. |
| POST `/order-management/platform-orders/change-sku-mapping` or `/pack-stock` | New Order or Processed Order. |
| GET `/order-management/platform-orders/:platform/:orderId/activity-logs` | At least one Order Processing child page. |
| POST `/order-management/platform-orders/activity-logs` or `/activity-logs/bulk` | At least one Order Processing child page. |
| POST `/platform-order-activity/activity-logs` | Existing webhook rules, unchanged. |

Repeat a GET with an Outbound-only token and an allowed order-page token to compare denied and permitted access without changing order data. Do not use an owner token to verify subaccount restrictions.

## Automated Verification

Run in the frontend folder:

```powershell
node --test tests/permissions.test.js tests/role-management-ui.test.cjs
npm.cmd run build
```

Run in the backend folder:

```powershell
node --test tests/role-permissions.test.cjs
node scripts/applyReturnOrderPermission.cjs --check
```

The migration check executes within a transaction, verifies existing role permissions and repeat-run behavior, then rolls back. To apply it to another configured deployment, run the same script with `--apply`. Do not rerun migration 005 on an existing database.

The automated route tests exercise real Express routing with mocked business handlers, including the routers' shared mount path and webhook isolation. Role tests use mocked persistence. Screen tests render owner/subaccount fixtures. They do not send platform requests, pack real orders, or replace a live subaccount login check. No connected browser was available for a visual test.

Focused lint still reports the existing `actionRefs.current` access during render and the missing `setOpenActionId` effect dependency in RoleManagementPage. These pre-existing menu implementation issues were not changed by the permission fix. Production builds pass, with existing bundle-size and Browserslist warnings.

These changes protect the identified local ERP routes. Platform order data also uses a separately configured platform API; its authentication, order-status scope and store restrictions were not changed or proven by these tests. The shared Details guard checks access to the page, not ownership of a particular order.
