// Keep approved artwork in the initial HTML, independent of game initialization.
const fallback=document.getElementById('startup-fallback')!;
const timeout=setTimeout(()=>{if(!document.documentElement.dataset.driveMode)fallback.hidden=false;},120000);
import('./main').then(()=>clearTimeout(timeout)).catch(error=>{
 clearTimeout(timeout);fallback.hidden=false;console.error('Game startup failed',error);
});
