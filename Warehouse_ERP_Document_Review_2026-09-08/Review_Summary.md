# Warehouse ERP Q&A Review

Date: 2026-09-08

## Deliverables

- Warehouse_ERP_Chatbot_Clean.docx: customer-facing upload copy; matching TXT supplied.
- Warehouse_ERP_Chatbot_Review_Marked.docx: original/revised comparison with change and image marks. Do not upload this copy.
- Question_Change_Register.csv: filterable, question-by-question comparison and review references.
- Image_Checklist.csv: all original screenshot links, hidden-link issues, and capture requests.

## Results

844 source questions, 330 revised answers, 48 edited titles, 71 added questions, 915 final questions. 514 original answers retain their meaning. All entries gained consistent extraction-safe formatting and a Location line. No original numbered question was removed or renumbered. The unnumbered inventory overview became Q-845. Similar questions remain separately numbered for comparison; related answers were aligned rather than silently merged.

## Important Corrections

- Product List manages Merchant SKUs, not the marketplace listing table.
- Outbound Draft does not deduct or reserve stock; Ship deducts it; Receive does not deduct it again. Destination receipt is separate.
- Manual Order uses Create Without Courier and Submit Order. Both can deduct stock. The current payment choice is Prepaid, not a COD selector.
- Q-826: Refresh is in the eligible Manual Order row's three-dot Action menu. It is not called Refresh Status, and not every status offers it.
- Courier cancellation does not automatically restore stock or refund Shipping Wallet.
- Role Management provides page access, not separate per-action read-only switches for every page. Sub Account administration and subscription checkout require the owner.
- Store Unlink can remove imported products and mappings; it is not a routine refresh.
- Share referral code is the actual menu, not My Referral Codes. Eligibility depends on paid history and the qualifying plan.
- Receive Gift submits an address; Confirm Received confirms delivery later.

## Evidence and Limits

Frontend reviewed: D:\Warehouse ERP Update zip\EasyParcel\ERP_Frontend_Test_EasyParcel_ManualOrder_Patched

Backend reviewed: D:/Warehouse ERP Update zip/EasyParcel/ERP_ServerSite_Test_EasyParcel_ManualOrder_Patched

Chatbot ingestion reviewed: D:/Projects/THT Running Project/Translator-Detect-AiChat server site New with swagger

The hosted site https://printernoble.com/warehouse_management/ could not be reached: both direct and www requests timed out. No owner/subaccount login, live UI verification, new screenshot capture, payment, shipment, or stock mutation was performed. Findings are grounded in the supplied local implementation, not proof of the current deployment. Credentials are excluded from all deliverables. No application code or original DOCX was changed.

The source contains 164 questions with existing screenshot links (164 unique targets), 3 questions with hidden or mismatched hyperlink issues, and no embedded images. 10 questions have a screenshot capture/replacement request. All original targets are retained in the marked copy and checklist. The clean copy intentionally omits unverified images; it does not label them correct. New screenshots could not be captured.

## Image Follow-up

Filter Image_Checklist.csv by IMAGE LINE CLEANUP to locate blank hyperlink remnants and displayed/target mismatches. Remove the stray hyperlink, not the entire question. Open every retained image, confirm it shows the revised workflow and exact label, and replace it if outdated. For IMAGE NEEDED, capture the requested state on the live site with private data masked. After publishing an image, add a visible line such as Screenshot: https://your-public-host/example.png below the relevant answer in the clean DOCX. Embedded images alone are not read by this text-extraction endpoint. Do not add [IMAGE NEEDED] or reviewer notes to chatbot knowledge.

## Upload Format and Safety

The existing extractor recognizes Q-001: Question followed by Answer: text. Keep each question and Answer in separate ordinary paragraphs; use literal step numbers rather than automatic Word numbering. Do not add section headings between answers, because the parser can absorb them into the preceding answer. Location belongs inside the answer. Optional Alternative Questions belongs before Answer.

POST /chatBot/warehouseErp/extractText takes multipart docxFile and category. It extracts text and rebuilds embeddings, but replaces the existing Warehouse ERP extracted-text knowledge file; it is not an append-only upload. Back up the existing knowledge first, choose the Warehouse ERP category, and upload only the clean document. POST /chatBot/warehouseErp/appendText appends text and rebuilds embeddings; avoid adding duplicate copies of the same Q&A. These administrative instructions are not included in the customer answers. No upload was performed.

After an approved upload, use /chatBot/warehouseErp/chat/gpt/no-store for initial tests without unknown-question storage or hit counting. Test add-store navigation, merchant versus platform products, receiving a shortage, outbound stock timing, missing Refresh, without-courier stock effects, wallet versus subscription, staff visibility, gift button differences, and an unknown/private-data question. Check both owner and staff views on the live site without carrying out destructive actions. Then confirm the normal /chatBot/warehouseErp/chat/gpt widget behavior. Perfect answers cannot be guaranteed solely by a document; monitor failures and keep the knowledge synchronized with deployed changes.

