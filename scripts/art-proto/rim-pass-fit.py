"""R3: edit the saved R2 canyon into a shallow river reveal and buffered road.
Existing sculpt topology is retained. R2 remains untouched.
"""
import bpy,json,math,random
from pathlib import Path
from mathutils import Vector,kdtree,noise
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'art-prototype/output/river-reveal-r3'
if Path(bpy.data.filepath).name!='Canyon_Rim_Pass_R2.blend':raise RuntimeError('Open the saved Canyon_Rim_Pass_R2.blend')
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
def smooth(t):t=max(0,min(1,t));return t*t*t*(t*(t*6-15)+10)
def river_bend(z):
 knots=[(-1400,-320),(-600,-240),(-200,-260),(200,-280),(500,-280),(700,-175),(820,-150),(950,-270),(1100,-300),(1450,-170),(1900,80),(2800,180)]
 for (a,x),(b,y) in zip(knots,knots[1:]):
  if z<=b:return x+(y-x)*smooth((z-a)/(b-a))
 return knots[-1][1]
# Compress the existing lower canyon section, leaving high mesas untouched.
# This monotone height mapping preserves the old erosion contours and topology.
def shallower(y):
 if y<=250:return 228+(y-45)*.25
 if y>=340:return y
 t=(y-250)/90
 return (2*t**3-3*t*t+1)*279.25+(t**3-2*t*t+t)*22.5+(-2*t**3+3*t*t)*340+(t**3-t*t)*90
river=bpy.data.objects['Continuous meandering river'];channel=[]
for i in range(0,len(river.data.vertices),2):
 a,b=river.data.vertices[i:i+2];z=-(a.co.y+b.co.y)/2;x=river_bend(z)+4*math.sin(z*.014)
 width=(b.co.x-a.co.x)/2*(2.5+.7*math.exp(-((z-950)/600)**2));y=shallower((a.co.z+b.co.z)/2)
 channel.append((z,x,width,y));a.co.x=x-width;b.co.x=x+width;a.co.z=y;b.co.z=y
uv=river.data.uv_layers.active or river.data.uv_layers.new(name='River flow UV')
for p in river.data.polygons:
 for li in p.loop_indices:
  idx=river.data.loops[li].vertex_index;v=river.data.vertices[idx].co
  uv.data[li].uv=(idx%2,-v.y/65)
water=mat('R3 flowing river',(.08,.28,.29));water.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.32
river.data.materials.clear();river.data.materials.append(water);river.data.update()
def channel_at(z):
 i=max(0,min(len(channel)-2,int((z-channel[0][0])/5)));a,b=channel[i],channel[i+1];t=max(0,min(1,(z-a[0])/5))
 return [a[j]+(b[j]-a[j])*t for j in range(1,4)]
land=bpy.data.objects['Connected canyon with two eroded rims'];modified=0;maxcut=0;maxfill=0;view_cuts=0
for v in land.data.vertices:
 p,o,d=road_at(v.co)
 before=v.co.z
 v.co.z=shallower(v.co.z)
 cx,cw,cy=channel_at(-v.co.y);bank=abs(v.co.x-cx)
 if bank<cw+20:
  cap=cy-1+max(0,bank-cw+3)*.18;w=1-smooth((bank-cw)/20)
  v.co.z+=min(0,cap-v.co.z)*w
 # Wide recovery shoulders between reveals, narrow open rim at the hero bends.
 reveal=max(smooth((p[0]-z['start'])/65)*smooth((z['end']-p[0])/65) for z in road['scenicZones'])
 shelf=24-12*reveal
 if d<=70:
  target=p[2]-math.tan(p[5])*max(-12,min(12,o))-.2-max(0,d-12)*.035;w=1-smooth((d-shelf)/(70-shelf))
  v.co.z+=(target-v.co.z)*w
 # Open the near-bank sightline across the first basin and downstream bend.
 # The opposing high rim is outside this road-local window and is preserved.
 if 12<o<360:
  opening=max(smooth((p[0]-1700)/150)*smooth((2390-p[0])/150),smooth((p[0]-2400)/100)*smooth((2900-p[0])/150))
  cap=max(cy+1,p[2]-.2-(o-12)*.65);w=opening*(1-smooth((o-240)/120))
  if v.co.z>cap and w>0:v.co.z+=(cap-v.co.z)*w;view_cuts+=1
 delta=v.co.z-before
 if abs(delta)>.00001:maxcut=max(maxcut,-delta);maxfill=max(maxfill,delta);modified+=1
