import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canAccessRoute, filterNavByPermission, hasPermissionKey, isOwnerUser,
  ORDER_PAGE_PERMISSIONS, permissionPathMap,
} from '../src/utils/permissions.js';

function userWithPermission(key) {
  const user = { role: 'Manager', permissions: {} };
  let node = user.permissions;
  const path = permissionPathMap[key];
  path.forEach((part, index) => {
    if (index === path.length - 1) node[part] = true;
    else {
      node[part] = { access: true, sub: {} };
      node = node[part].sub;
    }
  });
  return user;
}

test('each order-list permission opens its shared detail page without All Order access', () => {
  for (const key of ORDER_PAGE_PERMISSIONS) {
    const user = userWithPermission(key);
    assert.equal(canAccessRoute(user, '/warehouse_management/orders/detail/tiktok-123'), true, key);
    assert.equal(hasPermissionKey(user, 'all_order'), key === 'all_order', key);
  }
});

test('missing order access, parent-only access and manual-only roles cannot open platform order details', () => {
  for (const user of [
    { role: 'Manager', permissions: {} },
    userWithPermission('order_processing'),
    userWithPermission('manual_order'),
    userWithPermission('platform_manual_order'),
    userWithPermission('outbound_order'),
  ]) {
    assert.equal(canAccessRoute(user, '/warehouse_management/orders/detail/shopee-123'), false);
    assert.equal(canAccessRoute(user, '/warehouse_management'), true);
    assert.equal(canAccessRoute(user, '/warehouse_management/contact'), true);
  }
});

test('an unchecked child and disabled parent both deny order details', () => {
  const user = userWithPermission('return_order');
  user.permissions.order_management.sub.order_processing.sub.return_order = false;
  assert.equal(hasPermissionKey(user, 'order_detail'), false);
  user.permissions.order_management.sub.order_processing.sub.return_order = true;
  user.permissions.order_management.access = false;
  assert.equal(hasPermissionKey(user, 'order_detail'), false);
});

test('outbound-only roles retain Outbound and cannot access Inbound', () => {
  const user = userWithPermission('outbound_order');
  for (const suffix of ['draft', 'onTheWay', 'completed']) {
    assert.equal(canAccessRoute(user, `/warehouse_management/inventory/outbound/${suffix}`), true);
    assert.equal(canAccessRoute(user, `/warehouse_management/inventory/inbound/${suffix}`), false);
  }
  const nav = [{ permissionKey: 'inventory_management', children: [
    { permissionKey: 'inbound', children: [{ permissionKey: 'inbound_draft' }] },
    { permissionKey: 'outbound_order' },
  ] }];
  assert.deepEqual(filterNavByPermission(nav, user)[0].children, [{ permissionKey: 'outbound_order' }]);
});

test('role-management permission grants the page but does not make a subaccount an owner', () => {
  const user = userWithPermission('role_management');
  assert.equal(canAccessRoute(user, '/warehouse_management/config/account_management/role_management'), true);
  assert.equal(isOwnerUser(user), false);
  assert.equal(isOwnerUser({ role: 'owner' }), true);
  assert.equal(canAccessRoute({ role: 'owner' }, '/warehouse_management/orders/detail/123'), true);
});

test('legacy Platform Manual Order fallback and explicit denial are preserved', () => {
  const user = userWithPermission('manual_order');
  assert.equal(hasPermissionKey(user, 'platform_manual_order'), true);
  user.permissions.order_management.sub.platform_manual_order = false;
  assert.equal(hasPermissionKey(user, 'platform_manual_order'), false);
});
