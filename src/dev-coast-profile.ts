/** Expand accepted dev scenery in memory, never lengthen the user's address bar.
 * Explicit historical beachMacro URLs keep their original diagnostic meaning.
 * Production is unchanged and still subject to the separate private-asset gate. */
export function resolveDevCoast(params:URLSearchParams,dev:boolean){
 const out=new URLSearchParams(params);
 if(!dev||params.get('coast')==='original'||params.has('beachMacro'))return out;
 for(const [key,value] of Object.entries({beachMacro:'right',sunsetRoute:'1',sunSide:'left',beachVista:'1',beachFlow:'1',coastClose:'1',beachPlan:'1',beachLife:'1'}))out.set(key,value);
 return out;
}
