// localStorage.setItem is atomic. The optional rolling backup must never prevent
// the current outbox from being saved; distinct historical recovery copies survive.
export function writeAccountCache(storage,key,data){
 const old=storage.getItem(key);
 try{storage.setItem(key,data)}catch(error){
  const backup=storage.getItem(key+':backup');
  // Reclaim only a byte-identical duplicate, never another character or revision.
  if(backup!==null&&(backup===old||backup===data)){storage.removeItem(key+':backup');storage.setItem(key,data)}
  else throw error;
 }
 if(old&&old!==data){try{storage.setItem(key+':backup',old)}catch{/* Current durable outbox succeeded; keep any existing backup. */}}
 return true;
}
