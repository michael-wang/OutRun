"""R4: cut a narrow bench between the left mountain and right cliff.
The existing sculpt is locally refined and reshaped. R3 remains untouched.
"""
import bpy,json,math,random,bmesh
from pathlib import Path
from mathutils import Vector,kdtree,noise
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'art-prototype/output/cliff-pass-r4'
if Path(bpy.data.filepath).name!='Canyon_River_Reveal_R3.blend':raise RuntimeError('Open the saved Canyon_River_Reveal_R3.blend')
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
# Preserve the accepted river geometry, UVs and material.
river=bpy.data.objects['Continuous meandering river'];channel=[]
for i in range(0,len(river.data.vertices),2):
 a,b=river.data.vertices[i:i+2]
 channel.append((-(a.co.y+b.co.y)/2,(a.co.x+b.co.x)/2,(b.co.x-a.co.x)/2,(a.co.z+b.co.z)/2))
def channel_at(z):
 i=max(0,min(len(channel)-2,int((z-channel[0][0])/5)));a,b=channel[i],channel[i+1];t=max(0,min(1,(z-a[0])/5))
 return [a[j]+(b[j]-a[j])*t for j in range(1,4)]
land=bpy.data.objects['Connected canyon with two eroded rims']
# Refine only the near-road mesh for steep faces; preserve the far canyon.
bm=bmesh.new();bm.from_mesh(land.data)
near={v for v in bm.verts if kd.find((v.co.x,v.co.y,0))[2]<55}
edges_to_split=[e for e in bm.edges if all(v in near for v in e.verts)]
bmesh.ops.subdivide_edges(bm,edges=edges_to_split,cuts=1,use_grid_fill=True)
bm.to_mesh(land.data);bm.free()
modified=0;maxcut=0;maxfill=0;view_cuts=0
colors=land.data.color_attributes['COLOR_0']
strata=[(0,(.40,.19,.09)),(7,(.32,.13,.06)),(13,(.49,.25,.12)),(30,(.51,.28,.15)),(34,(.65,.40,.23)),(39,(.46,.22,.11)),(61,(.42,.19,.09)),(69,(.40,.19,.09))]
for v in land.data.vertices:
 p,o,d=road_at(v.co);before=v.co.z
 if d>360:continue
 edge=11.8;base=p[2]-math.tan(p[5])*max(-edge,min(edge,o))-.23
 color_weight=0
 if d<=edge:v.co.z=base
 elif o<0:
  u=-o;n=noise.noise_vector(Vector((v.co.x*.018,v.co.y*.018,1))).x
  foot=18+3*math.sin(p[0]*.014)+2*n
  height=100+22*math.sin(p[0]*.0035)+14*math.cos(p[0]*.0077)
  rise=smooth((u-foot)/(29+7*math.sin(p[0]*.009)))
  face=base+rise*(height+7*n)
  target=max(face,before) if u>50 else face
  w=1-smooth((u-85)/250)
  v.co.z+=(target-v.co.z)*w
  face_weight=smooth((v.co.z-base-3)/12)*(1-smooth((u-55)/30))
  # Bedding recesses and broad erosion grooves on the new wall only.
  relief=face_weight*(.55*math.sin(v.co.z*.19+1.4*n)+.45*n)
  v.co.x+=math.cos(p[4])*relief;v.co.y-=math.sin(p[4])*relief
  color_weight=face_weight
 else:
  cx,cw,cy=channel_at(-v.co.y)
  # Two short rest shelves; the remaining road has an exposed cliff edge.
  bay=max(smooth((p[0]-930)/65)*smooth((1120-p[0])/65),smooth((p[0]-3050)/65)*smooth((3220-p[0])/65))
  lip=edge+bay*10;drop=(p[2]-cy-3)*(1-bay*.5)
  t=smooth((o-lip)/(9+2*math.sin(p[0]*.011)))
  target=base-drop*t
  target+=t*(1-t)*1.6*noise.noise_vector(Vector((v.co.x*.2,v.co.y*.04,3))).x
  w=1-smooth((o-40)/110)
  v.co.z+=(target-v.co.z)*w
  color_weight=t*(1-smooth((o-28)/22))
  if v.co.z<before:view_cuts+=1
 if color_weight>0:
  grain=noise.noise_vector(Vector((v.co.x*.08,v.co.y*.08,v.co.z*.12))).x
  level=(v.co.z+4*math.sin(v.co.y*.006)+1.2*grain)%69
  for (a,ca),(b,cb) in zip(strata,strata[1:]):
   if level<=b:
    t=smooth((level-a)/(b-a));old=colors.data[v.index].color
    shade=[(ca[j]+(cb[j]-ca[j])*t)*(1+.10*grain) for j in range(3)]
    colors.data[v.index].color=tuple(old[j]+(shade[j]-old[j])*color_weight for j in range(3))+(1,)
    break
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
rock_stops=[(d,-17 if o<0 else o) for d,o in rock_stops if o<0 or 930<d<1120 or 3050<d<3220]
rocks=[]
for k,(d,o) in enumerate(rock_stops):
 for j in range(2 if k%3 else 3):
  base=anchor(d+rng.uniform(-9,9),o+rng.uniform(-1,1));size=rng.uniform(.85,2.3)
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
tree_stops=[(510,-14.5),(1090,-14.5),(1540,-14.5),(1780,-14.5),(2100,-14.5),(2380,-14.5),(3070,-14.5)]
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
scene.camera=bpy.data.objects['H1_Reveal'];scene['rim_pass_revision']='R4 cliff-side bench and stronger banking';scene['rim_pass_fit_vertices']=modified
embedded=bpy.data.texts.get('FIXED_ROAD.json') or bpy.data.texts.new('FIXED_ROAD.json')
embedded.clear();embedded.write(json.dumps(road))
scene['rim_pass_scope']='R3 river and far canyon retained; local bench between left wall and right cliff; banked reference and roadside roots refitted.'
scene['art_collections']=['10_CANYON_SCULPT','20_RIVER','30_ROAD_EDGES','40_DRY_ROADSIDE']
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Canyon_Cliff_Pass_R4.blend'))
bpy.ops.object.select_all(action='DESELECT')
for name in scene['art_collections']:
 for obj in bpy.data.collections[name].objects:
  if obj.type=='MESH':obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'canyon_cliff_pass_r4.glb'),export_format='GLB',use_selection=True,export_apply=True)
(OUT/'local-edit-report.json').write_text(json.dumps({'modifiedVertices':modified,'viewCutVertices':view_cuts,'maxLocalCut':maxcut,'maxLocalFill':maxfill,'corridorRadius':360,'bridgeMeshes':0,'terrainRebuilt':False,'boulderGroups':len(rock_stops),'deadTrees':len(tree_stops),'grassClumps':3*(len(rock_stops)+len(tree_stops))},indent=2))
print('Local road fitting',modified,'cut',maxcut,'fill',maxfill,flush=True)
