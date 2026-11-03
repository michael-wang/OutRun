"""Fit the new fixed road to the saved terrain-first sculpt (not old terrain).
Initial road fitting and surface treatment. Run against the Gate A .blend.
"""
import bpy,bmesh,json,math
from pathlib import Path
from mathutils import Vector,kdtree,noise
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'art-prototype/output/terrain-first'
data=json.loads((ROOT/'src/terrain-first-road.json').read_text());ref=json.loads((ROOT/'art-prototype/output/roadlock-road-reference.json').read_text())
scene=bpy.context.scene
def cv(p):return (p[0],-p[2],p[1])
def col(name):c=bpy.data.collections.new(name);scene.collection.children.link(c);return c
support=col('30_BRIDGE_AND_ROAD_EDGES');reference=col('00_REFERENCE_DO_NOT_EXPORT');cameras=col('91_GAME_CHASE')
def mesh(name,v,f,c,material):
 me=bpy.data.meshes.new(name);me.from_pydata([cv(p) for p in v],[],f);me.update();o=bpy.data.objects.new(name,me);c.objects.link(o);me.materials.append(material);return o
def material(name,color,rough=.9):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;return m
asphalt=material('REFERENCE asphalt',(.045,.044,.04));paint=material('REFERENCE white paint',(.84,.82,.70));concrete=material('Weathered sandstone concrete',(.27,.22,.17));metal=material('Weathered bridge steel',(.16,.135,.105),.65)
frames=data['frames'];kd=kdtree.KDTree(len(frames))
for i,p in enumerate(frames):kd.insert((p[1],-p[3],0),i)
kd.balance()
def road_at(v):
 _,i,_=kd.find((v.x,v.y,0));a=frames[max(0,i-1)];b=frames[min(len(frames)-1,i+1)]
 dx,dz=b[1]-a[1],b[3]-a[3];t=max(0,min(1,((v.x-a[1])*dx+(-v.y-a[3])*dz)/(dx*dx+dz*dz)))
 p=[a[j]+(b[j]-a[j])*t for j in range(6)];h=p[4];off=-(v.x-p[1])*math.cos(h)-(-v.y-p[3])*math.sin(h)
 distance=math.hypot(v.x-p[1],-v.y-p[3]);return p,off,distance
land=bpy.data.objects['Connected canyon with two eroded rims'];bpy.context.view_layer.objects.active=land
# Visual revision 2: two deliberate broad sculpt depressions open the sightlines
# to the existing river. They follow the basin, not a pair of road extrusions.
for v in land.data.vertices:
 x,z,y=v.co.x,-v.co.y,v.co.z
 a=math.exp(-((x-45)/155)**2-((z-425)/235)**2)
 b=math.exp(-((x+180)/145)**2-((z-860)/190)**2)
 v.co.z-=max(0,min(1,(y-60)/90))*(62*a+80*b)
river=bpy.data.objects['Continuous meandering river']
for i in range(0,len(river.data.vertices),2):
 a,b=river.data.vertices[i:i+2];mid=(a.co+b.co)*.5
 widen=1.65-.5*math.exp(-((-mid.y-780)/150)**2)
 a.co.x=mid.x+(a.co.x-mid.x)*widen;b.co.x=mid.x+(b.co.x-mid.x)*widen
 a.co.z+=1.8;b.co.z+=1.8
mod=land.modifiers.new('Gentle sculpt surface relax','SMOOTH');mod.factor=.35;mod.iterations=3;bpy.ops.object.modifier_apply(modifier=mod.name)
# Refine only the already existing terrain near the future road, then cut/fill
# a narrow shelf. The canyon, river and distant rims remain independent.
bm=bmesh.new();bm.from_mesh(land.data)
for _ in range(2):
 edges=[e for e in bm.edges if road_at((e.verts[0].co+e.verts[1].co)*.5)[2]<32]
 bmesh.ops.subdivide_edges(bm,edges=edges,cuts=1,use_grid_fill=True)
bm.to_mesh(land.data);bm.free()
bridge_start,bridge_end=data['bridge']
for v in land.data.vertices:
 p,off,dist=road_at(v.co)
 if bridge_start+7<p[0]<bridge_end-7:continue
 if dist>32:continue
 target=p[2]-math.tan(p[5])*off-.18
 t=max(0,min(1,(dist-12)/20));blend=t*t*(3-2*t)
 v.co.z=target*(1-blend)+v.co.z*blend
