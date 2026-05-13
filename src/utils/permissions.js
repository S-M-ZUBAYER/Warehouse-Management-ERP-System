export const permissionPathMap = {
  dashboard: ['dashboard'],
  product_list: ['product_management', 'product_list'],
  combine_sku: ['product_management', 'combine_sku'],
  merchant_sku: ['inventory_management', 'merchant_sku'],
  sku_mapping: ['inventory_management', 'sku_mapping'],
  sku_mapping_by_product: ['inventory_management', 'sku_mapping', 'sku_mapping_by_product'],
  sku_mapping_by_merchant: ['inventory_management', 'sku_mapping', 'sku_mapping_by_merchant'],
  inventory_list: ['inventory_management', 'inventory_list'],
  manual_inbound: ['inventory_management', 'manual_inbound'],
  inbound: ['inventory_management', 'inbound'],
  inbound_draft: ['inventory_management', 'inbound', 'inbound_draft'],
  inbound_on_the_way: ['inventory_management', 'inbound', 'inbound_on_the_way'],
  inbound_complete: ['inventory_management', 'inbound', 'inbound_complete'],
  outbound_order: ['inventory_management', 'outbound_order'],
  inventory_log: ['inventory_management', 'inventory_log'],
  order_management: ['order_management'],
  order_processing: ['order_management', 'order_processing'],
  new_order: ['order_management', 'order_processing', 'new_order'],
  processed_order: ['order_management', 'order_processing', 'processed_order'],
  to_pickup_order: ['order_management', 'order_processing', 'to_pickup_order'],
  shipped_order: ['order_management', 'order_processing', 'shipped_order'],
  completed_order: ['order_management', 'order_processing', 'completed_order'],
  all_order: ['order_management', 'order_processing', 'all_order'],
  canceled_order: ['order_management', 'order_processing', 'canceled_order'],
  manual_order: ['order_management', 'manual_order'],
  warehouse_management: ['warehouse_management'],
  store_authorization: ['system_configuration', 'store_authorization'],
  account_management: ['system_configuration', 'account_management'],
  sub_account: ['system_configuration', 'account_management', 'sub_account'],
  role_management: ['system_configuration', 'account_management', 'role_management'],
};

export const routePermissionMap = [
  ['/warehouse_management/products/list', 'product_list'],
  ['/warehouse_management/products/combine_sku', 'combine_sku'],
  ['/warehouse_management/inventory/merchant_SKU', 'merchant_sku'],
  ['/warehouse_management/inventory/SKU_mapping/byProduct', 'sku_mapping_by_product'],
  ['/warehouse_management/inventory/SKU_mapping/byMerchant', 'sku_mapping_by_merchant'],
  ['/warehouse_management/inventory/list', 'inventory_list'],
  ['/warehouse_management/inventory/manual_inbound', 'manual_inbound'],
  ['/warehouse_management/inventory/inbound/draft', 'inbound_draft'],
  ['/warehouse_management/inventory/inbound/onTheWay', 'inbound_on_the_way'],
  ['/warehouse_management/inventory/inbound/completed', 'inbound_complete'],
  ['/warehouse_management/inventory/outbound_order', 'outbound_order'],
  ['/warehouse_management/inventory/log', 'inventory_log'],
  ['/warehouse_management/orders/processing/new_order', 'new_order'],
  ['/warehouse_management/orders/processing/processed', 'processed_order'],
  ['/warehouse_management/orders/processing/pick_up', 'to_pickup_order'],
  ['/warehouse_management/orders/processing/shipped', 'shipped_order'],
  ['/warehouse_management/orders/processing/completed', 'completed_order'],
  ['/warehouse_management/orders/processing/all_order', 'all_order'],
  ['/warehouse_management/orders/processing/canceled', 'canceled_order'],
  ['/warehouse_management/orders/manual_order', 'manual_order'],
  ['/warehouse_management/warehouse', 'warehouse_management'],
  ['/warehouse_management/config/store_authorization', 'store_authorization'],
  ['/warehouse_management/config/account_management/sub_account', 'sub_account'],
  ['/warehouse_management/config/account_management/role_management', 'role_management'],
];

export const getStoredWarehouseUser = () => {
  try { return JSON.parse(localStorage.getItem('warehouseUser') || '{}') || {}; }
  catch (_) { return {}; }
};

export const isOwnerUser = (user) => String(user?.role || '').toLowerCase() === 'owner' || user?.isOwner === true || user?.is_owner === true;

export const getRoutePermissionKey = (pathname) => {
  if (pathname === '/warehouse_management' || pathname === '/warehouse_management/') return 'dashboard';
  const found = routePermissionMap.find(([prefix]) => pathname.startsWith(prefix));
  return found?.[1] || null;
};

const getNodeValue = (permissions = {}, key) => permissions?.[key];

export const hasPermissionKey = (user, key) => {
  if (!key || key === 'dashboard') return true;
  if (isOwnerUser(user)) return true;
  const permissions = user?.permissions || {};
  const path = permissionPathMap[key] || [key];
  let node = getNodeValue(permissions, path[0]);
  if (node === true) return path.length === 1;
  if (!node) return false;
  if (typeof node === 'object' && node.access !== true) return false;
  if (path.length === 1) return typeof node === 'object' ? node.access === true : node === true;

  for (let i = 1; i < path.length; i += 1) {
    node = node?.sub?.[path[i]];
    if (node === true) return i === path.length - 1;
    if (!node) return false;
    if (typeof node === 'object') {
      if (node.access !== true) return false;
      if (i === path.length - 1) return true;
    }
  }
  return true;
};

export const canAccessRoute = (user, pathname) => hasPermissionKey(user, getRoutePermissionKey(pathname));

export const filterNavByPermission = (items, user) => {
  if (isOwnerUser(user)) return items;
  return (items || [])
    .map((item) => {
      const children = item.children ? filterNavByPermission(item.children, user) : undefined;
      const selfAllowed = item.permissionKey ? hasPermissionKey(user, item.permissionKey) : Boolean(children?.length);
      if (!selfAllowed && !children?.length) return null;
      return { ...item, ...(children ? { children } : {}) };
    })
    .filter(Boolean);
};
