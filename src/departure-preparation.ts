/** One bounded preparation pass per departure. Stale completions cannot unlock a new replay. */
export class DeparturePreparation {
 state:'idle'|'warming'|'ready'='idle';
 warning='';
 private generation=0;
 reset(){this.generation++;this.state='idle';this.warning='';}
 begin(task:()=>Promise<unknown>,limitMs=5000){
  if(this.state!=='idle')return Promise.resolve();
  this.state='warming';const generation=this.generation;
  let timer:ReturnType<typeof setTimeout>;
  const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('departure warmup exceeded budget')),limitMs);});
  return Promise.race([Promise.resolve().then(task),timeout]).catch(error=>{
   if(generation===this.generation)this.warning=String(error);
  }).finally(()=>{clearTimeout(timer);if(generation===this.generation)this.state='ready';});
 }
}
