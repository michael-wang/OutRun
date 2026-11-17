import type {Plugin} from 'vite';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

/** Fixed, loopback-only private art endpoint. No binary is copied into dist. */
export function optionBLocalServer():Plugin{
 return {name:'option-b-private-art',apply:'serve',configureServer(server){
  server.middlewares.use('/__local/option-b.glb',async(req,res)=>{
   const address=req.socket.remoteAddress?.replace(/^::ffff:/,'');
   const site=req.headers['sec-fetch-site'];
   let host='';try{host=new URL(`http://${req.headers.host}`).hostname;}catch{/* rejected below */}
   if(req.method!=='GET'||!['127.0.0.1','::1'].includes(address??'')||!['localhost','127.0.0.1','[::1]'].includes(host)||(site&&site!=='same-origin'&&site!=='none')){
    res.statusCode=403;res.end();return;
   }
   try{
    const data=await readFile(resolve(server.config.root,'.local/option-b.glb'));
    res.setHeader('Content-Type','model/gltf-binary');res.setHeader('Cache-Control','no-store');res.end(data);
   }catch{res.statusCode=404;res.end('Local Option B asset not staged');}
  });
 }};
}
