# Manual Order EasyParcel Final Patch Notes

Scope: Manual Order only.

## Implemented
- Manual Order page list is independent from Order Processing.
- Manual Order status filter uses the EasyParcel-aligned status list and defaults to Created.
- All option shows every manual order for the company.
- Added cancel action for cancellable EasyParcel statuses before collection.
- Cancelled orders can be pushed again.
- PWB again opens the stored waybill PDF.
- Upload Payment Certificate now accepts image/PDF files and sends the certificate with the manual order payload.
- Details modal is wider and shows payment certificate link, shipment number, AWB, raw provider status and stored details.

## Validation
- Manual-order JSX files were bundled individually using esbuild.
- Full Vite build still fails because an unrelated inventory file imports a missing hook: src/features/inventoryManagement/manualInbound/hooks/useManualInboundList.
