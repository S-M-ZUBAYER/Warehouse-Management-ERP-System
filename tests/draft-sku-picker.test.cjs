const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { QueryClient, QueryObserver } = require('@tanstack/react-query');
const { build } = require('esbuild');

async function loadDraftHook(kind, fixture, user) {
  const name = kind === 'inbound' ? 'Inbound' : 'Outbound';
  const built = await build({
    entryPoints: [path.resolve(__dirname, `../src/features/inventoryManagement/${name}/hooks/useCreate${name}.js`)],
    bundle: true,
    write: false,
    platform: 'node',
    format: 'cjs',
    external: ['react'],
    plugins: [{
      name: 'draft-picker-fixtures',
      setup(builder) {
        builder.onResolve({ filter: /^(?:@tanstack\/react-query|sonner)$|\/lib\/api$|\/useDebounce$|\.\/use(?:Inbound|Outbound)List$/ },
          (args) => ({ path: args.path, namespace: 'draft-fixture' }));
        builder.onLoad({ filter: /.*/, namespace: 'draft-fixture' }, ({ path: modulePath }) => {
          if (modulePath === '@tanstack/react-query') return { contents: `
            export const useQuery = (options) => fixture.useQuery(options);
            export const useQueryClient = () => ({});
            export const useMutation = () => ({});
          ` };
          if (modulePath.endsWith('/lib/api')) return { contents: 'export default { get: (url) => fixture.get(url) };' };
          if (modulePath.endsWith('/useDebounce')) return { contents: 'export default (value) => value;' };
          if (modulePath === 'sonner') return { contents: 'export const toast = {};' };
          return { contents: 'export const INBOUND_KEYS = {}; export const OUTBOUND_KEYS = {};' };
        });
      },
    }],
  });
  const module = { exports: {} };
  const storage = { getItem: () => JSON.stringify(user) };
  // Exercise the real hooks and query selectors without requests to live orders.
  vm.runInThisContext(`(function(require, module, exports, fixture, localStorage) {${built.outputFiles[0].text}\n})`)(
    require, module, module.exports, fixture, storage,
  );
  return module.exports[`useCreate${name}`];
}

for (const kind of ['inbound', 'outbound']) {
  test(`${kind} draft loads SKU responses for sub-accounts while keeping warehouse restrictions`, async () => {
    const state = { options: new Map(), results: new Map(), response: null, error: null };
    const warehouseRows = [{ id: 10, name: 'Assigned' }, { id: 20, name: 'Other' }];
    const fixture = {
      useQuery(options) {
        const key = JSON.stringify(options.queryKey);
        state.options.set(key, options);
        return state.results.get(key) || {};
      },
      async get(url) {
        if (url.startsWith(`/${kind}/picker?`)) {
          if (state.error) throw state.error;
          return state.response;
        }
        assert.ok(url.startsWith('/warehouses?'), url);
        return { success: true, data: warehouseRows, pagination: { totalPages: 1 } };
      },
    };
    const account = { role: 'custom operator', warehousePermissions: [{ warehouseId: 10, canView: true }] };
    const useDraft = await loadDraftHook(kind, fixture, account);
    let draft;
    function Probe() {
      draft = useDraft({});
      return null;
    }
    const render = () => renderToStaticMarkup(React.createElement(Probe));
    const refresh = async () => {
      state.options.clear();
      state.results.clear();
      render();
      const client = new QueryClient();
      try {
        for (const [key, options] of state.options) {
          const observer = new QueryObserver(client, { ...options, retry: false });
          try { state.results.set(key, await observer.refetch()); }
          finally { observer.destroy(); }
        }
        render();
      } finally { client.clear(); }
    };

    state.response = {
      success: true,
      data: [{ id: 75, sku_name: 'SKU-75', warehouse_id: 20, stock_warehouse_id: 10, qty_available: 8 }],
      pagination: { total: 1, page: 1, totalPages: 1 },
    };
    await refresh();
    assert.equal(draft.isPickerError, false);
    assert.equal(draft.pickerSkus.length, 1);
    assert.equal(draft.pickerSkus[0].sku_name, 'SKU-75');
    assert.equal(draft.pickerSkus[0].qty_available, 8);
    assert.deepEqual(draft.warehouses.map((warehouse) => warehouse.id), [10]);
    const pickerResult = [...state.results.values()].find((result) => result.data?.pagination);
    assert.deepEqual(pickerResult.data.pagination, state.response.pagination);

    account.role = 'owner';
    await refresh();
    assert.equal(draft.isPickerError, false);
    assert.equal(draft.pickerSkus.length, 1);
    assert.deepEqual(draft.warehouses.map((warehouse) => warehouse.id), [10, 20]);

    account.role = 'custom operator';
    account.warehousePermissions = [];
    state.response = { success: true, data: [], pagination: { total: 0, totalPages: 0 } };
    await refresh();
    assert.equal(draft.isPickerError, false);
    assert.equal(draft.pickerSkus.length, 0);
    assert.deepEqual(draft.warehouses, []);

    state.error = Object.assign(new Error('Access denied'), { response: { status: 403 } });
    await refresh();
    assert.equal(draft.isPickerError, true);
    assert.equal(draft.pickerSkus.length, 0);
  });
}