land.data.update()
for p in land.data.polygons:p.use_smooth=True
# Retain the existing sculpt and materials; rebuild only the road references.
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
# One mesh of the existing sparse edge-post treatment.
vs=[];fs=[]
for p in frames[::12]:
 if not 340<=p[0]<=350+road['routeLength']+60:continue
 for o in [-10.7,10.7]:
  x=p[1]-math.cos(p[4])*o;y=p[2]-math.tan(p[5])*o;z=p[3]-math.sin(p[4])*o;start=len(vs)
  vs.extend((x+dx,y+dy,z+dz) for dx,dy,dz in [(-.08,-.2,-.08),(.08,-.2,-.08),(.08,-.2,.08),(-.08,-.2,.08),(-.08,1.1,-.08),(.08,1.1,-.08),(.08,1.1,.08),(-.08,1.1,.08)])
  fs.extend(tuple(start+i for i in f) for f in [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)])
mesh('Road edge posts',vs,fs,edges,metal)
# Sparse, fixed dressing groups on recovery shoulders. No runtime placement.
dressing=collection('40_DRY_ROADSIDE');rng=random.Random(3117)
ground=BVHTree.FromPolygons([v.co for v in land.data.vertices],[tuple(p.vertices) for p in land.data.polygons])
def anchor(d,o):
 p=frames[min(len(frames)-1,round(d/2.5))];x=p[1]-math.cos(p[4])*o;z=p[3]-math.sin(p[4])*o
 hit=ground.ray_cast(Vector((x,-z,800)),Vector((0,0,-1)))
 return Vector((x,hit[0].z if hit[0] else p[2],z))
rockmats=[mat('R3 weathered roadside rock',(.31,.18,.10)),mat('R3 pale broken rock',(.45,.29,.17))]
rock_stops=[(470,-20),(550,25),(680,29),(920,-19),(1010,27),(1220,-22),(1370,28),(1570,-19),(1700,23),(1810,-21),(2140,-22),(2340,-19),(2810,-20),(2940,28),(3120,25),(3300,-21),(3410,27)]
rocks=[]
for k,(d,o) in enumerate(rock_stops):
 for j in range(2 if k%3 else 3):
  base=anchor(d+rng.uniform(-9,9),o+rng.uniform(-3,3));size=rng.uniform(.85,2.3)
  bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=1,location=cv(base));ob=bpy.context.object
  for c in list(ob.users_collection):c.objects.unlink(ob)
  dressing.objects.link(ob);ob.name=f'Shoulder boulder {k:02d}_{j}'
  for v in ob.data.vertices:v.co*=1+.18*noise.noise_vector(v.co*2.5+Vector((k,j,4))).x
  ob.scale=(size*1.45,size,size*.72);ob.rotation_euler.z=rng.uniform(0,6.28);ob.location.z+=size*.36
  ob.data.materials.append(rockmats[k%2]);rocks.append(ob)
bpy.ops.object.select_all(action='DESELECT')
for ob in rocks:ob.select_set(True)
bpy.context.view_layer.objects.active=rocks[0];bpy.ops.object.join();bpy.context.object.name='Irregular shoulder boulder groups'
wood=mat('R3 weathered dead wood',(.15,.105,.065));grassmat=mat('R3 dry ochre grasses',(.33,.25,.105))
def taper(vs,fs,a,b,r0,r1):
 direction=(b-a).normalized();u=direction.cross(Vector((0,1,0)))
 if u.length<.01:u=direction.cross(Vector((1,0,0)))
 u.normalize();v=direction.cross(u);start=len(vs);n=6
 for center,radius in [(a,r0),(b,r1)]:
  for j in range(n):vs.append(tuple(center+radius*(math.cos(j*math.tau/n)*u+math.sin(j*math.tau/n)*v)))
 for j in range(n):fs.append((start+j,start+(j+1)%n,start+n+(j+1)%n,start+n+j))
 fs.append(tuple(start+n+j for j in range(n)))
