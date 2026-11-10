/* Headless canvas/DOM smoke test: does not require third-party packages. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('chainfall-mobile/index.html','utf8');
const js=fs.readFileSync('chainfall-mobile/game.js','utf8');
for(const id of ['game','mainMenu','startGame','hud','weaponBar','touchControls','stick','stickNub','retry','deathOverlay','hpFill'])assert(html.includes('id="'+id+'"'),'missing '+id);
for(const name of ['chainblades','greatsword','spear','daggers','hammer','axes','scythe','gauntlets'])assert(fs.existsSync('chainfall-mobile/assets/'+name+'.svg'),'missing icon '+name);
const events=new Map(),elements=new Map();let nextFrame,drawCalls=0;
const context=new Proxy({},{
 get:(o,k)=> k==='createRadialGradient'||k==='createLinearGradient'?()=>({addColorStop(){}}):k==='measureText'?()=>({width:10}):k in o?o[k]:()=>{drawCalls++},
 set:(o,k,v)=>{o[k]=v;return true}
});
const classList=()=>({add(){},remove(){},toggle(){},contains(){return false}});
function el(id){if(!elements.has(id))elements.set(id,{id,style:{},classList:classList(),dataset:{},children:[],textContent:'',innerHTML:'',width:0,height:0,addEventListener(type,fn){this['on_'+type]=fn},appendChild(child){this.children.push(child)},setAttribute(){},setPointerCapture(){},getBoundingClientRect(){return {left:10,top:10,width:100,height:100}},getContext(){return context}});return elements.get(id)}
const doc={getElementById:el,querySelectorAll(sel){return sel==='.overlay'?[el('mainMenu'),el('howOverlay'),el('pauseOverlay'),el('deathOverlay')]:sel==='[data-act]'?['light','heavy','special','jump','dodge'].map(a=>{let x=el('action-'+a);x.dataset.act=a;return x}):[]},querySelector(){return el('specialButton')},createElement(type){return el(type+'-'+Math.random())},addEventListener(type,fn){events.set(type,fn)},hidden:false};
const ls={getItem(){return null},setItem(){}};
const win={devicePixelRatio:1,addEventListener(){},AudioContext:null};
const sandbox={document:doc,window:win,localStorage:ls,location:{protocol:'http:'},navigator:{},performance:{now:()=>1000},requestAnimationFrame:fn=>{nextFrame=fn},console,Math};
vm.runInNewContext(js,sandbox,{filename:'game.js',timeout:1500});
assert(typeof nextFrame==='function','animation loop not started');
for(let i=0;i<5;i++)nextFrame((i+1)*16.6667);
assert(drawCalls>250,'scene was not drawn');
el('startGame').on_click();
assert.equal(el('hud').classList!==undefined,true);
let frames=6;for(let i=0;i<150;i++){nextFrame((frames++)*16.6667);if(i%7===0)el('action-light').on_pointerdown({preventDefault(){}})}
for(let i=0;i<8;i++)el('weaponBar').children[i].on_pointerdown({preventDefault(){}});
el('pause').on_click();el('resume').on_click();
for(let i=0;i<30;i++)nextFrame((frames++)*16.6667);
console.log('CHAINFALL smoke pass:',frames,'frames,',drawCalls,'draw operations, 8 weapons, pause/resume.');