## Section Coverage

Counts cover all numbered source FAQs plus additions. References in the register identify reviewed areas, not a claim that every route has been exercised live.

| Location | Questions | Revised originals | New |
| --- | ---: | ---: | ---: |
| Dashboard | 65 | 17 | 0 |
| Product Management | 11 | 1 | 0 |
| Inventory Management | 14 | 2 | 1 |
| Order Management | 14 | 3 | 0 |
| Warehouse Management | 69 | 29 | 1 |
| System Configuration | 7 | 1 | 0 |
| Sidebar > Store Plans | 8 | 2 | 0 |
| Top bar > Select language | 3 | 0 | 0 |
| Top bar and account menu | 1 | 1 | 0 |
| Top-right account menu > Profile Info | 2 | 1 | 1 |
| Top-right account menu > My gift | 26 | 9 | 2 |
| Top-right account menu > Share referral code | 35 | 21 | 0 |
| Top-right account menu > Log Out | 1 | 0 | 0 |
| Product Management > Product List | 66 | 27 | 5 |
| Product Management > Combine SKU | 26 | 12 | 1 |
| Inventory Management > Merchant SKU | 14 | 7 | 1 |
| Inventory Management > SKU Mapping > By Product | 17 | 8 | 3 |
| Inventory Management > SKU Mapping > By Merchant | 10 | 6 | 1 |
| Inventory Management > Inventory List | 21 | 7 | 5 |
| Inventory Management > Manual inbound | 7 | 3 | 0 |
| Inventory Management > Inbound | 16 | 7 | 4 |
| Inventory Management > Outbound | 14 | 5 | 3 |
| Inventory Management > Inventory Log | 17 | 6 | 1 |
| Order Management > Order Processing | 30 | 7 | 1 |
| Order Management > Order Processing > New Order | 10 | 2 | 0 |
| Order Management > Order Processing > Processed Order | 9 | 5 | 2 |
| Order Management > Order Processing > To Pickup Order | 5 | 2 | 0 |
| Order Management > Order Processing > Shipped Order | 5 | 1 | 0 |
| Order Management > Order Processing > Completed | 4 | 1 | 0 |
| Order Management > Order Processing > All Order | 3 | 1 | 0 |
| Order Management > Order Processing > Return Order | 14 | 4 | 4 |
| Order Management > Order Processing > Canceled Order | 7 | 6 | 0 |
| Order Management > Manual Order | 52 | 17 | 11 |
| Order Management > Platform Manual Order | 12 | 5 | 2 |
| System Configuration > Store Authorization | 52 | 14 | 3 |
| System Configuration > Account Management > Sub Account | 30 | 12 | 4 |
| System Configuration > Account Management > Role Management | 27 | 10 | 2 |
| Pricing > Purchase subscription | 90 | 34 | 2 |
| Warehouse ERP | 10 | 0 | 0 |
| Product Management; Inventory Management > SKU Mapping | 9 | 0 | 0 |
| Inventory Management > Inbound; Inventory Management > Outbound | 8 | 4 | 0 |
| System Configuration > Account Management | 11 | 7 | 0 |
| Dashboard; Export on product, inventory, and order lists | 8 | 3 | 0 |
| Warehouse ERP; Help Center; Contact | 20 | 13 | 0 |
| Top-right account menu > Share referral code; My gift | 6 | 1 | 0 |
| Floating AI assistant | 11 | 1 | 1 |
| Floating AI assistant; Contact | 1 | 0 | 0 |
| Contact | 4 | 1 | 2 |
| Log In | 2 | 2 | 0 |
| Log In > Forgot password? | 2 | 1 | 1 |
| Sign Up > Verify Your Email | 1 | 1 | 0 |
| Log In; Contact | 1 | 0 | 0 |
| Help Center | 2 | 0 | 2 |
| Workspace tabs | 1 | 0 | 1 |
| Log In > Create account | 1 | 0 | 1 |
| Pricing > Checkout | 1 | 0 | 1 |
| Dashboard > Sales Trends | 1 | 0 | 1 |
| General support | 1 | 0 | 1 |

## File Validation

915 questions were recognized by the actual chatbot parser after DOCX extraction and the same newline normalization used by the upload endpoint. IDs are consecutive and unique; questions, answers, and alternate wordings match the source data for the new clean copy. 25 questions include alternative customer phrasings. Both Word packages passed XML checks and extracted without Mammoth warnings. Original screenshot targets remain in the marked copy, and the original source DOCX hash is unchanged. 40 review-reference paths were checked for existence. Validation failures: 0.

Visual page rendering in Microsoft Word was not performed. Live account checks, screenshot validation, embedding rebuilds, and generated-answer tests remain pending. The upload route catches an embedding-rebuild error, so an upload success message alone is not proof that retrieval was rebuilt successfully. Check the index result and test real customer questions after an approved upload.