land.data.update()
# Interpolated vertex sediment colors eliminate the previous per-face sawteeth.
rock=material('Vertex blended sedimentary sandstone',(.4,.19,.08));node=rock.node_tree.nodes.new('ShaderNodeVertexColor');node.layer_name='COLOR_0';rock.node_tree.links.new(node.outputs['Color'],rock.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
tex=rock.node_tree.nodes.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=2.3;tex.inputs['Detail'].default_value=3
bump=rock.node_tree.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.3;bump.inputs['Distance'].default_value=.2;rock.node_tree.links.new(tex.outputs['Fac'],bump.inputs['Height']);rock.node_tree.links.new(bump.outputs['Normal'],rock.node_tree.nodes.get('Principled BSDF').inputs['Normal'])
land.data.materials.clear();land.data.materials.append(rock)
for p in land.data.polygons:p.material_index=0;p.use_smooth=True
attr=land.data.color_attributes.new(name='COLOR_0',type='FLOAT_COLOR',domain='POINT')
stops=[(0,(.26,.085,.04)),(6,(.36,.15,.065)),(25,(.43,.20,.09)),(36,(.47,.25,.13)),(42,(.64,.42,.23)),(48,(.44,.23,.12)),(67,(.30,.11,.055)),(76,(.26,.085,.04))]
for v,c in zip(land.data.vertices,attr.data):
 band=(v.co.z+4*math.sin(v.co.y*.007)+2*noise.noise_vector(v.co/90).x)%76
 for (a,ca),(b,cb) in zip(stops,stops[1:]):
  if band<=b:
   t=(band-a)/(b-a);c.color=tuple(ca[k]+(cb[k]-ca[k])*t for k in range(3))+(1,);break

def ribbon(name,rows,left,right,lift,mat,c,dashed=False):
 v=[];f=[]
 for p in rows:
  for offset in [left,right]:v.append((p[1]-math.cos(p[4])*offset,p[2]-math.tan(p[5])*offset+lift,p[3]-math.sin(p[4])*offset))
 for i in range(len(rows)-1):
  if not dashed or rows[i][0]%6<3:f.append((2*i,2*i+1,2*i+3,2*i+2))
 return mesh(name,v,f,c,mat)
ribbon('REFERENCE four lane road',frames,-7,7,.015,asphalt,reference)
for off in [-3.5,0,3.5]:ribbon('REFERENCE dashed white',frames,off-.12,off+.12,.04,paint,reference,True)
for off in [-6.6,6.6]:ribbon('REFERENCE edge white',frames,off-.08,off+.08,.04,paint,reference)
bf=[p for p in frames if bridge_start<=p[0]<=bridge_end]
v=[]
for p in bf:
 for side,drop in [(-12,-.18),(12,-.18),(-12,-3.8),(12,-3.8)]:v.append((p[1]-math.cos(p[4])*side,p[2]-math.tan(p[5])*side+drop,p[3]-math.sin(p[4])*side))
f=[]
for i in range(len(bf)-1):
 a=i*4;b=a+4
 f.extend([(a,b,b+1,a+1),(a+2,a+3,b+3,b+2),(a,a+2,b+2,b),(a+1,b+1,b+3,a+3)])
f.extend([(0,1,3,2),(len(v)-4,len(v)-2,len(v)-1,len(v)-3)])
mesh('Narrows bridge box girder',v,f,support,concrete)
def box(name,center,scale,mat):
 bpy.ops.mesh.primitive_cube_add(size=1,location=cv(center));o=bpy.context.object;o.name=name;o.scale=(scale[0],scale[2],scale[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 for c in list(o.users_collection):c.objects.unlink(o)
 support.objects.link(o);o.data.materials.append(mat);return o
# A pair of piers clear of the river; foundations land on the unaltered talus.
for fraction in [.23,.77]:
 p=bf[int((len(bf)-1)*fraction)];z=p[3];bottom=38
 box('Bridge pier', (p[1],(p[2]-4+bottom)/2,z),(5,p[2]-4-bottom,13),concrete)
for p in frames[::12]:
 if not 340<=p[0]<=350+data['routeLength']+60:continue
 for side in [-10.7,10.7]:
  box('Road edge support post',(p[1]-math.cos(p[4])*side,p[2]-math.tan(p[5])*side+.45,p[3]-math.sin(p[4])*side),(.16,1.35,.16),metal)
for spec in ref['cameras']:
 c=bpy.data.cameras.new(spec['name']);o=bpy.data.objects.new(spec['name'],c);cameras.objects.link(o);o.location=cv(spec['eye']);o.rotation_euler=(Vector(cv(spec['look']))-o.location).to_track_quat('-Z','Y').to_euler();c.lens=36/(2*math.tan(math.radians(spec['horizontalFov'])/2));c.sensor_width=36;c.clip_end=2200
scene['road_source']='src/terrain-first-road.json';scene['visual_revision']=2
text=bpy.data.texts.new('FIXED_ROAD.json');text.write(json.dumps(data))
scene.camera=bpy.data.objects['H1_Reveal'];scene.render.resolution_x=1920;scene.render.resolution_y=1080;scene.render.resolution_percentage=100
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Grand_Canyon_Terrain_First.blend'))
for spec in ref['cameras']:
 scene.camera=bpy.data.objects[spec['name']];scene.render.filepath=str(OUT/(spec['name']+'.png'));bpy.ops.render.render(write_still=True)
# Refresh terrain-only Gate A views after the local basin sculpt edits.
reference.hide_render=True;support.hide_render=True
for name in ['A01_Canyon_Plan','A02_Canyon_Section','A03_Hero_Basins']:
 scene.camera=bpy.data.objects[name];scene.render.filepath=str(OUT/(name+'.png'));bpy.ops.render.render(write_still=True)
reference.hide_render=False;support.hide_render=False
# Consolidate identical edge-post materials to avoid hundreds of GLB draws.
bpy.ops.object.select_all(action='DESELECT')
posts=[o for o in support.objects if o.name.startswith('Road edge support post')]
for o in posts:o.select_set(True)
bpy.context.view_layer.objects.active=posts[0];bpy.ops.object.join();bpy.context.object.name='Road edge posts'
scene.camera=bpy.data.objects['H1_Reveal'];bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Grand_Canyon_Terrain_First.blend'))
# Export only art. The game remains the source of the driving surface.
bpy.ops.object.select_all(action='DESELECT')
for name in ['10_CANYON_SCULPT','20_RIVER','30_BRIDGE_AND_ROAD_EDGES']:
 for o in bpy.data.collections[name].objects:
  if o.type=='MESH':o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'canyon_terrain_first.glb'),export_format='GLB',use_selection=True,export_apply=True)
print('Initial terrain-first road fit and six chase renders complete',flush=True)
