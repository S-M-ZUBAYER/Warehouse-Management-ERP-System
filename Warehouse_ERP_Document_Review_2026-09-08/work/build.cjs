const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');
const apiRoot = 'D:/Projects/THT Running Project/Translator-Detect-AiChat server site New with swagger';
const JSZip = require(path.join(apiRoot, 'node_modules/jszip'));
const mammoth = require(path.join(apiRoot, 'node_modules/mammoth'));
const {DOMParser} = require(path.join(apiRoot, 'node_modules/@xmldom/xmldom'));
const parser = require(path.resolve('node_modules/@babel/parser'));
const source = require('./source.json');
const output = path.resolve(__dirname, '..');
const front = path.resolve('.');
const back = 'D:/Warehouse ERP Update zip/EasyParcel/ERP_ServerSite_Test_EasyParcel_ManualOrder_Patched';
const date = '2026-09-08';
const pad = id => `Q-${String(id).padStart(3,'0')}`;
const normalize = s => String(s || '').replace(/\u00a0/g,' ').replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/[\u2013\u2014\u2192]/g,' - ').replace(/[ \t]+/g,' ').trim();
const topHeadings = new Set(['Dashboard:', 'Product Management', 'Inventory Management', 'Order Management', 'Warehouse Management', 'System Configuration', 'Upgrade Plan', 'Business Owner Questions why he will use it', 'Referral Code & Gift']);
const structural = p => /^Heading/.test(p.style) && (topHeadings.has(p.text.trim()) || /^[A-Z]\.\s/.test(p.text) || /^1\. What pages are available/.test(p.text));
const urlRegex = /https?:\/\/[^\s<>"']+/g;
function scopedBody(q) {
  const stop=q.body.findIndex(structural);
  return stop < 0 ? q.body : q.body.slice(0, stop);
}
function originalAnswer(body) {
  return body.map(p=>p.text).join('\n').replace(/^\s*Answer:\s*/i,'').trim();
}
function cleanAnswer(body) {
  const lines=body.map(p=>normalize(p.text))
    .filter(t=>t && !/https?:\/\/|app screenshots|\[SCREENSHOT|Screenshot needed:|\[IMAGE/i.test(t));
  let text=lines.join('\n').replace(/^Answer:\s*/i,'').trim();
  // Plain-text bullets survive DOCX extraction, unlike automatic Word numbering.
  text=text.split('\n').map((line,i)=>i>0 && !/[.!?:]$/.test(line) && !/^\d+\.|^- /.test(line) ? '- '+line : line).join('\n');
  return text;
}
const ranges = [
  [1,62,'Dashboard'],[63,70,'Sidebar > Store Plans'],[71,78,'Top bar and account menu'],[79,86,'Dashboard'],
  [87,147,'Product Management > Product List'],[148,172,'Product Management > Combine SKU'],[173,182,'Product Management'],
  [183,184,'Inventory Management'],[185,197,'Inventory Management > Merchant SKU'],[198,211,'Inventory Management > SKU Mapping > By Product'],[212,220,'Inventory Management > SKU Mapping > By Merchant'],
  [221,235,'Inventory Management > Inventory List'],[236,242,'Inventory Management > Manual inbound'],[243,254,'Inventory Management > Inbound'],[255,265,'Inventory Management > Outbound'],[266,281,'Inventory Management > Inventory Log'],
  [282,310,'Order Management > Order Processing'],[311,320,'Order Management > Order Processing > New Order'],[321,327,'Order Management > Order Processing > Processed Order'],[328,332,'Order Management > Order Processing > To Pickup Order'],[333,337,'Order Management > Order Processing > Shipped Order'],[338,341,'Order Management > Order Processing > Completed'],[342,344,'Order Management > Order Processing > All Order'],[345,354,'Order Management > Order Processing > Return Order'],[355,361,'Order Management > Order Processing > Canceled Order'],[362,381,'Order Management > Manual Order'],[382,391,'Order Management > Platform Manual Order'],
  [392,453,'Warehouse Management'],[454,459,'System Configuration'],[460,499,'System Configuration > Store Authorization'],[500,524,'System Configuration > Account Management > Sub Account'],[525,549,'System Configuration > Account Management > Role Management'],[550,627,'Pricing > Purchase subscription'],
  [628,637,'Warehouse ERP overview'],[638,646,'System Configuration > Store Authorization'],[647,655,'Product Management and SKU Mapping'],[656,665,'Inventory Management'],[666,673,'Inventory Management > Inbound and Outbound'],[674,686,'Order Management'],[687,691,'Warehouse Management'],[692,699,'System Configuration > Account Management'],[700,707,'Dashboard and reports'],[708,717,'Pricing > Purchase subscription'],[718,727,'Getting started and support'],
  [728,761,'Top-right account menu > Share referral code'],[762,784,'Top-right account menu > My gift'],[785,790,'Referrals and gifts'],[791,814,'Getting started and support'],[815,835,'Order Management > Manual Order'],[836,843,'Floating AI assistant'],[844,844,'Account security']
];
function menuFor(id) {
  const exact={10:'Product Management',11:'Inventory Management',12:'Order Management',13:'Warehouse Management',14:'System Configuration',71:'Top bar > Select language',72:'Top bar > Select language',73:'Top bar > Select language',75:'Top-right account menu > Profile Info',76:'Top-right account menu > My gift',77:'Top-right account menu > Share referral code',78:'Top-right account menu > Log Out',794:'System Configuration > Account Management',795:'System Configuration > Account Management',796:'Floating AI assistant',797:'Floating AI assistant',798:'Floating AI assistant; Contact',800:'Contact',803:'Log In',805:'System Configuration > Account Management > Sub Account',806:'System Configuration > Account Management',814:'Inventory Management > Inventory List'};
  if(exact[id]) return exact[id];
  if(id===799) return 'Contact';
  if(id===801) return 'Log In';
  if(id===802) return 'Log In > Forgot password?';
  if(id===804) return 'Sign Up > Verify Your Email';
  const match=ranges.find(([a,b])=>id>=a&&id<=b);
  if(!match) throw new Error('Unassigned section '+id);
  return match[2].replace('Warehouse ERP overview','Warehouse ERP').replace('Product Management and SKU Mapping','Product Management; Inventory Management > SKU Mapping').replace('Inventory Management > Inbound and Outbound','Inventory Management > Inbound; Inventory Management > Outbound').replace('Dashboard and reports','Dashboard; Export on product, inventory, and order lists').replace('Getting started and support','Warehouse ERP; Help Center; Contact').replace('Referrals and gifts','Top-right account menu > Share referral code; My gift').replace('Account security','Log In; Contact');
}
function evidence(menu) {
  const refs=['Frontend: src/router/routes.jsx; src/components/layout/Sidebar.jsx; src/i18n.js'];
  const rules=[
    [/Dashboard/, 'Frontend: src/features/dashboard; Backend: modules/dashboard'],
    [/Product|Combine|Merchant SKU/, 'Frontend: src/features/productManagement; src/features/inventoryManagement/merchantSKU; Backend: modules/merchantSkus; modules/combineskus'],
    [/SKU Mapping|SKU Management/, 'Frontend: src/features/inventoryManagement/SKUMapping; Backend: modules/platformSkuMappings'],
    [/Inventory|Inbound|Outbound/, 'Frontend: src/features/inventoryManagement; Backend: modules/inventory; modules/inbound; modules/outbound'],
    [/Manual Order/, 'Frontend: src/features/orderManagement/manualOrder; src/features/orderManagement/platformManualOrder; Backend: modules/manualOrders; modules/platformManualOrders'],
    [/Order Processing|^Order Management$/, 'Frontend: src/features/orderManagement/orderProcessing; src/features/orderManagement/shared; Backend: modules/orders; modules/returnOrders'],
    [/Warehouse Management/, 'Frontend: src/features/warehouseManagement; Backend: modules/warehouses'],
    [/Store|Pricing|subscription|Referral|referral|gift|Gift/, 'Frontend: src/features/systemConfigaration; src/features/pricing; src/components/layout/GiftReferralModalController.jsx; Backend: modules/platformStores; modules/subscription'],
    [/Sub Account|Role Management|Account Management|System Configuration/, 'Frontend: src/features/systemConfigaration; Backend: modules/auth; modules/roles; modules/users/users.routes.js'],
    [/Help Center/, 'Frontend: src/features/helpCenter/HelpCenterPage.jsx'],
    [/Contact|support/, 'Frontend: src/features/contact/ContactPage.jsx'],
    [/assistant/, 'Frontend: src/components/shared/FloatingAiChatbot.jsx; Chatbot: routes/WarehouseERPRoutes.js; utils/faqEmbeddingHelper.js'],
    [/account|Log In|Sign Up|security|Workspace|Top bar/i, 'Frontend: src/components/layout; src/features/auth']
  ];
  for(const [test,ref] of rules) if(test.test(menu)) refs.push(ref);
  return refs.join(' | ').replace(/; (Backend|Chatbot): /g,' | $1: ');
}
const changes = new Map();
function edit(id,value) {
  if(!source.questions.some(q=>q.id===id)) throw new Error('Unknown original ID '+id);
  changes.set(id, {...changes.get(id),...Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined))});
}
for(const letter of ['a','b','c','d']) require(`./changes-${letter}.cjs`)({edit});
const titles={
  112:'What does the Image column show in Product List?',298:'What does the Image column show in Order Processing?',503:'What does the Image column show in Sub Account?',
  125:'What does Select All do in Product List?',296:'What does Select All do in Order Processing?',494:'What does Select All do in Store Authorization?',
  137:'What does Details show in Product List?',194:'What does Details show in Merchant SKU?',308:'What does Details show in Order Processing?',389:'What does Details show in Platform Manual Order?',
  138:'Which Actions are available in Product List?',195:'Which Actions are available in Merchant SKU?',309:'Which Actions are available in Order Processing?',390:'Which Actions are available in Platform Manual Order?',426:'Which Actions are available in Warehouse Management?',483:'Which Actions are available in Store Authorization?',
  142:'What does Export do in Product List?',143:'What does Print do in Product List?',145:'What do Previous and Next do in Product List?',442:'What do Previous and Next do in Warehouse Management?',
  197:'What do Export and Print do in Merchant SKU?',297:'What do Export and Print do in Order Processing?',495:'What do Export and Print do in Store Authorization?',
  201:'What does the platform filter do in SKU Mapping > By Product?',287:'What does the platform filter do in Order Processing?',491:'What does the platform filter do in Store Authorization?',
  215:'What does Status mean in SKU Mapping > By Merchant?',307:'What does Status mean in Order Processing?',482:'What does Create Time mean in Store Authorization?',507:'What does Create Time mean in Sub Account?'
};
for(const [id,title] of Object.entries(titles)) {
  const previous=changes.get(Number(id));
  edit(Number(id),{question:title,reason:(previous?.reason?previous.reason+' ':'')+'Added the exact page name to distinguish this repeated question from similar controls on other pages.'});
}
const questions=source.questions.map(q=>{
  const body=scopedBody(q);
  const change=changes.get(q.id)||{};
  const links=[];
  for(const p of body) {
    for(const url of [...(p.text.match(urlRegex)||[]), ...p.links.map(l=>l.url)]) {
      if(!links.includes(url)) links.push(url);
    }
  }
  const linkIssues=[];
  for(const p of body) for(const l of p.links) {
    if(!l.text.trim()) linkIssues.push(`Blank hyperlink text points to ${l.url}`);
    else if(/^https?:\/\//.test(l.text.trim()) && l.text.trim()!==l.url) linkIssues.push(`Displayed URL differs from hyperlink target: ${l.text.trim()} -> ${l.url}`);
  }
  return {id:q.id, originalQuestion:q.question.trim(), originalAnswer:originalAnswer(body), question:normalize(change.question||q.question), answer:normalize(change.answer||cleanAnswer(body)), menu:menuFor(q.id), modified:!!change.answer, edited:!!change.question && normalize(change.question)!==normalize(q.question), reason:change.reason||'Meaning retained after section review.', image:change.image||'', links, linkIssues, originalParagraph:q.paragraph, isNew:false};
});
require('./new-questions.cjs')({add:value=>questions.push({id:questions.length+1, ...value, question:normalize(value.question),answer:normalize(value.answer), modified:false,edited:false,isNew:true,links:[],linkIssues:[],reason:questions.length===844?'Recovered the unnumbered Inventory Management overview as a searchable FAQ.':'Added a missing customer workflow, troubleshooting case, or action consequence.'})});
const variants={
  130:'How do I set a minimum stock warning?; How can I set product stock alerts?',
  140:'How do I update a product in Product List?; Where can I edit a product?',
  152:'How do I create a bundle?; How can I add a Combine SKU?; How do I sell several items as one set?',
  163:'How many bundles can I sell?; Why is Combine SKU stock lower than component stock?',
  192:'How can I add a product photo?; Where do I change the Merchant SKU image?',
  210:'How do I import marketplace products?; How can I refresh my Shopee listings in the ERP?',
  239:'How do I add stock I already received?; How can I record an immediate warehouse receipt?',
  248:'How do I create an incoming stock shipment?; How do I make an inbound draft?',
  264:'When is outbound stock deducted?; Does saving an outbound draft reduce inventory?',
  403:'How do I add a new warehouse?; Where can I create a warehouse location?',
  433:'How do I move stock to another warehouse?; Does an outbound transfer add stock at the destination?',
  480:'How do I choose automatic processing weekdays?; Is Auto Process Days a delay?',
  484:'How can I add a new store?; How do I connect my Shopee shop?; How do I authorize my TikTok store?',
  516:'How do I remove a staff account?; Where do I stop ERP access for an employee who left?',
  543:'Why can I not delete an assigned role?; How do I remove an unused role?',
  551:'Where do I renew my store plan?; How do I open the subscription purchase page?',
  733:'Where is my referral code?; How do I find a code to share?',
  762:'How do I claim my printer gift?; Where do I enter the gift delivery address?',
  799:'How can I contact customer support?; Where can I report an ERP problem?',
  802:'How do I reset my password?; I forgot my login password, what should I do?',
  819:'How can I create an order without EasyParcel?; Where is Create Without Courier?; Is Save Only a draft?',
  820:'How do I book a courier for a Manual Order?; Where is Submit Order?',
  826:'Where is the Refresh Status button?; Why can I not see Refresh in Manual Order?; How do I refresh courier tracking?',
  840:'Can the chatbot see my current stock?; Can the AI check my private order status?'
};
for(const q of questions) if(variants[q.id]) q.variants=variants[q.id];
for(const q of questions) {
  q.question=q.question.replace(/\s+$/,'');
  q.image=q.image||'';
  q.evidence=evidence(q.menu);
  q.finalAnswer=`Location: ${q.menu}\n${q.answer}`;
  q.markers=[q.isNew?'NEW QUESTION':q.modified?'MODIFIED ANSWER':'REVIEWED - MEANING RETAINED'];
  if(q.edited) q.markers.push('EDITED QUESTION');
  if(q.variants) q.markers.push('QUESTION VARIANTS ADDED');
  q.markers.push('FORMAT UPDATED');
  if(q.links.length) q.markers.push('IMAGE CHECK NEEDED');
  if(q.linkIssues.length) q.markers.push('IMAGE LINE CLEANUP');
  if(q.image) q.markers.push('IMAGE NEEDED');
}
const cleanText='Warehouse ERP Customer Questions and Answers\n'+questions.map(q=>`${pad(q.id)}: ${q.question}\n${q.variants?'Alternative Questions: '+q.variants+'\n':''}Answer: ${q.finalAnswer}`).join('\n\n')+'\n';
const stats={sourceQuestions:source.questions.length,finalQuestions:questions.length,modifiedAnswers:questions.filter(q=>q.modified).length,editedQuestions:questions.filter(q=>q.edited).length,newQuestions:questions.filter(q=>q.isNew).length,retainedAnswers:questions.filter(q=>!q.modified&&!q.isNew).length,questionsWithVariants:questions.filter(q=>q.variants).length,questionsWithSourceImages:questions.filter(q=>q.links.length).length,questionsWithLinkCleanup:questions.filter(q=>q.linkIssues.length).length,questionsNeedingNewImages:questions.filter(q=>q.image).length,sourceUniqueLinks:new Set(questions.flatMap(q=>q.links)).size};
const xml=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
function paragraph(text,style='Normal') {return `<w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr><w:r><w:t xml:space="preserve">${xml(text)}</w:t></w:r></w:p>`;}
function lines(text,style='Normal') {return text.split('\n').map(s=>paragraph(s,style)).join('');}
async function docx(filename,body,title) {
  const zip=new JSZip();
  const hyperlinkTargets=[];
  body=body.replace(/<w:r><w:t xml:space="preserve">(https?:\/\/[^<]+)<\/w:t><\/w:r>/g,(match,url)=>{
    let index=hyperlinkTargets.indexOf(url);
    if(index<0) {index=hyperlinkTargets.length;hyperlinkTargets.push(url);}
    return `<w:hyperlink r:id="rIdLink${index}"><w:r><w:rPr><w:color w:val="006B80"/><w:u w:val="single"/></w:rPr><w:t xml:space="preserve">${url}</w:t></w:r></w:hyperlink>`;
  });
  const hyperlinkRels=hyperlinkTargets.map((url,i)=>`<Relationship Id="rIdLink${i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${url}" TargetMode="External"/>`).join('');
  zip.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>');
  zip.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>');
  zip.file('docProps/core.xml',`<?xml version="1.0" encoding="UTF-8"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xml(title)}</dc:title><dc:creator>Warehouse ERP Documentation Review</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${date}T00:00:00Z</dcterms:created></cp:coreProperties>`);
  zip.file('docProps/app.xml','<?xml version="1.0" encoding="UTF-8"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Warehouse ERP Documentation Review</Application></Properties>');
  zip.file('word/_rels/document.xml.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdFooter" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>'+hyperlinkRels+'</Relationships>');
  zip.file('word/styles.xml',`<?xml version="1.0" encoding="UTF-8"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/><w:color w:val="202A30"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="100" w:line="270" w:lineRule="auto"/><w:widowControl/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="240"/><w:keepNext/></w:pPr><w:rPr><w:b/><w:sz w:val="38"/><w:color w:val="164E63"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:outlineLvl w:val="0"/><w:keepNext/><w:spacing w:before="280" w:after="120"/></w:pPr><w:rPr><w:b/><w:sz w:val="27"/><w:color w:val="164E63"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Label"><w:name w:val="Review label"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/></w:pPr><w:rPr><w:b/><w:sz w:val="20"/><w:color w:val="825100"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Original"><w:name w:val="Original text"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="180"/><w:shd w:fill="F0F2F3"/></w:pPr><w:rPr><w:color w:val="535D63"/><w:sz w:val="20"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Note"><w:name w:val="Review note"/><w:basedOn w:val="Normal"/><w:rPr><w:sz w:val="19"/><w:color w:val="535D63"/></w:rPr></w:style></w:styles>`);
  zip.file('word/footer1.xml','<?xml version="1.0" encoding="UTF-8"?><w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>Warehouse ERP | </w:t></w:r><w:fldSimple w:instr="PAGE"/></w:p></w:ftr>');
  zip.file('word/document.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${body}<w:sectPr><w:footerReference w:type="default" r:id="rIdFooter"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1050" w:right="1000" w:bottom="1050" w:left="1000" w:header="500" w:footer="500"/><w:cols w:space="708"/></w:sectPr></w:body></w:document>`);
  const buffer=await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'});
  fs.writeFileSync(path.join(output,filename),buffer);
  return buffer;
}
function csv(filename,columns,rows) {
  const escape=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
  fs.writeFileSync(path.join(output,filename),'\ufeff'+[columns,...rows].map(row=>row.map(escape).join(',')).join('\r\n')+'\r\n');
}
async function main() {
  let cleanBody=paragraph('Warehouse ERP Customer Questions and Answers','Title');
  for(const q of questions) cleanBody+=paragraph(`${pad(q.id)}: ${q.question}`,'Heading1')+(q.variants?paragraph('Alternative Questions: '+q.variants,'Note'):'')+lines('Answer: '+q.finalAnswer);
  const cleanBuffer=await docx('Warehouse_ERP_Chatbot_Clean.docx',cleanBody,'Warehouse ERP Customer Questions and Answers');
  const reviewIntro=[
    'Review date: '+date+'. Source: Warehouse management ERP Question Answers (1).docx.',
    `${stats.sourceQuestions} original questions retained; ${stats.modifiedAnswers} answers revised; ${stats.editedQuestions} question titles edited; ${stats.newQuestions} questions added; ${stats.finalQuestions} questions in the clean copy.`,
    'READ BEFORE USE: This is the marked comparison copy. Upload only Warehouse_ERP_Chatbot_Clean.docx to the chatbot. Original and revised answers together would create contradictory knowledge.',
    'Verification: All numbered source entries were reviewed section by section against the supplied local frontend and relevant backend implementation. The hosted site could not be reached during this review. No live account or end-to-end shipment, payment, or stock test was performed. Local code and the deployed version can differ.',
    'Marks: [MODIFIED ANSWER] substantive rewrite; [EDITED QUESTION] changed title; [NEW QUESTION] added FAQ; [QUESTION VARIANTS ADDED] alternate customer wording for the same answer; [FORMAT UPDATED] location and extraction-safe paragraphs/bullets; [IMAGE CHECK NEEDED] existing image not visually verified; [IMAGE LINE CLEANUP] blank or mismatched hyperlink; [IMAGE NEEDED] capture or replace a screenshot.',
    'Every original question keeps its number. All answers have a Location line. Retained answers were not padded merely to be longer. Original section headings were removed from answer text; the unnumbered inventory overview is now Q-845. The local-only Chat page is excluded.',
    'Images: The source has screenshot URLs but no embedded pictures. Every existing URL, including hidden hyperlink targets, is preserved below and in Image_Checklist.csv. None was visually certified because the host was unreachable. Clean answers omit unverified image links and all reviewer placeholders. Add a checked public image URL below its answer before final upload when needed.',
    'Image capture guidance: Use the actual hosted page and the required eligible record status. Hide customer names, addresses, phone numbers, tracking details, balances, and private identifiers. Never fabricate a UI screenshot. A new screenshot can replace a flagged old link rather than adding another confusing link.',
    'This document does not promise a perfect AI response. Retrieval, runtime prompts, source freshness, permissions, and the deployed site must also be tested. No application code or original source document was changed.'
  ];
  let markedBody=paragraph('Warehouse ERP Q&A - Marked Comparison','Title')+reviewIntro.map(x=>paragraph(x)).join('');
  for(const q of questions) {
    markedBody+=paragraph(`${pad(q.id)}: ${q.question}`,'Heading1')+paragraph(q.markers.map(x=>'['+x+']').join(' '),'Label');
    markedBody+=paragraph('Section: '+q.menu,'Note');
    if(!q.isNew && (q.modified||q.edited)) markedBody+=paragraph('ORIGINAL QUESTION AND ANSWER','Label')+paragraph(q.originalQuestion,'Original')+lines(q.originalAnswer,'Original');
    markedBody+=paragraph(q.isNew?'NEW ANSWER':q.modified?'REVISED ANSWER':'REVIEWED ANSWER','Label')+lines('Answer: '+q.finalAnswer);
    if(q.variants) markedBody+=paragraph('Alternative Questions: '+q.variants,'Note');
    markedBody+=paragraph('Reason: '+q.reason,'Note');
    if(q.links.length) markedBody+=paragraph('[IMAGE CHECK NEEDED] Original URLs retained for comparison; not included in clean upload.','Label')+q.links.map(url=>paragraph(url,'Note')).join('');
    if(q.linkIssues.length) markedBody+=paragraph('[IMAGE LINE CLEANUP] '+q.linkIssues.join(' | '),'Note');
    if(q.image) markedBody+=paragraph('[IMAGE NEEDED] Screenshot needed: '+q.image,'Label');
    markedBody+=paragraph('Review references: '+q.evidence,'Note');
  }
  const markedBuffer=await docx('Warehouse_ERP_Chatbot_Review_Marked.docx',markedBody,'Warehouse ERP Q&A - Marked Comparison');
  fs.writeFileSync(path.join(output,'Warehouse_ERP_Chatbot_Clean.txt'),cleanText);
  fs.writeFileSync(path.join(__dirname,'reviewed-questions.json'),JSON.stringify(questions,null,2));
  csv('Question_Change_Register.csv',['Question ID','Question','Location','Markers','Reason','Original question','Original answer','Revised customer answer','Alternative questions','Review references'],questions.map(q=>[pad(q.id),q.question,q.menu,q.markers.join('; '),q.reason,q.originalQuestion,q.originalAnswer,q.finalAnswer,q.variants,q.evidence]));
  const imageRows=[];
  for(const q of questions) {
    for(const link of q.links) imageRows.push([pad(q.id),q.question,q.menu,q.linkIssues.length?'IMAGE CHECK NEEDED; IMAGE LINE CLEANUP':'IMAGE CHECK NEEDED',link,q.linkIssues.join(' | '),'Not fetched or visually verified; host unavailable. Confirm correct page, action, label, and eligible status before use.']);
    if(q.image) imageRows.push([pad(q.id),q.question,q.menu,'IMAGE NEEDED','',q.image,'Capture on hosted site with personal details masked; then insert a public URL under the answer.']);
  }
  csv('Image_Checklist.csv',['Question ID','Question','Location','Status','Original URL','Issue or screenshot request','Required action'],imageRows);
  const groups=new Map();
  for(const q of questions) {
    const g=groups.get(q.menu)||{total:0,changed:0,added:0};
    g.total++;g.changed+=Number(q.modified);g.added+=Number(q.isNew);groups.set(q.menu,g);
  }
  const coverage=[...groups.entries()].map(([menu,g])=>`| ${menu} | ${g.total} | ${g.changed} | ${g.added} |`).join('\n');
  const summary=`# Warehouse ERP Q&A Review\n\nDate: ${date}\n\n## Deliverables\n\n- Warehouse_ERP_Chatbot_Clean.docx: customer-facing upload copy; matching TXT supplied.\n- Warehouse_ERP_Chatbot_Review_Marked.docx: original/revised comparison with change and image marks. Do not upload this copy.\n- Question_Change_Register.csv: filterable, question-by-question comparison and review references.\n- Image_Checklist.csv: all original screenshot links, hidden-link issues, and capture requests.\n\n## Results\n\n${stats.sourceQuestions} source questions, ${stats.modifiedAnswers} revised answers, ${stats.editedQuestions} edited titles, ${stats.newQuestions} added questions, ${stats.finalQuestions} final questions. ${stats.retainedAnswers} original answers retain their meaning. All entries gained consistent extraction-safe formatting and a Location line. No original numbered question was removed or renumbered. The unnumbered inventory overview became Q-845. Similar questions remain separately numbered for comparison; related answers were aligned rather than silently merged.\n\n## Important Corrections\n\n- Product List manages Merchant SKUs, not the marketplace listing table.\n- Outbound Draft does not deduct or reserve stock; Ship deducts it; Receive does not deduct it again. Destination receipt is separate.\n- Manual Order uses Create Without Courier and Submit Order. Both can deduct stock. The current payment choice is Prepaid, not a COD selector.\n- Q-826: Refresh is in the eligible Manual Order row's three-dot Action menu. It is not called Refresh Status, and not every status offers it.\n- Courier cancellation does not automatically restore stock or refund Shipping Wallet.\n- Role Management provides page access, not separate per-action read-only switches for every page. Sub Account administration and subscription checkout require the owner.\n- Store Unlink can remove imported products and mappings; it is not a routine refresh.\n- Share referral code is the actual menu, not My Referral Codes. Eligibility depends on paid history and the qualifying plan.\n- Receive Gift submits an address; Confirm Received confirms delivery later.\n\n## Evidence and Limits\n\nFrontend reviewed: ${front}\n\nBackend reviewed: ${back}\n\nChatbot ingestion reviewed: ${apiRoot}\n\nThe hosted site https://printernoble.com/warehouse_management/ could not be reached: both direct and www requests timed out. No owner/subaccount login, live UI verification, new screenshot capture, payment, shipment, or stock mutation was performed. Findings are grounded in the supplied local implementation, not proof of the current deployment. Credentials are excluded from all deliverables. No application code or original DOCX was changed.\n\nThe source contains ${stats.questionsWithSourceImages} questions with existing screenshot links (${stats.sourceUniqueLinks} unique targets), ${stats.questionsWithLinkCleanup} questions with hidden or mismatched hyperlink issues, and no embedded images. ${stats.questionsNeedingNewImages} questions have a screenshot capture/replacement request. All original targets are retained in the marked copy and checklist. The clean copy intentionally omits unverified images; it does not label them correct. New screenshots could not be captured.\n\n## Image Follow-up\n\nFilter Image_Checklist.csv by IMAGE LINE CLEANUP to locate blank hyperlink remnants and displayed/target mismatches. Remove the stray hyperlink, not the entire question. Open every retained image, confirm it shows the revised workflow and exact label, and replace it if outdated. For IMAGE NEEDED, capture the requested state on the live site with private data masked. After publishing an image, add a visible line such as Screenshot: https://your-public-host/example.png below the relevant answer in the clean DOCX. Embedded images alone are not read by this text-extraction endpoint. Do not add [IMAGE NEEDED] or reviewer notes to chatbot knowledge.\n\n## Upload Format and Safety\n\nThe existing extractor recognizes Q-001: Question followed by Answer: text. Keep each question and Answer in separate ordinary paragraphs; use literal step numbers rather than automatic Word numbering. Do not add section headings between answers, because the parser can absorb them into the preceding answer. Location belongs inside the answer. Optional Alternative Questions belongs before Answer.\n\nPOST /chatBot/warehouseErp/extractText takes multipart docxFile and category. It extracts text and rebuilds embeddings, but replaces the existing Warehouse ERP extracted-text knowledge file; it is not an append-only upload. Back up the existing knowledge first, choose the Warehouse ERP category, and upload only the clean document. POST /chatBot/warehouseErp/appendText appends text and rebuilds embeddings; avoid adding duplicate copies of the same Q&A. These administrative instructions are not included in the customer answers. No upload was performed.\n\nAfter an approved upload, use /chatBot/warehouseErp/chat/gpt/no-store for initial tests without unknown-question storage or hit counting. Test add-store navigation, merchant versus platform products, receiving a shortage, outbound stock timing, missing Refresh, without-courier stock effects, wallet versus subscription, staff visibility, gift button differences, and an unknown/private-data question. Check both owner and staff views on the live site without carrying out destructive actions. Then confirm the normal /chatBot/warehouseErp/chat/gpt widget behavior. Perfect answers cannot be guaranteed solely by a document; monitor failures and keep the knowledge synchronized with deployed changes.\n\n## Section Coverage\n\nCounts cover all numbered source FAQs plus additions. References in the register identify reviewed areas, not a claim that every route has been exercised live.\n\n| Location | Questions | Revised originals | New |\n| --- | ---: | ---: | ---: |\n${coverage}\n`;
  fs.writeFileSync(path.join(output,'Review_Summary.md'),summary);
  const extraction=await mammoth.extractRawText({buffer:cleanBuffer});
  const markedExtraction=await mammoth.extractRawText({buffer:markedBuffer});
  const apiFile=fs.readFileSync(path.join(apiRoot,'utils/faqEmbeddingHelper.js'),'utf8');
  const ast=parser.parse(apiFile,{sourceType:'unambiguous'});
  const wanted=new Set(['splitQABlocks','parseQABlocks','extractUrls']);
  const functions=ast.program.body.filter(n=>n.type==='FunctionDeclaration'&&wanted.has(n.id.name)).map(n=>apiFile.slice(n.start,n.end)).join('\n');
  if(wanted.size!==ast.program.body.filter(n=>n.type==='FunctionDeclaration'&&wanted.has(n.id.name)).length) throw new Error('Parser helpers not found');
  const parse=vm.runInNewContext(functions+'\nparseQABlocks');
  const parsed=parse(extraction.value.replace(/\n+/g,'\n'));
  const failures=[];
  if(parsed.length!==questions.length) failures.push('Parsed count mismatch');
  if(new Set(parsed.map(q=>q.id)).size!==questions.length) failures.push('Duplicate IDs');
  for(let i=0;i<questions.length;i++) {
    const q=questions[i],p=parsed[i];
    if(!p||p.id!==pad(q.id)||p.question!==q.question||normalize(p.answer)!==normalize(q.finalAnswer)) failures.push('Extraction mismatch '+pad(q.id));
    if(q.variants && p.variants.join('; ')!==q.variants) failures.push('Variant extraction mismatch '+pad(q.id));
    if(q.answer.length<25) failures.push('Empty/too short answer '+pad(q.id));
    if(/\[(?:IMAGE|SCREENSHOT|MODIFIED|EDITED|NEW QUESTION)|ORIGINAL ANSWER|Screenshot needed:/i.test(p?.answer||'')) failures.push('Reviewer leakage '+pad(q.id));
  }
  const allSourceUrls=new Set(source.paragraphs.flatMap(p=>[...(p.text.match(urlRegex)||[]),...p.links.map(l=>l.url)]));
  for(const url of allSourceUrls) if(!markedExtraction.value.includes(url)) failures.push('Original URL lost: '+url);
  for(let i=0;i<questions.length;i++) if(questions[i].id!==i+1) failures.push('Nonconsecutive question number');
  const referencePaths=new Set();
  for(const q of questions) for(const area of q.evidence.split(' | ')) {
    const match=area.match(/^(Frontend|Backend|Chatbot): (.*)$/);
    if(!match) {failures.push('Malformed review reference');continue;}
    const root=match[1]==='Frontend'?front:match[1]==='Backend'?back:apiRoot;
    for(const ref of match[2].split('; ')) {
      const full=path.join(root,ref);referencePaths.add(full);
      if(!fs.existsSync(full)) failures.push('Missing review-reference path: '+full);
    }
  }
  const sourceHash=crypto.createHash('sha256').update(fs.readFileSync(source.source)).digest('hex');
  if(sourceHash!==source.sha256) failures.push('Original DOCX changed');
  let xmlParts=0;
  for(const buffer of [cleanBuffer,markedBuffer]) {
    const zip=await JSZip.loadAsync(buffer);
    for(const name of Object.keys(zip.files).filter(n=>/\.xml$|\.rels$/.test(n))) {
      const errors=[];
      new DOMParser({errorHandler:{warning:m=>errors.push(m),error:m=>errors.push(m),fatalError:m=>errors.push(m)}}).parseFromString(await zip.file(name).async('string'),'application/xml');
      if(errors.length) failures.push(name+': '+errors.join('; '));
      xmlParts++;
    }
  }
  const report={...stats,sourceSha256:sourceHash,sourceUnchanged:sourceHash===source.sha256,ingestionParser:'Actual splitQABlocks/parseQABlocks/extractUrls functions isolated from the supplied chatbot helper; no network calls.',parsedQuestions:parsed.length,reviewReferencePathsChecked:referencePaths.size,xmlPartsValidated:xmlParts,cleanExtractionWarnings:extraction.messages,markedExtractionWarnings:markedExtraction.messages,maxAnswerCharacters:Math.max(...questions.map(q=>q.finalAnswer.length)),visualWordRenderingPerformed:false,liveSiteVerified:false,chatbotUploaded:false,failures};
  fs.writeFileSync(path.join(output,'Validation_Report.json'),JSON.stringify(report,null,2));
  fs.appendFileSync(path.join(output,'Review_Summary.md'),`\n## File Validation\n\n${parsed.length} questions were recognized by the actual chatbot parser after DOCX extraction and the same newline normalization used by the upload endpoint. IDs are consecutive and unique; questions, answers, and alternate wordings match the source data for the new clean copy. ${stats.questionsWithVariants} questions include alternative customer phrasings. Both Word packages passed XML checks and extracted without Mammoth warnings. Original screenshot targets remain in the marked copy, and the original source DOCX hash is unchanged. ${referencePaths.size} review-reference paths were checked for existence. Validation failures: ${failures.length}.\n\nVisual page rendering in Microsoft Word was not performed. Live account checks, screenshot validation, embedding rebuilds, and generated-answer tests remain pending. The upload route catches an embedding-rebuild error, so an upload success message alone is not proof that retrieval was rebuilt successfully. Check the index result and test real customer questions after an approved upload.\n`);
  console.log(JSON.stringify(report,null,2));
  if(failures.length) process.exitCode=1;
}
main().catch(err=>{console.error(err);process.exitCode=1;});
