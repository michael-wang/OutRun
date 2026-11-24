import {afterEach,expect,it} from 'vitest';
import {coastWireAttachment,coastWirePoint,coastWireSpanRenderable,buildCoastUtilityWires} from '../src/coast-roadside-geometry';
import {coastPoleLinks,COAST_WIRE_ACROSS,COAST_WIRE_TIP_DROP} from '../src/coast-roadside-layout';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
import {setBeach2,beach2PreviousShore,beach2Shore,beach2Ground} from '../src/beach2-profile';
import {coastBeachHeight} from '../src/scenery-cross-section';
import {setBeachMacro,setSunsetRoute,setSunSide,setBeachVista,setBeachFlow,setCoastClose,setBeachPlan,setBeachLife} from '../src/beach-macro';
function setup(){setBeachMacro('right');setSunsetRoute(true);setSunSide('left');setBeachVista(true);setBeachFlow(true);setCoastClose(true);setBeachPlan(true);setBeachLife(true);setBeach2(true);return coastWorkerRoad().track;}
afterEach(()=>{setBeach2(false);setBeachMacro('none');setSunsetRoute(false);setSunSide(null);setBeachVista(false);setBeachFlow(false);setCoastClose(false);setBeachPlan(false);setBeachLife(false);});
it('spans join real insulator tips and stay horizontally straight through the entry bend',()=>{
 const t=setup();for(const l of coastPoleLinks(4500,6200))for(const a of COAST_WIRE_ACROSS){
  const A=coastWireAttachment(t.sample,l.from,a),B=coastWireAttachment(t.sample,l.to,a);
  for(const [pole,P] of [[l.from,A],[l.to,B]] as const){const p=t.sample(pole.d),base=p.position.clone().addScaledVector(p.right,pole.x);expect(P[0]).toBeCloseTo(base.x+Math.cos(-p.roadHeading)*a,9);expect(P[2]).toBeCloseTo(base.z-Math.sin(-p.roadHeading)*a,9);expect(P[1]).toBeCloseTo(coastBeachHeight(pole.x,p.position.y,p.right.y,pole.d)+pole.height-COAST_WIRE_TIP_DROP,9);}
  expect(coastWirePoint(t.sample,l.from,l.to,a,l.from.d)).toEqual(A);expect(coastWirePoint(t.sample,l.from,l.to,a,l.to.d)).toEqual(B);
  for(let j=0;j<=20;j++){const u=j/20,P=coastWirePoint(t.sample,l.from,l.to,a,l.from.d+(l.to.d-l.from.d)*u);expect(P[0]).toBeCloseTo(A[0]+u*(B[0]-A[0]),9);expect(P[2]).toBeCloseTo(A[2]+u*(B[2]-A[2]),9);expect(P[1]).toBeLessThanOrEqual(A[1]+u*(B[1]-A[1])+1e-9);}
 }
});
it('chunk clipping retains identical boundary vertices and physical span endpoints',()=>{
 const t=setup(),left=buildCoastUtilityWires(t.sample,4000,5000)!,right=buildCoastUtilityWires(t.sample,5000,6000)!;
 const a=coastPoleLinks(4000,5000).at(-1)!,b=coastPoleLinks(5000,6000)[0];expect(a.from).toEqual(b.from);expect(a.to).toEqual(b.to);
 for(const across of COAST_WIRE_ACROSS){const P=coastWirePoint(t.sample,a.from,a.to,across,5000);for(const g of [left,right]){const v=g.getAttribute('position');let found=false;for(let i=0;i<v.count;i++)if(Math.abs(v.getX(i)-P[0])<.001&&Math.abs(v.getZ(i)-P[2])<.001&&Math.abs(Math.abs(v.getY(i)-P[1])-.018)<.001)found=true;expect(found).toBe(true);}}
 left.dispose();right.dispose();
});
it('adds two genuinely dry widths while preserving the near-swimming cove and road edge',()=>{
 const t=setup();for(const d of [5250,5450]){const p=t.sample(d),old=beach2PreviousShore(d),next=beach2Shore(d);expect(old-next).toBeGreaterThanOrEqual(20);expect(old-next).toBeLessThanOrEqual(35);for(let x=next+4;x<old;x+=2)expect(coastBeachHeight(x,p.position.y,p.right.y,d)).toBeGreaterThan(-5);expect(beach2Ground(-10,d,p.position.y,p.right.y,123)).toBe(123);}
 for(const d of [5620,5650,5680])expect(beach2Shore(d)).toBe(beach2PreviousShore(d));
 for(let d=5000;d<5650;d++){expect(Math.abs(beach2Shore(d+.01)-beach2Shore(d-.01))).toBeLessThan(.025);}
});

it('preserves safely overhead road crossings and rejects terrain-contacting spans',()=>{const t=setup();for(const l of coastPoleLinks(4500,6000))expect(coastWireSpanRenderable(t.sample,l.from,l.to)).toBe(true);const l=coastPoleLinks(8909,9000)[0];expect(coastWireSpanRenderable(t.sample,l.from,l.to)).toBe(true);const geo=buildCoastUtilityWires(t.sample,l.from.d+.01,l.to.d-.01);expect(geo).not.toBeNull();geo?.dispose();expect(coastWireSpanRenderable(t.sample,{...l.from,height:.1},{...l.to,height:.1})).toBe(false);});
