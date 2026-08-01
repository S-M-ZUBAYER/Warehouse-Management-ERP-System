# EasyParcel Manual Order Frontend Patch Notes

Scope: manual order UI only.

## Frontend changes
- Manual orders no longer appear in Order Processing / Pushing lists.
- Manual Order page now has a dedicated manual-order table.
- Default status filter is `Created`.
- Status filter includes All, Created, Booking Failed, AWB Ready, Pending Pickup, Collected, In Transit, Delivered, Returned, and Cancelled.
- Manual order row shows payment type, COD amount, shipping fee, AWB, courier, and status.
- Push button creates EasyParcel shipment for saved-only/failed orders.
- PWB again opens stored waybill without duplicate booking.
- Waybill modal Print button now falls back to opening a printable PDF tab when iframe printing is blocked.
- Added Manual Order details modal with sender, receiver, payment/COD, shipment, items, and status history.
- Added COD amount field in create manual order form.
