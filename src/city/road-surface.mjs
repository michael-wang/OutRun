// Distances are metres along City Expressway. Age changes by maintenance section,
// with a short blend at each crew boundary to avoid a seam across triangles.
const paintRuns = [
  [0, .58], [1180, .13], [2190, .82], [4160, .08], [5640, .42], [6500, .21]
];
export function paintAge(at) {
  let age = paintRuns[0][1];
  for (let i=1; i<paintRuns.length; i++) {
    const [start,next] = paintRuns[i];
    if (at <= start) break;
    const t = Math.min(1, (at-start)/32);
    age += (next-age) * t*t*(3-2*t);
  }
  return age;
}

export function finishCityAsphalt(material, tile, zones, laneWidth) {
  material.onBeforeCompile = shader => {
    shader.uniforms.asphaltTile = {value:tile};
    shader.vertexShader = 'attribute vec4 roadCoord; varying vec4 surfaceMetres;\n' +
      shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nsurfaceMetres = roadCoord;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
      uniform sampler2D asphaltTile;
      varying vec4 surfaceMetres;
      float stone(vec2 uv) {return dot(texture2D(asphaltTile,uv).rgb,vec3(.21,.72,.07));}
      float repair(vec2 st,vec2 center,vec2 halfSize){
        vec2 margin=halfSize-abs(st-center);
        return smoothstep(-.20,.32,min(margin.x,margin.y));
      }
    `).replace('#include <color_fragment>', `#include <color_fragment>
      vec2 st=surfaceMetres.xy;
      float x=st.x,d=st.y;
      // A single mipmapped aggregate photograph, sampled at different scales
      // and orientations. Even the largest blend is fixed to the road.
      vec2 skew=mat2(.80,-.60,.60,.80)*st;
      float mineral=stone(skew*.64);
      float scatter=stone(st*vec2(.117,.093)+vec2(.31,.53));
      float weather=stone(skew*vec2(.033,.024)+vec2(.14,.78));
      if(surfaceMetres.z>.5){
        float textureGain=clamp(1.+(mineral-.226)*2.65+(scatter-.226)*2.85+(weather-.226)*1.15,.52,1.62);
        float lane=mod(x+.12*sin(d*.038)+.32*(weather-.226),${laneWidth.toFixed(2)})-${(laneWidth/2).toFixed(2)};
        float tyre=1.-smoothstep(.18,.84,abs(abs(lane)-.96));
        diffuseColor.rgb*=vec3(1.04,1.015,.975)*textureGain*(1.-tyre*(.065+.32*scatter));
        // Local utility cuts at the market and station, and one resurfaced
        // stretch on the park approach. No repeating patch lattice or crack lines.
        float service=repair(st,vec2(-2.8,2248.),vec2(.76,2.6))
                     +repair(st,vec2(3.3,6481.),vec2(.92,3.8));
        float resurfaced=smoothstep(1120.,1123.,d)*(1.-smoothstep(1203.,1207.,d));
        diffuseColor.rgb*=1.-.15*service-.095*resurfaced;
        float deck=smoothstep(4320.,4430.,d)*(1.-smoothstep(5570.,5680.,d));
        float expansion=abs(mod(d+7.,41.)-20.5);
        float deckJoint=1.-smoothstep(.054,.054+max(.03,fwidth(d)),expansion);
        diffuseColor.rgb*=mix(vec3(1.),vec3(.89,.98,1.08)*(1.-.39*deckJoint),deck);
        float outerEdge=${(laneWidth*2).toFixed(2)};
        ${zones.map(([a,b,side,delta])=>`outerEdge+=${(delta*laneWidth).toFixed(2)}*step(0.,x*${side.toFixed(1)})*smoothstep(${a}.,${a+115}.,d)*(1.-smoothstep(${b-100}.,${b}.,d));`).join('\n')}
        float gutter=smoothstep(outerEdge-.64,outerEdge-.18,abs(x));
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.15,.14,.12)*(.84+.66*scatter),gutter*.62);
      }else{
        // Painted geometry retains all original line widths, dash gaps and arrows.
        // W is the signed distance across a stripe normalized to its half-width.
        // Keep a continuous readable centre, especially on yellow boundaries.
        float age=-surfaceMetres.z;
        float rim=smoothstep(.40,.98,abs(surfaceMetres.w));
        float worn=age*(.43+1.18*scatter+.17*rim);
        float chip=smoothstep(.24,.35,mineral+.2*(scatter-.22))*rim*age;
        float cover=clamp(.98-worn-.44*chip,.24,1.);
        diffuseColor.rgb=mix(vec3(.084,.087,.085)*(.7+scatter),diffuseColor.rgb,cover);
      }
    `);
  };
  material.customProgramCacheKey=()=>'city-asphalt';
}
