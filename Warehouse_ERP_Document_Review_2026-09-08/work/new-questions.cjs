module.exports = ({add}) => {
  const q=(menu,question,answer,image,variants)=>add({menu,question,answer,image,variants});
  const product='Product Management > Product List';
  const merchant='Inventory Management > Merchant SKU';
  const mapping='Inventory Management > SKU Mapping > By Product';
  const inventory='Inventory Management > Inventory List';
  const inbound='Inventory Management > Inbound';
  const outbound='Inventory Management > Outbound';
  const manual='Order Management > Manual Order';
  const returns='Order Management > Order Processing > Return Order';
  const staff='System Configuration > Account Management > Sub Account';
  const stores='System Configuration > Store Authorization';
  q('Inventory Management','Which pages are under Inventory Management?',
    'Inventory Management contains Merchant SKU, SKU Mapping > By Product and By Merchant, Inventory List, Manual inbound, Inbound, Outbound, and Inventory Log. Inbound and Outbound each have Draft, On The Way, and Complete. Use Merchant SKU for internal product records, SKU Mapping to link marketplace variations, and Inventory List to check warehouse quantities.');
  q('Help Center','How do I find an answer in Help Center?',
    '1. Open Help Center from the sidebar.\n2. Enter a product, page, action, or error in Search questions or answers.\n3. Open a matching question to read its answer.\n4. Try a shorter search if nothing matches.\nUse the same page name you see in the sidebar, such as Store Authorization or Manual Order.',
    'Help Center with the search field and an expanded answer visible.', ['Where are the help articles?','How do I search frequently asked questions?'].join('; '));
  q('Help Center','Why is Help Center empty or not loading?',
    'Clear Search questions or answers first to remove any filter. Use Refresh to load the questions again, or Retry if an error is shown. If the list still does not load, check your connection and contact support through Contact with the error and the time it occurred.');
  q('Contact','What information should I send when reporting a problem?',
    'Open Contact and describe the menu and page, the button you used, what you expected, and the exact error. Include the relevant order number or SKU, store, warehouse, and approximate time when useful. Attach a screenshot through a supported contact channel with unrelated customer details hidden. Never share your password, verification code, or payment-card details.');
  q('Contact','What should I do if Send Message fails on Contact?',
    'Check that Name, Email, Country, and Message are complete, then read the error beside the form. If the page says the email service is not configured, or sending still fails, use the Support Email link or WhatsApp button under Support Channels. A failed form submission is not confirmation that support received your message.');
  q('Workspace tabs','Does closing a page tab delete its records?',
    'No. Closing a workspace tab removes that page from your open tabs; it does not delete saved orders, products, or inventory. However, unsaved form entries can be lost. Complete and save your work before closing the tab or using Reload.');
  q('Top-right account menu > Profile Info','Where can I check which account I am using?',
    'Click your account name or picture in the top-right corner and open Profile Info. Review the account details before changing company settings or processing orders. This window is for viewing details; it does not provide a Save button for editing your profile.');
  q('Log In > Create account','How do I finish registering a new account?',
    'From Log In, choose Create account and complete Sign Up with your own details. Check the registered email for the verification code. Enter it on Verify Your Email and click Verify & Continue, then return to Log In. If you are joining an existing company as an employee, coordinate setup with its owner so your login is linked to the intended Sub Account.');
  q('Log In > Forgot password?','What should I do if a verification or password-reset code is rejected?',
    'Check the email address and enter the latest code without extra spaces. An older or expired code may no longer work. For a password reset, return to Forgot password? and request a fresh code using Send Code. Check spam if no email arrives, and contact support if the latest code is still rejected. Never send the code to another person.');
  q(product,'What is the difference between Product List and marketplace products?',
    'Product List manages the ERP\'s Merchant SKU records. Marketplace listings and their child variations are shown in Inventory Management > SKU Mapping > By Product after synchronization. Creating or editing a record in Product List does not by itself publish a new listing or update its description on Shopee or TikTok.');
  q(product,'How do I prepare a file for Add Product via Template?',
    '1. Open Product Management > Product List > Add Products > Download Template.\n2. Keep the supplied column headings and fill in the product details, including the required SKU name, product title, and price.\n3. Put the import data on the first worksheet.\n4. Choose Add Products > Add Product via Template, select the warehouse, and upload the completed file.\nCheck the result and resulting records before importing another batch.',
    'Add Products menu and template-upload dialog with the warehouse selector visible.');
  q(product,'What should I do if a template import stops partway through?',
    'An import can save earlier rows before a later row fails. Read the error, then search Product List or Merchant SKU to identify which rows were already created. Correct the failed data and import only the missing rows. Do not assume the entire file was rolled back or upload the whole file again without checking.');
  q(product,'Why does the SKU search ignore my other product search?',
    'When the dedicated SKU search contains a value, Product List uses that SKU search in preference to the general product search. Clear the SKU field to search by the general product text again. Also check the warehouse and other active filters if the expected record is missing.');
  q(product,'Does Select All select products on every page?',
    'In Product List, Select All can select all records matching the current filters across pages, not only the rows currently visible. Check the selected count before Batch Delete, stock-alert changes, Export, or Print. Clear the selection and select individual rows when you only intend to act on a few products.');
  q(merchant,'Why can I not delete a Merchant SKU?',
    'A Merchant SKU can be protected because it has stock, belongs to a Combine SKU, or is referenced by records the ERP must retain. Read the deletion error and review the SKU in Inventory List and Combine SKU. Do not change quantities merely to bypass a deletion block; ask the owner or support how to retire the product while keeping accurate records.');
  q('Product Management > Combine SKU','Can a Combine SKU contain another Combine SKU?',
    'The current Combine SKU form selects Merchant SKUs as components. It does not offer another Combine SKU as a component. Build the bundle from its individual Merchant SKUs and enter the quantity of each component needed for one bundle.');
  q(mapping,'What happens if Auto Mapping finds no matching Merchant SKU?',
    'Auto Mapping matches the marketplace seller SKU to an existing Merchant SKU. It does not create a new Merchant SKU when no match exists. Review the unmapped child variation, create or generate the intended Merchant SKU in the correct warehouse, and then check or complete the mapping.');
  q(mapping,'What does Generate Merchant SKU create, and how do I check the result?',
    'Select the intended marketplace child SKU rows in By Product, choose Generate Merchant SKU, and confirm with Generate SKU. The process can create new Merchant SKUs or reuse matching existing ones and map the child rows. Review the created, reused, mapped, skipped, and failed results, then check the warehouse and mapping before synchronizing stock.');
  q(mapping,'Will Sync Product synchronize every store if I leave the filters empty?',
    'The Sync Products dialog can include all stores and platforms when no specific selection is made. Select the intended platform and store before Confirm Sync when you only want to refresh one store. Afterward, review the imported listings and their child variations in By Product.');
  q('Inventory Management > SKU Mapping > By Merchant','Can Save Mapping move a marketplace SKU away from another Merchant SKU?',
    'Yes. Selecting a marketplace SKU that is already mapped can reassign it to the Merchant SKU you are editing. Before Save Mapping, check the marketplace variation, store, warehouse, and existing mapping. Reassignment changes which internal stock record supplies that marketplace SKU; it is not simply an extra label.');
  q(inventory,'How do I correct Quantity and Lock Quantity?',
    '1. Go to Inventory Management > Inventory List.\n2. Find the correct SKU and warehouse, then open Edit Inventory.\n3. Enter whole, non-negative values for Quantity and Lock Quantity. Lock Quantity cannot exceed Quantity.\n4. Click Save, review Confirm Inventory Update, then click Confirm Save.\nUse this for a verified adjustment. Record incoming deliveries through Manual inbound or Inbound so the receipt is documented.',
    'Edit Inventory and Confirm Inventory Update dialogs with masked test SKU data.');
  q(inventory,'Does editing inventory immediately update my marketplace stock?',
    'An inventory edit updates the ERP quantity and records an adjustment in Inventory Log. Mapped marketplace stock is marked Out of Sync for synchronization; the edit alone is not confirmation that the marketplace now shows the same quantity. Review the intended records and use Sync Stock, then check Sync Status and Last Sync.');
  q(inventory,'What happens if I click Sync Stock without selecting any rows?',
    'With no selected rows, Sync Stock can include all mapped SKUs in the current company scope rather than just one visible record. To limit the operation, select the intended rows first and read the confirmation before Sync. Unmapped records cannot publish stock until their marketplace mapping is set up.');
  q(inventory,'Why does available stock differ from Quantity?',
    'Available stock is the quantity left after locked or reserved stock is taken into account, with a minimum of zero. Check Quantity and Lock Quantity for the same SKU and warehouse. An order or bundle can be unavailable even when physical Quantity is positive if that stock is already reserved.');
  q(inventory,'What should I check when Sync Status says Sync Failed?',
    'Check the correct store authorization, its plan or trial access, the child SKU mapping, and the warehouse quantity. Read any error shown for the failed synchronization. Correct the reported cause, retry only the intended records, and check Sync Status and Last Sync again. Contact support with the SKU, store, and error if the failure continues.');
  q('Inventory Management > Inventory Log','Why can I not find yesterday\'s stock change under Recent?',
    'Recent shows today\'s inventory activity. For an earlier change, choose History and set Start and End to include the date. Check the Warehouse and SellerSKU filters, then Search. The recorded time follows the service\'s date handling, so widen the date range if an entry was near midnight.');
  q(inbound,'How do I receive fewer items than the inbound order expected?',
    'Open Inbound > On The Way and choose Receive for the shipment. Enter the actual received quantity for each SKU, record the discrepancy and any Notes, then review Confirm Receipt. Do not use Fill all expected unless every expected item really arrived. Receiving completes that inbound record, so record any later delivery separately and check Inventory List afterward.',
    'Inbound Receive dialog showing expected quantity, actual quantity, discrepancy, and Notes.');
  q(inbound,'Does Fill all expected mean the goods have already been checked?',
    'No. Fill all expected copies the expected quantities into the receipt fields to save typing. You must still count the delivery and correct any shortages or differences before Confirm Receipt. Stock should reflect what you physically received, not just what was ordered.');
  q(inbound,'Why is stock not available after I click Ship on an inbound?',
    'Ship moves the inbound to On The Way and records the expected incoming quantity. The goods are not added to on-hand stock until you open Receive and confirm the actual receipt. Do not create a second Manual inbound for the same goods if you will receive them through the existing inbound.');
  q(inbound,'What should I do if incoming quantity remains after an unusual or zero receipt?',
    'Compare the inbound receipt details, actual received quantities, Inventory List, and Inventory Log for the same warehouse. Do not receive the same goods again just to clear a pending quantity. Contact support with the inbound number and discrepancy so the remaining incoming balance can be checked without duplicating stock.');
  q(outbound,'Does saving an outbound Draft reserve or reduce stock?',
    'No. Saving a Draft records the request but does not deduct or reserve its stock. Stock is checked and deducted when you confirm Ship. Review availability again before shipping because other orders or adjustments may have used the stock since the draft was created.');
  q(outbound,'Does Receive deduct outbound stock a second time?',
    'No. Outbound stock is deducted when Ship is confirmed. Receive records that the shipped outbound has been received and moves it to Complete; it does not deduct the same source stock again. Check Inventory Log if the balance seems different from what you expected.');
  q(outbound,'Does entering a Receiving Warehouse automatically transfer stock there?',
    'No. Receiving Warehouse and Full Address identify the outbound destination; they do not create a receipt in that destination\'s inventory. After physical delivery, record the destination receipt separately using Inbound or Manual inbound for the correct warehouse. Check both warehouses to avoid missing or duplicating the transfer.');
  q('Order Management > Order Processing','How can I search for several order numbers together?',
    'Use the order-number search on the relevant Order Processing page and enter the numbers separated by commas, spaces, or new lines. Check the platform, store, warehouse, date, and status filters as well. If a number is missing, search All Order and confirm that it belongs to the account and platform you are viewing.');
  q('Order Management > Order Processing > Processed Order','Is Push only a local status change?',
    'No. Push can request the platform shipping document and move the order into the successfully pushed workflow. Check the selected orders and their current stage before confirming it. Use Print AWB Again for an eligible order when you need another copy of its shipping label rather than repeating unrelated processing steps.');
  q('Order Management > Order Processing > Processed Order','Does Withdraw cancel the marketplace order or recall the courier?',
    'No. Withdraw changes the ERP processing workflow and removes related order-specific SKU adjustments. It is not a marketplace cancellation or a courier recall. Check the marketplace order and shipment separately before promising cancellation to a buyer.');
  q(returns,'Does Sync in Return Order put returned goods back into stock?',
    'No. Sync imports or updates return records. It does not confirm that a parcel has arrived or that its contents are resalable. Inspect the goods, select the correct warehouse and return details, and use the appropriate return status after checking them.');
  q(returns,'When does a returned item go back into available inventory?',
    'Changing a return to Resalable Item adds its eligible returned quantity back to the selected warehouse once. Use this only after the goods have been received and checked as suitable for resale. Review the return products and quantities before saving, then check Inventory List and Inventory Log.');
  q(returns,'What happens if I change Resalable Item back to another return status?',
    'The ERP reverses the stock addition made for that resalable return. If the stock is no longer available, the change can be blocked. Do not force a different quantity simply to bypass the error; review the affected SKU and contact support if a correction is needed.');
  q(returns,'Does recording a refund amount in a manual return send money to the buyer?',
    'Do not treat a saved return record or refund amount as proof that money was sent. Use the marketplace or your approved payment process to confirm the actual refund, then keep the ERP return details consistent with that result. Contact support if the return record and the payment result differ.');
  q('Order Management > Platform Manual Order','Does Create Manual Order by Label read the PDF and fill every field for me?',
    'No automatic completion of the full order should be expected. Upload the supported PDF waybill, then enter and check the required order, sender, receiver, delivery, warehouse, and product information yourself. Review stock and quantities before confirming the order.');
  q('Order Management > Platform Manual Order','Does uploading an existing waybill book or pay for another courier?',
    'Uploading a waybill records a label you already have. It does not itself create or pay for a new EasyParcel booking. Confirm the existing courier arrangement outside this upload step and use the order\'s saved waybill when you need to view or print that label.');
  q(manual,'What is Shipping Wallet used for?',
    'Shipping Wallet is the company balance used for courier booking from Manual Order. It is separate from the store subscription payment. The balance is displayed in MYR, while the selected courier charge can also show its original currency. Check both the available balance and the selected courier charge before Submit Order.',
    'Add Manual Order > Payment Information showing Shipping Wallet and Selected courier charge, with the balance masked if needed.');
  q(manual,'How do I add money to Shipping Wallet?',
    '1. Open Manual Order > Add Manual Order.\n2. In Payment Information > Shipping Wallet, enter the top-up amount and choose an offered currency.\n3. Click Top Up and review the payment page.\n4. Complete the payment, return to the ERP, and check the wallet balance before booking.\nWallet credit is added after payment processing and the currency-conversion reserve, so do not assume it equals the gross payment amount.');
  q(manual,'Why does Shipping Wallet say I need more MYR before booking?',
    'The available wallet balance is below the selected courier charge after conversion to MYR. Check the displayed shortfall and use Top Up if you want that courier service. Recheck the credited balance before Submit Order. Creating an order without courier is a separate delivery choice, not a way to confirm an unpaid courier booking.');
  q(manual,'Is Create Without Courier free of every ERP requirement?',
    'Create Without Courier does not charge the Shipping Wallet for a courier booking, because you arrange delivery yourself. It still creates an order and can deduct stock. It also does not bypass company plan or trial requirements; follow Purchase Plan Required if the ERP shows that message.');
  q(manual,'How do I add tracking information after creating an order without courier?',
    'Find the self-arranged order in Manual Order List and open its three-dot Action menu > Edit. In Update Delivery Information, enter the courier and tracking details and add the waybill URL or supported PDF when available. Review the information and click Save. This records your delivery details; it does not create a courier booking.',
    'Self-arranged Manual Order Action menu and Update Delivery Information dialog, with customer information hidden.');
  q(manual,'Does Add Gift add a free item to the order I am already viewing?',
    'Add Gift opens a separate gift-type Manual Order workflow. It does not simply insert an extra item into an existing order. Select the correct recipient, warehouse, products, and quantities, and review the new order carefully so you do not send or deduct the same gift twice.');
  q(manual,'Does cancelling an EasyParcel shipment restore stock or refund Shipping Wallet?',
    'The Manual Order Cancel action requests shipment cancellation. It does not automatically restore the deducted stock or refund the Shipping Wallet balance. Check the cancellation result, physical stock, and payment or wallet records separately, and ask support about any required correction or refund.');
  q(manual,'Can I use Manual Order for an international EasyParcel shipment?',
    'The current courier workflow supports domestic routes within Malaysia, Singapore, Thailand, Indonesia, the Philippines, and Vietnam. Sender and receiver must be in the same supported country. Do not select a different country just to make a rate appear; use an approved alternative delivery arrangement for an unsupported route.');
  q(manual,'Should I submit again if the booking result is uncertain?',
    'First reload Manual Order List and open the existing order\'s Details. Check Booking Status, any error, tracking, and waybill information. Do not create a second order or repeat a booking while the first result is uncertain. Use Retry Shipment only when that action is offered for a failed booking, or contact support with the order number.');
  q(manual,'Where can I check why a courier booking failed?',
    'Go to Manual Order List and open the row\'s Action menu > Details. Review Booking Status, the booking message, and Status History. Correct the reported address, parcel, service, or wallet problem before using Retry Shipment when it is available. Keep the original order number when contacting support.');
  q(manual,'What is the difference between a payment certificate and a waybill?',
    'A payment certificate is optional evidence of payment; uploading it does not collect money or create a shipping label. A waybill is the courier document used for the shipment. Open certificate and Open Waybill in Details refer to these different documents, so check the file before sending or printing it.');
  q(stores,'Why can I open a page but see Purchase Plan Required when I save?',
    'Some setup and viewing pages remain available while protected actions require active company access. Check the store\'s trial or paid-plan days in Store Authorization. If the company has no eligible active store, ask the owner to use Upgrade Plan and complete the required purchase before retrying the action.');
  q(stores,'Does Unlink just hide the store from the list?',
    'No. Unlink removes the ERP store connection and associated imported product mappings and store-access links. It does not delete the marketplace account itself. Before confirming, check outstanding work and export records you need. Do not use Unlink as a routine refresh or assume reconnecting will preserve every mapping.');
  q(stores,'What do the days selected for Auto Order Accept mean?',
    'The selected weekdays determine when the ERP\'s scheduled automatic processing is allowed to run for that store. They are not a number of days to delay each order. Check the store\'s Auto Order Accept settings and eligible order stage, and review the results in Order Processing instead of assuming every order is immediately accepted.');
  q(staff,'Can any staff member add or delete Sub Accounts?',
    'Creating, changing, or deleting Sub Accounts requires the company owner. Seeing Sub Account in the menu does not give a staff member owner authority. Ask the owner to make the account change and review the employee\'s role, Store Permissions, and Warehouse Permissions.');
  q(staff,'Is Add Account an invitation that the employee accepts later?',
    'No. Add Account completes a login check or registration as part of setup and links the user to the company. For an existing login, the matching password is required. Coordinate privately with the employee and choose the correct role, stores, and warehouses; do not expect a separate invitation-acceptance step.');
  q(staff,'Can I add an email that already belongs to another ERP company?',
    'Use Add Account only for an employee who is intended to join your company. Linking an existing login can change that user\'s ERP company membership, so it is not a harmless invitation. Confirm the account and obtain approval from the people responsible for both companies before proceeding; ask support if the membership should remain unchanged.');
  q(staff,'Why can a Sub Account open a page but not see a store or warehouse?',
    'Page access and record access are separate. The owner should check the assigned role under Role Management, then edit the Sub Account\'s Store Permissions and Warehouse Permissions. Confirm the correct store and warehouse are selected and sign in again after the change.');
  q('System Configuration > Account Management > Role Management','Can I make a role read-only by turning off Edit and Delete?',
    'The current Role Management form uses page-access checkboxes; it does not provide separate Edit and Delete switches for every page. Restrict the pages, stores, and warehouses the employee needs, then verify the actions that remain available. Ask support before relying on the role as a guaranteed read-only account.');
  q('System Configuration > Account Management > Role Management','Why is a role unable to be deleted?',
    'The Owner role is protected, and a role assigned to users cannot be removed until those users are reassigned. Have the owner review the affected Sub Accounts, choose suitable replacement roles, and then retry deleting the unused role. Do not remove needed access just to clear a warning.');
  q('Pricing > Purchase subscription','Why is the checkout total higher than the price on one plan?',
    'Store subscriptions are charged per selected store. The checkout amount depends on the chosen plan, store count, and currency. Review the selected store names and total before Pay with Stripe. Shipping Wallet top-ups are separate payments and should not be confused with the subscription total.');
  q('Pricing > Purchase subscription','Will renewing early remove the days left on my store plan?',
    'A successful renewal adds the purchased period after the later of the existing expiry or the payment date. Remaining valid days are therefore retained. After payment, check the selected store and updated validity in Store Authorization, and contact support with the payment reference if they do not match.');
  q('Pricing > Checkout','Can I add a referral code after I have paid?',
    'The customer checkout flow accepts an eligible code before payment; it does not offer a later add-code action on Payment Success. Check the code on Checkout before Pay with Stripe. If you already paid without it, ask support whether anything can be done, without assuming a reward can be added afterward.');
  q('Top-right account menu > My gift','Who receives the gift when a referral code is used?',
    'A successful eligible referral creates the gift for the code owner\'s company, not an automatic free printer for the buyer. The recipient owner can open My gift to review the reward and submit delivery details. The buyer should still check the full subscription amount at Checkout.');
  q('Top-right account menu > My gift','Does Receive Gift mean I am confirming that the parcel arrived?',
    'No. Receive Gift on the address form submits your delivery address after confirmation. Confirm Received is the later action for a gift marked Delivered and should be used only after the parcel actually arrives. Read the gift\'s status before choosing either action.',
    'Two separately labelled views: gift address form with Receive Gift, and Delivered gift with Confirm Received. Hide all personal address data.');
  q('Warehouse Management','Can I change the default warehouse for only my own login?',
    'The default warehouse is a company-wide setting, not a private preference for one login. Before changing it in Warehouse Management, check with the owner or team responsible for order and stock setup. Always review the warehouse selected in a form even when a default is provided.');
  q('Dashboard > Sales Trends','Why should I check the Sales Trends tooltip before comparing figures?',
    'Hover over a graph point to see Sales, Orders, and Qty. The graph can use quantity or order count when positive sales value is unavailable, so a plotted number is not always money. Confirm the platform, month, year, and displayed metric before using the chart for a sales comparison.');
  q('Floating AI assistant','Can the chatbot change an order or show my exact live stock?',
    'The assistant explains the documented workflows; it cannot carry out an order change or read your private live inventory. Open the relevant Order Management page or Inventory List to check and change records using your account permissions. Never treat a general help answer as confirmation that an action or payment has completed.');
  q('General support','What should I do if a help answer names a button I cannot see?',
    'Check the page and submenu, the selected record\'s status, and your account access. Some actions appear only in a row\'s three-dot Action menu or at an eligible stage. If the label or page still differs, send Contact a screenshot with personal details hidden and quote the question number. Do not use a different action just because its name sounds similar.');
};
