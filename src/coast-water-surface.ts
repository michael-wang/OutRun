export const shoreGLSL=/* glsl */`
uniform sampler2D uShore;
uniform vec4 uShoreBounds;
uniform float uTime;
uniform vec4 uReefAxis; // shoreline start and unit direction in world XZ
uniform vec3 uReefProfile; // alongshore length, wave gain, spray gain
float reefExposure(vec2 xz,float offshore){
 vec2 delta=xz-uReefAxis.xy;
 float along=dot(delta,uReefAxis.zw);
 float across=abs(dot(delta,vec2(-uReefAxis.w,uReefAxis.z)));
 return smoothstep(0.,45.,along)*(1.-smoothstep(uReefProfile.x-45.,uReefProfile.x,along))
       *(1.-smoothstep(100.,155.,across))*smoothstep(0.,5.,offshore)*(1.-smoothstep(27.,52.,offshore));
}
vec4 shoreAt(vec2 xz){return texture(uShore,(xz-uShoreBounds.xy)/uShoreBounds.zw);}
float hash21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise2(vec2 p){
 vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
 return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+1.0),f.x),f.y);
}
float shorePhase(float d,vec2 xz){return d*.46+uTime*1.4+noise2(xz*.035)*1.7+sin(xz.x*.018+xz.y*.012)*.5;}
float shoreWave(float d,vec2 xz){
 float p=shorePhase(d,xz);
 return (sin(p)+.3*sin(2.0*p-.6))*.32*mix(1.,uReefProfile.y,reefExposure(xz,d))*exp(-max(0.0,d)/38.0)*smoothstep(-2.0,2.0,d);
}
`;

export const surfaceGLSL=`
uniform sampler2D uDisp0;
uniform sampler2D uDisp1;
uniform sampler2D uDisp2;
uniform float uSpacing;
uniform float uResolution;
uniform vec2 uGridOrigin;
vec3 displacedVertex(vec3 world, float ring, out float churn){
 float spacing=max(0.35,ring*uSpacing);
 float maxLod=log2(uResolution);
 float l0=clamp(log2(max(1.0,spacing*uResolution/600.0)),0.0,maxLod);
 float l1=clamp(log2(max(1.0,spacing*uResolution/85.0)),0.0,maxLod);
 float l2=clamp(log2(max(1.0,spacing*uResolution/12.0)),0.0,maxLod);
 vec4 d0=textureLod(uDisp0,world.xz/600.0,l0);
 vec4 d1=textureLod(uDisp1,world.xz/85.0,l1);
 vec4 d2=textureLod(uDisp2,world.xz/12.0,l2);
 float fade=1.0-smoothstep(1300.0,2300.0,ring);
 vec4 shore=shoreAt(world.xz);
 float nearshore=smoothstep(0.0,55.0,shore.x);
 vec3 disp=d0.xyz+d1.xyz+d2.xyz;
 // Keep deep-water FFT energy offshore. Bounded waves cannot reach the road.
 disp.y=disp.y/(1.0+abs(disp.y)/.9);
 disp.xz=disp.xz/(1.0+length(disp.xz)/1.2);
 world+=disp*fade*nearshore;
 world.y+=shoreWave(shore.x,world.xz);
 churn=min(d0.w,min(d1.w,d2.w));
 return world;
}
`;

// Sample the rendered triangle, not a continuous wave between sparse far-grid
// vertices. Barycentric weights transport the anchor in XYZ with the same chop.
export const floatGLSL = `${shoreGLSL}
${surfaceGLSL}
uniform vec2 uLastRings;
vec3 gridDelta(vec2 local){
 vec3 base=vec3(uGridOrigin.x+local.x,0.,uGridOrigin.y+local.y);
 float churn;
 return displacedVertex(base,max(1.,length(local)),churn)-base;
}
vec3 floatDelta(vec2 worldXZ){
 vec2 local=worldXZ-uGridOrigin;
 float angle=floor(atan(local.y,local.x)/uSpacing)*uSpacing;
 vec2 a=vec2(cos(angle),sin(angle)),b=vec2(cos(angle+uSpacing),sin(angle+uSpacing));
 float beta=max(0.,(a.x*local.y-a.y*local.x)/sin(uSpacing));
 float radius=max(0.,dot(local,a)+beta*(1.-cos(uSpacing)));
 float lo=0.,hi=.06;
 if(radius>=1.){
  float stepRatio=1.+uSpacing;
  lo=min(uLastRings.y,pow(stepRatio,floor(log(radius)/log(stepRatio))));
  hi=lo>=uLastRings.y*.99999?6500.:lo*stepRatio;
 }else if(radius>=.06){
  lo=min(uLastRings.x,.06*pow(1.23,floor(log(radius/.06)/log(1.23))));
  hi=min(1.,lo*1.23);
 }
 float t=clamp((radius-lo)/(hi-lo),0.,1.);
 if(lo>0. && beta<=lo*(1.-t)){
  float v=beta/lo;
  return (1.-t-v)*gridDelta(lo*a)+v*gridDelta(lo*b)+t*gridDelta(hi*a);
 }
 float v=clamp((beta-lo*(1.-t))/hi,0.,t);
 return (1.-t)*gridDelta(lo*b)+(t-v)*gridDelta(hi*a)+v*gridDelta(hi*b);
}
`;

export function waterRings(segments:number){
 const radii:number[]=[];
 for(let r=.06;r<1;r*=1.23)radii.push(r);
 for(let r=1;r<2400;r*=1+2*Math.PI/segments)radii.push(r);
 radii.push(6500);
 return radii;
}
