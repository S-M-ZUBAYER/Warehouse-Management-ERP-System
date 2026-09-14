const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { build } = require('esbuild');

test('role screen keeps Details available and shows edit controls and modals only to owners', async () => {
  const built = await build({
    entryPoints: [path.resolve(__dirname, '../src/features/systemConfigaration/roleManagement/RoleManagementPage.jsx')],
    bundle: true,
    write: false,
    platform: 'node',
    format: 'cjs',
    jsx: 'automatic',
    external: ['react', 'react/jsx-runtime'],
    plugins: [{
      name: 'role-screen-fixtures',
      setup(builder) {
        builder.onResolve({ filter: /useRoleManagement$/ }, (args) => ({ path: args.path, namespace: 'role-hook-fixture' }));
        builder.onLoad({ filter: /.*/, namespace: 'role-hook-fixture' }, () => ({
          contents: `
            export const getRolePermissionMap = () => ({});
            export const useRoleManagement = () => ({
              search: '', roles: [{ id: 1, name: 'Manager' }], pages: [],
              openActionId: 1, showModal: true, editModal: { open: true }, deleteModal: { open: true },
            });
          `,
        }));
        builder.onResolve({ filter: /\/(Topbar|PortalActionMenu|RecordDetailModal|ListPageSizePagination|NestedPageRow|AddRoleModal|EditRoleModal|DeleteRoleModal)$/ }, (args) => ({ path: args.path, namespace: 'role-child-fixture' }));
        builder.onLoad({ filter: /.*/, namespace: 'role-child-fixture' }, (args) => {
          const name = args.path.split('/').pop();
          if (name === 'NestedPageRow') return { contents: 'export const NestedPageRow = () => null;' };
          if (name === 'PortalActionMenu') return { contents: 'export default function Menu({children}) { return children; }' };
          if (['AddRoleModal', 'EditRoleModal', 'DeleteRoleModal'].includes(name)) {
            return { contents: `export default function Modal({open}) { return open ? '${name}' : null; }` };
          }
          return { contents: 'export default function Component() { return null; }' };
        });
      },
    }],
  });
  const componentModule = { exports: {} };
  vm.runInThisContext(`(function(require, module, exports) {${built.outputFiles[0].text}\n})`)(require, componentModule, componentModule.exports);
  const Page = componentModule.exports.default;
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  try {
    for (const role of ['owner', 'Manager']) {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: { getItem: () => JSON.stringify({ role, permissions: {} }) },
      });
      const markup = renderToStaticMarkup(React.createElement(Page));
      assert.match(markup, />Details</);
      for (const label of ['Add Role', 'Edit', 'Delete']) {
        assert.equal(markup.includes(`>${label}</`), role === 'owner', `${role}: ${label}`);
      }
      for (const modal of ['AddRoleModal', 'EditRoleModal', 'DeleteRoleModal']) {
        assert.equal(markup.includes(modal), role === 'owner', `${role}: ${modal}`);
      }
    }
  } finally {
    if (previousStorage) Object.defineProperty(globalThis, 'localStorage', previousStorage);
    else delete globalThis.localStorage;
  }
});
