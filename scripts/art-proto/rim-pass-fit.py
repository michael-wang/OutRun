"""R2: open the saved R1 scene, fit long grades and clear right-side drift reveals.
No terrain regeneration or extra mesh subdivision. R1 remains untouched.
"""
import bpy,json,math
from pathlib import Path
from mathutils import Vector,kdtree
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'art-prototype/output/rim-pass-r2'
if Path(bpy.data.filepath).name!='Canyon_Rim_Pass_R1.blend':raise RuntimeError('Open the saved Canyon_Rim_Pass_R1.blend')
road=json.loads((ROOT/'src/terrain-first-road.json').read_text());ref=json.loads((ROOT/'art-prototype/output/roadlock-road-reference.json').read_text());frames=road['frames'];scene=bpy.context.scene
def cv(p):return (p[0],-p[2],p[1])
def collection(name):
 old=bpy.data.collections.get(name)
 if old:
  for obj in list(old.objects):bpy.data.objects.remove(obj,do_unlink=True)
  bpy.data.collections.remove(old)
 c=bpy.data.collections.new(name);scene.collection.children.link(c);return c
edges=collection('30_ROAD_EDGES');reference=collection('00_REFERENCE_DO_NOT_EXPORT');cams=collection('91_GAME_CHASE')
def mesh(name,vs,fs,col,mat):
 me=bpy.data.meshes.new(name);me.from_pydata([cv(p) for p in vs],[],fs);me.update();o=bpy.data.objects.new(name,me);col.objects.link(o);me.materials.append(mat);return o
def mat(name,color):
 m=bpy.data.materials.get(name) or bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=.9;return m
kd=kdtree.KDTree(len(frames))
for i,p in enumerate(frames):kd.insert((p[1],-p[3],0),i)
kd.balance()
def road_at(v):
 _,i,_=kd.find((v.x,v.y,0));a=frames[max(0,i-1)];b=frames[min(len(frames)-1,i+1)];dx,dz=b[1]-a[1],b[3]-a[3]
 t=max(0,min(1,((v.x-a[1])*dx+(-v.y-a[3])*dz)/(dx*dx+dz*dz)));p=[a[j]+(b[j]-a[j])*t for j in range(6)]
 offset=-(v.x-p[1])*math.cos(p[4])-(-v.y-p[3])*math.sin(p[4]);dist=math.hypot(v.x-p[1],-v.y-p[3]);return p,offset,dist
land=bpy.data.objects['Connected canyon with two eroded rims'];modified=0;maxcut=0;maxfill=0;view_cuts=0
def smooth(t):t=max(0,min(1,t));return t*t*t*(t*(t*6-15)+10)
for v in land.data.vertices:
 p,o,d=road_at(v.co)
 before=v.co.z
 if d<=42:
  target=p[2]-math.tan(p[5])*o-.2;w=1-smooth((d-12)/30)
  v.co.z+=(target-v.co.z)*w
 # Local removal of the outside lip at the two authored right-hand bends.
 # Lower only obstructing terrain; never fill the canyon or touch the far rim.
 if 12<o<100:
  reveal=max(smooth((p[0]-z['start'])/65)*smooth((z['end']-p[0])/65) for z in road['scenicZones'])
  cap=p[2]-.2-(o-12)*.5;w=reveal*(1-smooth((o-55)/45))
  if v.co.z>cap and w>0:v.co.z+=(cap-v.co.z)*w;view_cuts+=1
 delta=v.co.z-before
 if abs(delta)>.00001:maxcut=max(maxcut,-delta);maxfill=max(maxfill,delta);modified+=1
land.data.update()
for p in land.data.polygons:p.use_smooth=True
# Preserve all distant materials and geometry. This is only a road shelf repair.
asphalt=mat('REFERENCE asphalt',(.045,.044,.04));paint=mat('REFERENCE white paint',(.84,.82,.70));metal=mat('Weathered bridge steel',(.16,.135,.105))
def ribbon(name,left,right,lift,material,dashed=False):
 v=[];f=[]
 for p in frames:
  for o in [left,right]:v.append((p[1]-math.cos(p[4])*o,p[2]-math.tan(p[5])*o+lift,p[3]-math.sin(p[4])*o))
 for i in range(len(frames)-1):
  if not dashed or frames[i][0]%6<3:f.append((2*i,2*i+1,2*i+3,2*i+2))
 ob=mesh(name,v,f,reference,material)
 if material==paint:ob.visible_shadow=False
ribbon('REFERENCE four lane road',-7,7,.015,asphalt)
for o in [-3.5,0,3.5]:ribbon('REFERENCE lane',o-.12,o+.12,.04,paint,True)
for o in [-6.6,6.6]:ribbon('REFERENCE edge',o-.08,o+.08,.04,paint)
# One mesh of the existing sparse edge-post treatment; no new scenery props.
vs=[];fs=[]
for p in frames[::12]:
 if not 340<=p[0]<=350+road['routeLength']+60:continue
 for o in [-10.7,10.7]:
  x=p[1]-math.cos(p[4])*o;y=p[2]-math.tan(p[5])*o;z=p[3]-math.sin(p[4])*o;start=len(vs)
  vs.extend((x+dx,y+dy,z+dz) for dx,dy,dz in [(-.08,-.2,-.08),(.08,-.2,-.08),(.08,-.2,.08),(-.08,-.2,.08),(-.08,1.1,-.08),(.08,1.1,-.08),(.08,1.1,.08),(-.08,1.1,.08)])
  fs.extend(tuple(start+i for i in f) for f in [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)])
mesh('Road edge posts',vs,fs,edges,metal)
for spec in ref['cameras']:
 c=bpy.data.cameras.new(spec['name']);o=bpy.data.objects.new(spec['name'],c);cams.objects.link(o);o.location=cv(spec['eye']);o.rotation_euler=(Vector(cv(spec['look']))-o.location).to_track_quat('-Z','Y').to_euler();c.lens=36/(2*math.tan(math.radians(spec['horizontalFov'])/2));c.sensor_width=36;c.clip_end=2200
scene.camera=bpy.data.objects['H1_Reveal'];scene['rim_pass_revision']='R2 drift reveal';scene['rim_pass_fit_vertices']=modified
embedded=bpy.data.texts.get('FIXED_ROAD.json') or bpy.data.texts.new('FIXED_ROAD.json')
embedded.clear();embedded.write(json.dumps(road))
scene['rim_pass_scope']='R1 canyon retained. Long vertical curves; local road support and outside-lip cuts at two drift reveals.'
scene['art_collections']=['10_CANYON_SCULPT','20_RIVER','30_ROAD_EDGES']
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Canyon_Rim_Pass_R2.blend'))
bpy.ops.object.select_all(action='DESELECT')
for name in scene['art_collections']:
 for obj in bpy.data.collections[name].objects:
  if obj.type=='MESH':obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'canyon_rim_pass_r2.glb'),export_format='GLB',use_selection=True,export_apply=True)
(OUT/'local-edit-report.json').write_text(json.dumps({'modifiedVertices':modified,'viewCutVertices':view_cuts,'maxLocalCut':maxcut,'maxLocalFill':maxfill,'corridorRadius':42,'bridgeMeshes':0,'terrainRebuilt':False},indent=2))
print('Local road fitting',modified,'cut',maxcut,'fill',maxfill,flush=True)