tree_stops=[(510,-24),(745,28),(1090,-25),(1320,29),(1540,-23),(1780,-22),(2100,-24),(2380,-22),(2840,29),(3070,-24),(3360,29)]
vs=[];fs=[]
for k,(d,o) in enumerate(tree_stops):
 base=anchor(d,o);height=rng.uniform(4.8,7);lean=Vector((rng.uniform(-.8,.8),height,rng.uniform(-.7,.7)))
 trunk=[base+lean*t+Vector((.18*math.sin(t*5),0,0)) for t in [0,.38,.72,1]]
 for j in range(3):taper(vs,fs,trunk[j],trunk[j+1],.25*(1-j*.24),.25*(1-(j+1)*.24))
 for j in range(5):
  theta=rng.uniform(0,math.tau);start=base+lean*rng.uniform(.35,.85)
  end=start+Vector((math.cos(theta)*rng.uniform(1.1,2.7),rng.uniform(.6,1.5),math.sin(theta)*rng.uniform(1.1,2.7)))
  elbow=start.lerp(end,.6)+Vector((0,-.25,0));taper(vs,fs,start,elbow,.10,.065);taper(vs,fs,elbow,end,.065,.022)
  tip=elbow+Vector((math.cos(theta+.7),.8,math.sin(theta+.7)));taper(vs,fs,elbow,tip,.045,.012)
mesh('Sparse dead cottonwood silhouettes',vs,fs,dressing,wood)
vs=[];fs=[]
for d,o in rock_stops+tree_stops:
 for cluster in range(3):
  base=anchor(d+rng.uniform(-12,12),o+rng.uniform(-3,3))
  for blade in range(11):
   theta=rng.uniform(0,math.tau);height=rng.uniform(.35,1.05);width=rng.uniform(.04,.11);q=base+Vector((rng.uniform(-.65,.65),.015,rng.uniform(-.65,.65)))
   u=Vector((math.cos(theta)*width,0,math.sin(theta)*width));tip=q+Vector((math.cos(theta+.7)*.3,height,math.sin(theta+.7)*.3));i=len(vs)
   vs.extend([tuple(q-u),tuple(q+u),tuple(tip)]);fs.append((i,i+1,i+2))
mesh('Irregular dry grass clumps',vs,fs,dressing,grassmat)
for spec in ref['cameras']:
 c=bpy.data.cameras.new(spec['name']);o=bpy.data.objects.new(spec['name'],c);cams.objects.link(o);o.location=cv(spec['eye']);o.rotation_euler=(Vector(cv(spec['look']))-o.location).to_track_quat('-Z','Y').to_euler();c.lens=36/(2*math.tan(math.radians(spec['horizontalFov'])/2));c.sensor_width=36;c.clip_end=2200
scene.camera=bpy.data.objects['H1_Reveal'];scene['rim_pass_revision']='R3 shallow river reveal';scene['rim_pass_fit_vertices']=modified
embedded=bpy.data.texts.get('FIXED_ROAD.json') or bpy.data.texts.new('FIXED_ROAD.json')
embedded.clear();embedded.write(json.dumps(road))
scene['rim_pass_scope']='R2 sculpt retained; shallower existing river valley, long descent, wide recovery shoulders and sparse dry roadside dressing.'
scene['art_collections']=['10_CANYON_SCULPT','20_RIVER','30_ROAD_EDGES','40_DRY_ROADSIDE']
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Canyon_River_Reveal_R3.blend'))
bpy.ops.object.select_all(action='DESELECT')
for name in scene['art_collections']:
 for obj in bpy.data.collections[name].objects:
  if obj.type=='MESH':obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'canyon_river_reveal_r3.glb'),export_format='GLB',use_selection=True,export_apply=True)
(OUT/'local-edit-report.json').write_text(json.dumps({'modifiedVertices':modified,'viewCutVertices':view_cuts,'maxLocalCut':maxcut,'maxLocalFill':maxfill,'corridorRadius':70,'bridgeMeshes':0,'terrainRebuilt':False,'boulderGroups':len(rock_stops),'deadTrees':len(tree_stops),'grassClumps':3*(len(rock_stops)+len(tree_stops))},indent=2))
print('Local road fitting',modified,'cut',maxcut,'fill',maxfill,flush=True)
