// Home-region difficulty: pulling an enemy across a boundary never changes its stats.
export function regionTier(e){
 if(e.prologue!==undefined&&e.prologue!==null)return 0;
 const x=e.home?.x??e.x,z=e.home?.z??e.z;
 if(x>200)return ({roots:3,sunken:4,frost:5,forge:6})[e.dungeon]||2;
 if(z<-240)return 5;
 if(z<-150||x<-200)return 4;
 if(z<-70)return 3;
 if(z<10||Math.abs(x)>90)return 2;
 return 1;
}
export function regionalStats(e,hp,damage){const tier=regionTier(e);return {tier,hp:Math.round(hp*(1+tier*.22)),damage:Math.round(damage*(1+tier*.1))}}
export function staggerEnemy(e,heavy,heavyDuration){
 const boss=e.type===3||e.isBoss||e.guardian,committed=e.state==='attack'&&e.attack&&e.attack.t/e.attack.duration>.22;
 if(e.poiseRecovery>0||committed||(boss&&!heavy))return false;
 e.stagger=heavy?heavyDuration:.16;e.poiseRecovery=e.stagger+(boss?2.8:1.6);e.state='stagger';e.cooldown=Math.max(e.cooldown,.35);return true;
}
