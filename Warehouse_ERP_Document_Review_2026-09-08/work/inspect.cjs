const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const generate = require('@babel/generator').default;
const [mode, ...args] = process.argv.slice(2);
const walk = (n, fn) => { if (!n || typeof n !== 'object') return; if(n.type) fn(n); for(const [k,v] of Object.entries(n)) { if(['loc','comments','tokens','leadingComments','trailingComments','innerComments'].includes(k))continue; if(Array.isArray(v))v.forEach(x=>walk(x,fn));else if(v&&typeof v==='object')walk(v,fn); } };
for (const file of args) {
  const [filename, selector] = file.split('::');
  const content = fs.readFileSync(filename,'utf8');
  console.log('\nFILE '+filename);
  if(mode==='range') {const [start,end]=selector.split('-').map(Number);content.split(/\r?\n/).slice(start-1,end).forEach((line,i)=>console.log(`${start+i}: ${line}`));continue;}
  const ast = parser.parse(content,{sourceType:'unambiguous',plugins:['jsx']});
  const seen=new Set();
  walk(ast,n=>{
    if(mode==='ui') {
      let value;
      if(n.type==='JSXText')value=n.value.replace(/\s+/g,' ').trim();
      if(n.type==='StringLiteral' && /[a-zA-Z]/.test(n.value) && !/className|\.svg$|\.png$/.test(n.value)) {
        const v=n.value;
        if(!/^(?:@\/|\.\/|\.\.\/|https?:\/\/|\/#)/.test(v)&&!/(?:bg-|text-|rounded-|px-|py-|flex |grid |border-|font-)/.test(v))value=v;
      }
      if(value&&value.length>2&&!seen.has(value)){seen.add(value);console.log(n.loc.start.line+': '+value);}
    }
    if(mode==='fn' && (n.type==='FunctionDeclaration'||n.type==='VariableDeclarator')){
      const name=n.id?.name;
      if(name && (!selector||new RegExp(selector,'i').test(name)) && (n.type==='FunctionDeclaration'||/FunctionExpression$/.test(n.init?.type||''))) console.log(n.loc.start.line+': '+generate(n,{comments:false,compact:false}).code);
    }
  });
}
