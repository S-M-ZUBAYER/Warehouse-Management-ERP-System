# Order Management API Notes

Frontend work is wired for Shopee and TikTok only.

## Environment used

```env
VITE_AUTH_BASE_LOGIN_URL=https://grozziieget.zjweiting.com:3091/CustomerService-Chat/api
VITE_AUTH_BASE_URL=https://grozziieget.zjweiting.com:8035/api/v1/
```

The frontend strips `/CustomerService-Chat/api` from `VITE_AUTH_BASE_LOGIN_URL` for platform order APIs, then calls:

- Shopee: `/new-shopee-open-shop/api/dev/order/get-order-list`
- Shopee detail: `/new-shopee-open-shop/api/dev/order/get-order-details`
- Shopee tracking: `/new-shopee-open-shop/api/dev/logistics/get-tracking-number`
- TikTok: `/tiktokshop-partner-country/api/dev/order/list/filter`

## Backend APIs expected from local ERP backend

These are required for warehouse-specific actions that do not exist in the Grozziie platform API code.

### 1. Order action

`POST /api/v1/order-management/orders/:action`

Supported frontend actions:

- `pack`
- `push`
- `withdraw`
- `move-to-shipped`

Request body:

```json
{
  "orders": [
    {
      "id": "shopee:240101ABC",
      "platform": "shopee",
      "orderNo": "240101ABC",
      "warehousePackageNo": "WM-012",
      "rawStatus": "READY_TO_SHIP"
    }
  ]
}
```

Expected response:

```json
{
  "success": true,
  "message": "Action completed"
}
```

### 2. Change order item merchant mapping

`PUT /api/v1/order-management/order-items/:itemId/merchant-mapping`

Request body:

```json
{
  "platform": "shopee",
  "orderNo": "240101ABC",
  "warehousePackageNo": "WM-012",
  "merchantSkuId": 1,
  "merchantSku": "SKU-WM-012",
  "platformItemId": 123456,
  "quantity": 2
}
```

Expected response:

```json
{
  "success": true,
  "message": "Merchant mapping updated"
}
```

### 3. Manual order

The frontend uses the existing Grozziie-style endpoint:

`POST /api/v1/manual_order`

Request body contains buyer, items, and payment.

### 4. Product / Merchant SKU search

The frontend reuses SKU Mapping architecture:

`GET /api/v1/sku-mapping/by-merchant?page=1&limit=50&search=...&skuType=sku_name`

The response should be either an array or `{ data: [] }`.

### 5. Platform stores

The frontend expects this existing endpoint:

`GET /api/v1/platform-stores?page=1&limit=100`

Rows should include these fields when possible:

```json
{
  "id": 1,
  "platform": "shopee",
  "store_name": "Store name",
  "store_shop_id": "123456",
  "store_open_id": "open id for TikTok",
  "store_cipher": "cipher for TikTok",
  "external_store_id": "fallback id",
  "region": "ID"
}
```

## 2026-05-17 update

- New Order row action is now `Pack`; the top selected-orders action also calls the same `pack` action.
- Processed Order footer print button now opens a waybill preview modal for selected rows. The modal supports printing and downloading the waybill preview as an HTML file.
- Shared footer export button is now a dropdown with `Export XLSX` and `Export CSV`.
- Shopee order list date range is clamped to less than 15 days to avoid the platform error: `Start time must be earlier than end time and diff in 15days`.
- TikTok and Shopee date ranges are resolved separately. Both accept Unix seconds, milliseconds, `Date`, or ISO date strings when a future date filter is added.
