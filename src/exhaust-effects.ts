import * as THREE from 'three';

/** Cosmetic feedback only. Actual transmission state is owned by powertrain.ts. */
export function isHighRevUpshift(previousGear:number,nextGear:number,gas:boolean,brake:boolean,rpmBefore:number){
  return nextGear>previousGear && gas && !brake && rpmBefore>=4200;
}
type Kind='flame'|'spark'|'smoke';
type Particle={kind:Kind;sprite:THREE.Sprite;born:number;life:number;base:THREE.Vector3;size:number;vx:number;vy:number;vz:number;index:number};
const texture=(inner:string,mid:string)=>{
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=64;
  const ctx=canvas.getContext('2d');
  if(!ctx)throw new Error('Unable to create exhaust sprite');
  const grad=ctx.createRadialGradient(32,32,2,32,32,31);
  grad.addColorStop(0,inner);grad.addColorStop(.42,mid);grad.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=grad;ctx.fillRect(0,0,64,64);
  const result=new THREE.CanvasTexture(canvas);
  result.colorSpace=THREE.SRGBColorSpace;
  return result;
};

/** Fixed pool of small billboards. No per-shift mesh, geometry or texture allocation. */
export class ExhaustEffects {
  private readonly particles:Particle[]=[];
  private readonly textures:THREE.CanvasTexture[];
  private bursts=0;
  constructor(private car:THREE.Group){
    const flame=texture('rgba(255,255,231,1)','rgba(255,112,12,.95)');
    const spark=texture('rgba(255,255,208,1)','rgba(255,143,23,.65)');
    const smoke=texture('rgba(208,215,213,.72)','rgba(125,138,144,.34)');
    this.textures=[flame,spark,smoke];
    const add=(kind:Kind,side:number,index:number,tex:THREE.Texture,life:number,size:number,vx:number,vy:number,vz:number)=>{
      const material=new THREE.SpriteMaterial({
        map:tex,transparent:true,depthTest:true,depthWrite:false,opacity:0,
        blending:kind==='smoke'?THREE.NormalBlending:THREE.AdditiveBlending,toneMapped:false,
      });
      const sprite=new THREE.Sprite(material);
      sprite.name='exhaust-'+kind;
      sprite.visible=false;sprite.frustumCulled=false;sprite.renderOrder=kind==='smoke'?2:4;
      const base=new THREE.Vector3(side*.63,.29,-2.59);
      sprite.position.copy(base);this.car.add(sprite);
      this.particles.push({kind,sprite,born:-100,life,base,size,vx,vy,vz,index});
    };
    for(const side of [-1,1]){
      add('flame',side,0,flame,.13,.37,side*.06,.02,-1.25);
      for(let i=0;i<3;i++)add('spark',side,i,spark,.12+i*.018,.09+i*.016,side*(.3+i*.19),.1+i*.14,-1.5-i*.7);
      for(let i=0;i<4;i++)add('smoke',side,i,smoke,.29+i*.055,.22+i*.035,side*((i%2?1:-1)*.14),.42+i*.08,-1.9-i*.3);
    }
  }
  burst(time:number,rpmBefore:number){
    // Shift threshold already guarantees high RPM, but weaker shifts get a smaller burst.
    const intensity=THREE.MathUtils.clamp((rpmBefore-3500)/3700,.25,1);
    this.bursts++;
    for(const p of this.particles){
      p.born=time+(p.kind==='smoke'?p.index*.027:0);
      p.sprite.position.copy(p.base);
      p.sprite.visible=p.kind!=='smoke'||p.index===0;
      p.sprite.userData.intensity=intensity;
    }
  }
  update(time:number,playing:boolean){
    for(const p of this.particles){
      if(!playing){p.born=-100;p.sprite.visible=false;continue;}
      const age=time-p.born;
      if(age<0||age>=p.life){p.sprite.visible=false;continue;}
      const t=age/p.life,intensity=p.sprite.userData.intensity as number;
      p.sprite.visible=true;
      const mat=p.sprite.material;
      if(p.kind==='flame'){
        mat.opacity=(1-t)*(1-t)*intensity;
        const size=p.size*(.9+.8*t)*(.65+.35*intensity);
        p.sprite.scale.set(size,size*.82,1);
      }else if(p.kind==='spark'){
        mat.opacity=(1-t)*.9*intensity;
        const size=p.size*(1-t*.4);
        p.sprite.scale.set(size,size,1);
      }else{
        mat.opacity=Math.sin(Math.PI*t)*.46*intensity;
        const size=p.size*(.75+2*t);
        p.sprite.scale.set(size,size,1);
      }
      p.sprite.position.set(
        p.base.x+p.vx*age,
        p.base.y+p.vy*age,
        p.base.z+p.vz*age,
      );
    }
  }
  reset(){
    for(const p of this.particles){p.born=-100;p.sprite.visible=false;p.sprite.material.opacity=0;}
    this.bursts=0;
  }
  inspect(){
    const visible=(kind:Kind)=>this.particles.filter(p=>p.kind===kind&&p.sprite.visible).length;
    return {bursts:this.bursts,flames:visible('flame'),sparks:visible('spark'),smoke:visible('smoke'),capacity:this.particles.length};
  }
  dispose(){
    for(const p of this.particles){p.sprite.removeFromParent();p.sprite.material.dispose();}
    for(const t of this.textures)t.dispose();
  }
}
