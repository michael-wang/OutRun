/** DOM-only overlay compositor for player screenshots.
 * The existing WebGL frame is drawn separately; never attempt to rasterize its
 * canvas through the DOM clone. html2canvas's normal renderer (not foreignObject)
 * keeps the result origin-clean so PNG export works on Chromium and Safari. */
export async function compositeVisibleUi(out:HTMLCanvasElement,sceneCanvas:HTMLCanvasElement):Promise<void>{
 const {default:html2canvas}=await import('html2canvas');
 const width=Math.max(1,document.documentElement.clientWidth);
 const height=Math.max(1,document.documentElement.clientHeight);
 const overlay=await html2canvas(document.body,{
  backgroundColor:null,foreignObjectRendering:false,logging:false,
  useCORS:true,allowTaint:false,imageTimeout:6000,
  width,height,windowWidth:width,windowHeight:height,scrollX:0,scrollY:0,
  scale:out.width/width,
  ignoreElements:element=>element===sceneCanvas||element.id==='view'||element.tagName==='SCRIPT',
  onclone:doc=>{
   // A screenshot must preserve the rendered sea/road underneath the UI.
   // Remove only clone backgrounds; the actual running page is untouched.
   doc.documentElement.style.setProperty('background','transparent','important');
   doc.body.style.setProperty('background','transparent','important');
   doc.getElementById('app')?.style.setProperty('background','transparent','important');
   doc.getElementById('view')?.remove();
  },
 });
 const context=out.getContext('2d');
 if(!context)throw Error('PNG canvas unavailable');
 context.drawImage(overlay,0,0,out.width,out.height);
}
