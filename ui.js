// Realm UI design system. All interface icons share this local SVG family.
const paths={
 menu:'<path d="M5 9h22M5 17h22M5 25h22"/>',
 hero:'<rect x="4" y="4" width="24" height="24" rx="3" transform="rotate(45 16 16)" class="icon-gold" stroke-width=".8" fill="var(--ui-pine)"/><path fill="currentColor" stroke="none" d="M16 5 19.4 12.6 27 16 19.4 19.4 16 27 12.6 19.4 5 16 12.6 12.6Z"/>',
 coin:'<circle cx="16" cy="16" r="12"/><circle cx="16" cy="16" r="8.5"/><path fill="currentColor" stroke="none" d="m16 10 4 6-4 6-4-6Z"/>',
 bag:'<path fill="currentColor" stroke="none" d="M7 9q9-4 18 0l2 18q-11 5-22 0Z"/><path d="M12 6V4q4-3 8 0v2"/><path stroke="var(--ui-forest)" d="M6 13q10 10 20 0"/><rect x="13.5" y="15" width="5" height="6" rx="2" fill="currentColor" stroke="var(--ui-forest)"/>',
 cog:'<path fill="currentColor" stroke="none" fill-rule="evenodd" d="m13 2 6 0 1 4 3 1 3-2 4 5-3 3v5l3 3-4 5-4-2-2 1-1 5h-6l-1-5-3-1-3 2-4-5 3-3v-5L2 10l4-5 3 2 3-1Zm3 8a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z"/>',
 quest:'<path class="icon-gold" fill="currentColor" stroke="none" d="m16 1 15 15-15 15L1 16Z"/><path stroke="var(--ui-forest)" stroke-width="3" d="M16 8v10m0 5v.2"/>',
 book:'<path fill="currentColor" stroke="none" d="M3 5q7-2 12 1v23q-5-4-12-2Zm26 0q-7-2-12 1v23q5-4 12-2Z"/>',
 pin:'<path fill="currentColor" stroke="none" fill-rule="evenodd" d="M16 2a10 10 0 0 0-10 10c0 7 10 18 10 18s10-11 10-18A10 10 0 0 0 16 2Zm0 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/>',
 expand:'<path d="M5 12V5h7M20 5h7v7M27 20v7h-7M12 27H5v-7M5 5l7 7m8 8 7 7M27 5l-7 7M12 20l-7 7"/>',
 talk:'<path fill="currentColor" stroke="none" d="M5 3h22q3 0 3 3v17q0 3-3 3H14l-8 6v-6H5q-3 0-3-3V6q0-3 3-3Z"/><g fill="var(--ui-forest)" stroke="none"><circle cx="9" cy="14" r="2"/><circle cx="16" cy="14" r="2"/><circle cx="23" cy="14" r="2"/></g>',
 heal:'<path fill="currentColor" stroke="none" d="M11 2h10v9h9v10h-9v9H11v-9H2V11h9Z"/>',
 shield:'<path d="M16 2Q10 7 4 6v11q2 9 12 14 10-5 12-14V6Q22 7 16 2Z"/><path fill="currentColor" stroke="none" d="M16 4v25q9-5 10-13V8q-6 0-10-4Z"/>',
 attack:'<g fill="currentColor" stroke="none"><path d="m3 2 6 3 16 18-3 3L5 9Zm26 0-6 3L7 23l3 3L27 9Z"/></g><path d="m18 26 9-9M5 17l9 9M23 24l7 8M9 24l-7 8" stroke-width="2.5"/>',
 run:'<circle cx="23" cy="5" r="3.5" fill="currentColor" stroke="none"/><path stroke-width="3.5" d="m5 9 7-3 8 7 7 1M16 10l-6 8 9 4-4 8M10 18l-7 9"/>',
 switch:'<path d="M4 10h23l-5-5M28 22H5l5 5M4 10l5 5M28 22l-5-5"/>',
 chevron:'<path d="m12 7 9 9-9 9"/>',close:'<path d="m8 8 16 16M24 8 8 24"/>',plus:'<path d="M16 5v22M5 16h22"/>',minus:'<path d="M5 16h22"/>',
 sword:'<path fill="var(--item-blade,var(--ui-steel))" stroke="var(--ui-steel-edge)" d="m11 22 13-17 6-3-2 7-14 16Z"/><path d="m13 22 13-16" stroke="var(--ui-ivory)"/><path d="m7 21 8 7" stroke="var(--ui-gold)" stroke-width="2.5"/><path d="m11 25-7 7" stroke="var(--ui-leather)" stroke-width="4"/>',
 armour:'<path d="m10 4-7 5 4 7 3-2v14h12V14l3 2 4-7-7-5q-6 6-12 0Z" fill="var(--ui-steel)"/><path d="M16 9v16"/>',
 potion:'<path d="M12 3h8M13 4v7q-8 5-7 13 1 6 10 6t10-6q1-8-7-13V4"/><path fill="var(--ui-mint)" stroke="none" d="M9 20q7-3 14 0v4q-1 4-7 4t-7-4Z"/>',
 gem:'<path d="m3 12 7-8h12l7 8-13 18Z M3 12h26M10 4l6 26 6-26"/>',
 key:'<circle cx="11" cy="10" r="7"/><path d="m16 15 12 13m-6-6 4-4m-1 7 4-4"/>',
 tooth:'<path fill="currentColor" d="M7 4q9-5 18 1-1 19-20 25 9-12 2-26Z"/>',
 crate:'<path d="M4 6h24v23H4ZM4 6l24 23M4 29 28 6M4 10h24"/>',
 relic:'<path d="m16 2 12 14-12 14L4 16Z M16 8v16M10 16h12"/>',
 party:'<circle cx="12" cy="10" r="5"/><path d="M2 29v-4q0-10 10-10t10 10v4M22 5q9 0 6 9m-3 4q6 2 5 11"/>'
};
export function icon(name,extra=''){return `<svg class="ui-icon ${extra}" viewBox="0 0 32 34" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name]||paths.relic}</svg>`}
export function itemIcon(id,item){return icon(item.type==='weapon'?'sword':item.type==='armour'?'armour':item.type==='consumable'?'potion':id==='tooth'?'tooth':id.includes('key')?'key':id==='supplies'?'crate':id==='gem'?'gem':'relic')}
export function installUI(api){
 const {$,living}=api;document.body.classList.add('quiet-hud');
 try{document.body.classList.toggle('mini-visible',localStorage.getItem('realm-ui-minimap')==='on')}catch{}
 document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
 for(const [id,it]of Object.entries(api.items))it.icon=itemIcon(id,it);
 const button=(id,name,label)=>{const el=$(id);el.innerHTML=icon(name)+`<span>${label}</span>`;el.setAttribute('aria-label',label)};
 for(const [id,name,label]of [['bag-touch','bag','Satchel'],['pause-touch','menu','Menu'],['attack-touch','attack','Attack'],['block-touch','shield','Block'],['potion-touch','heal','Heal'],['dodge-touch','run','Dodge']])button(id,name,label);
 $('hud').append(document.querySelector('.touch-top'));$('hud').append($('pickup-touch'));
 $('pickup-touch').className='context-action';$('pickup-touch').innerHTML=icon('talk')+'<span id="context-label"></span><i class="context-diamond"></i>';
 $('equipment-switch').onclick=api.inventory;$('hint').classList.add('sr-only');
 $('journal-button').innerHTML=icon('book')+'<span>Journal / Map</span>'+icon('chevron');
 const mini=$('frontier-mini');mini.append(document.querySelector('.location'));
 $('mini-map').innerHTML=icon('expand');$('mini-map').setAttribute('aria-label','Expand world map');
 $('mini-north').textContent='N';$('mini-north').setAttribute('aria-label','Toggle north-up minimap');
 $('mini-out').classList.add('sr-only');$('mini-out').tabIndex=-1;$('mini-in').tabIndex=-1;$('potion').tabIndex=-1;$('mini-in').classList.add('sr-only');$('map-bearing').classList.add('sr-only');
 for(const n of living.npcs){n.label.replaceChildren();n.label.insertAdjacentHTML('beforeend',icon('talk'));const text=document.createElement('span'),name=document.createElement('strong'),role=document.createElement('small');name.textContent=n.name;role.textContent=n.role;text.append(name,role);n.label.append(text);}
 function journeyMenu(){
  api.modal(api.getNet()?.active?'Journey · Online':'Journey','<div class="journey-summary" id="journey-summary"></div><div class="journey-objective"><div class="eyebrow">Current objective</div><p id="journey-objective"></p></div><div class="journey-grid" id="journey-grid"></div><button id="toggle-minimap" class="hud-preference"></button><button id="resume" class="primary journey-resume">Return to the world</button>','journey');
  const p=api.player,weapon=api.items[p.weapon],armour=api.items[p.armour];
  $('journey-summary').textContent=`Level ${p.level} · ${Math.ceil(p.hp)} / ${p.maxHp} HP · ${p.xp} / ${45+(p.level-1)*25} XP · ${p.coins} gold`;
  const gear=document.createElement('p');gear.className='journey-gear';gear.textContent=`${weapon?.name||'Unarmed'} · ${4+p.level*2+(weapon?.damage||0)} ATK / ${armour?.defence||0} DEF`;$('journey-summary').append(gear);
  $('journey-objective').textContent=$('objective').textContent;
  for(const [id,label,symbol,action]of [['journey-equipment','Equipment','bag',api.inventory],['journey-journal','Quests','book',living.journal],['journey-map','World map','pin',living.worldMap],['menu-settings','Settings','cog',api.settingsMenu],['journey-party','Multiplayer','party',()=>api.getNet()?.lobby()],['journey-options','Journey options','hero',api.systemPause],['menu-controls','Controls','run',api.controls]]){
   const b=document.createElement('button');b.id=id;b.innerHTML=icon(symbol)+`<span>${label}</span>`;b.onclick=action;if(id==='journey-party')b.disabled=!api.getNet();$('journey-grid').append(b);
  }
  const toggle=$('toggle-minimap'),sync=()=>{const on=document.body.classList.contains('mini-visible');toggle.textContent='Minimap on HUD · '+(on?'On':'Off');toggle.setAttribute('aria-pressed',String(on))};sync();toggle.onclick=()=>{document.body.classList.toggle('mini-visible');try{localStorage.setItem('realm-ui-minimap',document.body.classList.contains('mini-visible')?'on':'off')}catch{}sync()};
  $('resume').onclick=api.closeModal;
 }
 let lastGold=null,lastQuest='',lastWeapon='';
 function flash(el){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;el.animate([{filter:'brightness(1.35)'},{filter:'brightness(1)'}],{duration:300})}
 function update(){
  const p=api.player;if(!p)return;
  $('level').textContent='Lv '+p.level;$('stamtext').textContent=(api.blocking?'Blocking ':api.guardBreak>0?'Recovering ':'Stamina ')+Math.floor(p.stamina)+' / 100';
  $('gold-counter').classList.toggle('gold-large',String(p.coins).length>4);
  if(lastGold!==p.coins){if(lastGold!==null)flash($('gold-counter'));lastGold=p.coins}
  const data=living.serialize(),q=living.questDefinitions.find(q=>q.id===data.tracked&&data.quests[q.id]?.status==='active')||living.questDefinitions.find(q=>data.quests[q.id]?.status==='active');
  $('quest-title').textContent=q?.name||'A Kingdom Reclaimed';const quest=$('objective').textContent;if(lastQuest&&lastQuest!==quest)flash(document.querySelector('.quest'));lastQuest=quest;
  const prompt=$('hint').classList.contains('hidden')?'':$('hint').textContent.replace(/^(Interact · |E · )/,'');
  $('pickup-touch').classList.toggle('hidden',!prompt||!!api.panel);$('context-label').textContent=prompt;
  const potions=p.inventory.find(i=>i.id==='potion')?.qty||0;$('potion-touch').disabled=!potions;$('potion-touch').setAttribute('aria-label',`Heal · ${potions} potions`);$('potion-touch').querySelector('span').textContent='Heal · '+potions;$('potion-touch').title=potions?`${potions} potions`:'No potions';
  const restricted=p.stamina<25||api.guardBreak>0||api.dodgeCooldown>0;$('dodge-touch').setAttribute('aria-disabled',String(restricted));$('dodge-touch').classList.toggle('unavailable',restricted);$('dodge-touch').style.setProperty('--cooldown',Math.min(1,Math.max(api.dodgeCooldown/1.05,api.guardBreak>0?1:0))*360+'deg');$('dodge-touch').title=p.stamina<25?'Requires 25 stamina':api.dodgeCooldown>0?'Dodge recovering':'Dodge';
  $('block-touch').classList.toggle('held',api.blocking);
  if(lastWeapon!==p.weapon){lastWeapon=p.weapon;const it=api.items[p.weapon];$('equipped-icon').innerHTML=it?itemIcon(p.weapon,it):icon('sword');$('equipped-icon').style.setProperty('--item-blade',it?.color?'#'+it.color.toString(16).padStart(6,'0'):'var(--ui-steel)')}
  document.body.classList.toggle('menu-open',!!api.panel);
  const taken=[],avoid=[...document.querySelectorAll('.hero-card,.quest,#frontier-mini,.touch-top,#gold-counter')].map(el=>el.getBoundingClientRect());
  const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
  for(const n of [...living.npcs].sort((a,b)=>a.root.position.distanceToSquared(api.hero.root.position)-b.root.position.distanceToSquared(api.hero.root.position))){const d=n.root.position.distanceTo(api.hero.root.position),r=n.label.getBoundingClientRect();const visible=!api.panel&&n.label.style.display!=='none'&&d<7&&!avoid.some(a=>overlaps(r,a))&&!taken.some(a=>overlaps(r,a));n.label.style.visibility=visible?'visible':'hidden';n.label.style.opacity=Math.min(1,Math.max(0,(7-d)/3));n.label.classList.toggle('has-quest',living.questDefinitions.some(q=>q.giver===n.id&&data.quests[q.id]?.status!=='claimed'));if(visible)taken.push(r)}
 }
 function menu(){
  $('close-modal').innerHTML=icon('close');document.body.classList.add('menu-open');
  if(api.panel==='map'){const bar=document.createElement('div');bar.className='map-tools';for(const [id,label,symbol]of [['mini-out','Minimap zoom out','minus'],['mini-in','Minimap zoom in','plus'],['mini-north','Toggle north-up','pin']]){const b=document.createElement('button');b.innerHTML=icon(symbol);b.setAttribute('aria-label',label);b.onclick=()=>$(id).click();bar.append(b)}$('modal').append(bar)}
 }
 return{update,menu,journeyMenu};
}
