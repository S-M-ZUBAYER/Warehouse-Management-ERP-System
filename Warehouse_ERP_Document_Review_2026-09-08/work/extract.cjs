const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const deps = 'D:/Projects/THT Running Project/Translator-Detect-AiChat server site New with swagger/node_modules/';
const JSZip = require(deps + 'jszip');
const { DOMParser, XMLSerializer } = require(deps + '@xmldom/xmldom');
const source = 'C:/Users/S M Zubayer/Downloads/Warehouse management ERP Question Answers (1).docx';
const dir = __dirname;
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const A = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const nodes = (el, ns, tag) => Array.from(el.getElementsByTagNameNS(ns, tag));
(async () => {
  const bytes = fs.readFileSync(source);
  const zip = await JSZip.loadAsync(bytes);
  const doc = new DOMParser().parseFromString(await zip.file('word/document.xml').async('string'), 'text/xml');
  const relDoc = new DOMParser().parseFromString(await zip.file('word/_rels/document.xml.rels').async('string'), 'text/xml');
  const rels = Object.fromEntries(Array.from(relDoc.documentElement.childNodes).filter(n => n.nodeType === 1).map(n => [n.getAttribute('Id'), {target: n.getAttribute('Target'), type: n.getAttribute('Type'), mode: n.getAttribute('TargetMode')}]));
  const paragraphs = nodes(doc, W, 'p').map((p, index) => ({
    index,
    text: nodes(p, W, 't').map(n => n.textContent).join('').trim(),
    style: nodes(p, W, 'pStyle')[0]?.getAttributeNS(W, 'val') || '',
    links: nodes(p, W, 'hyperlink').map(n => ({text:n.textContent, url:rels[n.getAttributeNS(R,'id')]?.target})),
    images: nodes(p, A, 'blip').map(n => ({rid:n.getAttributeNS(R,'embed'),target:rels[n.getAttributeNS(R,'embed')]?.target})),
    xml: new XMLSerializer().serializeToString(p)
  }));
  const questions=[]; let current=null;
  for (const p of paragraphs) {
    const match = p.text.match(/^Q\s*[-\u2013\u2014]?\s*(\d+)\s*[:.\-]?\s*(.*)/i);
    if (match) { current={id:Number(match[1]),question:match[2],paragraph:p.index,body:[]};questions.push(current); }
    else if(current) current.body.push(p);
  }
  const headings=paragraphs.filter(p=>p.text && !p.text.startsWith('Q-') && (/heading/i.test(p.style)||/^[A-Z]\. /.test(p.text)||p.text.endsWith(':')&&!p.text.startsWith('Answer:'))).map(p=>({index:p.index,style:p.style,text:p.text}));
  const media=Object.keys(zip.files).filter(n=>n.startsWith('word/media/')&&!zip.files[n].dir);
  fs.mkdirSync(path.join(dir,'source-media'),{recursive:true});
  for (const file of media) fs.writeFileSync(path.join(dir,'source-media',path.basename(file)),await zip.file(file).async('nodebuffer'));
  const result={source,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),paragraphs,questions,headings,rels,media};
  fs.writeFileSync(path.join(dir,'source.json'),JSON.stringify(result,null,2));
  fs.writeFileSync(path.join(dir,'source-readable.txt'),paragraphs.filter(p=>p.text||p.images.length).map(p=>`[${p.index}] ${p.text}${p.images.length?' [EMBEDDED IMAGE: '+p.images.map(i=>i.target).join(', ')+']':''}`).join('\n'));
  fs.writeFileSync(path.join(dir,'question-index.txt'),questions.map(q=>`Q-${String(q.id).padStart(3,'0')}: ${q.question}`).join('\n'));
  console.log(JSON.stringify({paragraphs:paragraphs.length,questions:questions.length,first:questions[0]?.id,last:questions.at(-1)?.id,headings,media},null,2));
})();
