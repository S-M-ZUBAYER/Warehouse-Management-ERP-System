export const permissionPathMap = {
  dashboard: ['dashboard'],
  contact: ['contact'],
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
  return_order: ['order_management', 'order_processing', 'return_order'],
  canceled_order: ['order_management', 'order_processing', 'canceled_order'],
  manual_order: ['order_management', 'manual_order'],
  platform_manual_order: ['order_management', 'platform_manual_order'],
  warehouse_management: ['warehouse_management'],
  store_authorization: ['system_configuration', 'store_authorization'],
  account_management: ['system_configuration', 'account_management'],
  sub_account: ['system_configuration', 'account_management', 'sub_account'],
  role_management: ['system_configuration', 'account_management', 'role_management'],
};

export const routePermissionMap = [
  ['/warehouse_management/contact', 'contact'],
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
  ['/warehouse_management/inventory/outbound/draft', 'outbound_order'],
  ['/warehouse_management/inventory/outbound/onTheWay', 'outbound_order'],
  ['/warehouse_management/inventory/outbound/completed', 'outbound_order'],
  ['/warehouse_management/inventory/outbound_order', 'outbound_order'],
  ['/warehouse_management/inventory/log', 'inventory_log'],
  ['/warehouse_management/orders/processing/new_order', 'new_order'],
  ['/warehouse_management/orders/processing/processed', 'processed_order'],
  ['/warehouse_management/orders/processing/pick_up', 'to_pickup_order'],
  ['/warehouse_management/orders/processing/shipped', 'shipped_order'],
  ['/warehouse_management/orders/processing/completed', 'completed_order'],
  ['/warehouse_management/orders/processing/all_order', 'all_order'],
  ['/warehouse_management/orders/processing/return_order', 'return_order'],
  ['/warehouse_management/orders/processing/canceled', 'canceled_order'],
  ['/warehouse_management/orders/aftership_manual_order', 'manual_order'],
  ['/warehouse_management/orders/platform_manual_order', 'platform_manual_order'],
  ['/warehouse_management/orders/manual_order', 'manual_order'],
  ['/warehouse_management/warehouse', 'warehouse_management'],
  ['/warehouse_management/config/store_authorization', 'store_authorization'],
  ['/warehouse_management/config/account_management/sub_account', 'sub_account'],
  ['/warehouse_management/config/account_management/role_management', 'role_management'],
];

export const getStoredWarehouseUser = () => {
  try { return JSON.parse(localStorage.getItem('warehouseUser') || '{}') || {}; }
  catch { return {}; }
};

export const isOwnerUser = (user) => String(user?.role || '').toLowerCase() === 'owner' || user?.isOwner === true || user?.is_owner === true;

const getWarehouseIdFromValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'object') return String(value).trim();
  return String(
    value.warehouseId ??
    value.warehouse_id ??
    value.id ??
    value.value ??
    value.warehouse?.id ??
    value.warehouse?.warehouseId ??
    value.warehouse?.warehouse_id ??
    ''
  ).trim();
};

const collectWarehouseIds = (values, target) => {
  if (!Array.isArray(values)) return;
  values.forEach((item) => {
    if (item && typeof item === 'object' && item.canView === false) return;
    const id = getWarehouseIdFromValue(item);
    if (id) target.add(id);
  });
};

export const getUserWarehousePermissionIds = (user = getStoredWarehouseUser()) => {
  if (isOwnerUser(user)) return null;

  const ids = new Set();
  let hasWarehouseScope = false;
  const sources = [
    user?.warehousePermissions,
    user?.warehouse_permissions,
    user?.warehouseIds,
    user?.warehouse_ids,
    user?.warehouses,
    user?.allowedWarehouses,
    user?.allowed_warehouses,
    user?.assignedWarehouses,
    user?.assigned_warehouses,
  ];

  sources.forEach((source) => {
    if (Array.isArray(source)) {
      hasWarehouseScope = true;
      collectWarehouseIds(source, ids);
    }
  });

  const singleWarehouseId = getWarehouseIdFromValue(user?.warehouseId ?? user?.warehouse_id);
  if (singleWarehouseId) {
    hasWarehouseScope = true;
    ids.add(singleWarehouseId);
  }

  return hasWarehouseScope ? ids : null;
};

export const hasWarehouseRestriction = (user = getStoredWarehouseUser()) =>
  getUserWarehousePermissionIds(user) !== null;

export const canAccessWarehouse = (warehouseId, user = getStoredWarehouseUser()) => {
  const ids = getUserWarehousePermissionIds(user);
  if (ids === null) return true;
  const id = getWarehouseIdFromValue(warehouseId);
  return Boolean(id && ids.has(id));
};

export const getDefaultAllowedWarehouseId = (user = getStoredWarehouseUser()) => {
  const ids = getUserWarehousePermissionIds(user);
  return ids === null ? '' : [...ids][0] || '';
};

export const resolveAllowedWarehouseId = (warehouseId, user = getStoredWarehouseUser()) => {
  if (canAccessWarehouse(warehouseId, user)) return String(warehouseId || '');
  return getDefaultAllowedWarehouseId(user);
};

export const filterWarehousesByPermission = (warehouses = [], user = getStoredWarehouseUser()) => {
  const ids = getUserWarehousePermissionIds(user);
  if (ids === null) return warehouses;
  return (warehouses || []).filter((warehouse) => ids.has(getWarehouseIdFromValue(warehouse)));
};

export const getRoutePermissionKey = (pathname) => {
  if (pathname === '/warehouse_management' || pathname === '/warehouse_management/') return 'dashboard';
  const found = routePermissionMap.find(([prefix]) => pathname.startsWith(prefix));
  return found?.[1] || null;
};

const getNodeValue = (permissions = {}, key) => permissions?.[key];

export const hasPermissionKey = (user, key) => {
  if (!key || key === 'dashboard' || key === 'contact') return true;
  if (isOwnerUser(user)) return true;
  const permissions = user?.permissions || {};
  if (key === 'platform_manual_order') {
    const orderManagement = permissions?.order_management;
    const orderSub = orderManagement?.sub;
    const hasPlatformKey = orderSub && Object.prototype.hasOwnProperty.call(orderSub, 'platform_manual_order');
    if (orderManagement?.access === true && orderSub && !hasPlatformKey) {
      const legacyManualOrder = orderSub.manual_order;
      if (legacyManualOrder === true || legacyManualOrder?.access === true) return true;
    }
  }
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
