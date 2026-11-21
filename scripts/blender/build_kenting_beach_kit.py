"""Small authored beach kit. Existing Blender only; no inference or image textures."""
import bpy, math, sys, json, hashlib, bmesh
from pathlib import Path
from mathutils import Vector
out=Path(sys.argv[sys.argv.index('--')+1]);out.mkdir(parents=True,exist_ok=False)
def mat(name,rgb):
 m=bpy.data.materials.new(name);m.diffuse_color=(*rgb,1);m.use_nodes=True;n=m.node_tree.nodes.get('Principled BSDF');n.inputs['Base Color'].default_value=(*rgb,1);n.inputs['Roughness'].default_value=.7;return m
ivory=mat('warm ivory canvas',(.91,.87,.74));red=mat('coral paint',(.69,.15,.09));blue=mat('coastal blue',(.06,.34,.46));wood=mat('sun bleached timber',(.48,.29,.13));metal=mat('pale painted metal',(.81,.83,.79));dark=mat('dark fixtures',(.04,.065,.07));gold=mat('sun yellow',(.9,.65,.12))
def box(name,loc,size,m):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.scale=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m);return o
def cyl(name,loc,r,depth,m,n=12):
 bpy.ops.mesh.primitive_cylinder_add(vertices=n,radius=r,depth=depth,location=loc);o=bpy.context.object;o.name=name;o.data.materials.append(m);return o
def beam(name,a,b,r,m):
 d=Vector(b)-Vector(a);o=cyl(name,(Vector(a)+Vector(b))/2,r,d.length,m);o.rotation_euler=d.to_track_quat('Z','Y').to_euler();return o
def ring(name,loc,r,t,m):
 bpy.ops.mesh.primitive_torus_add(major_radius=r,minor_radius=t,major_segments=24,minor_segments=8,location=loc);o=bpy.context.object;o.name=name;o.data.materials.append(m);return o
def fresh():bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
records=[]
def save(name):
 bpy.context.scene.unit_settings.system='METRIC';bpy.context.scene['provenance']='Direct authored geometry inspired by Julia board; no copied photo textures.'
 bpy.ops.wm.save_as_mainfile(filepath=str(out/(name+'.blend')))
 count=len(bpy.context.scene.objects)
 # Freeze rotation/scale before merging; avoid a nonuniform active-object transform
 # introducing shear that glTF TRS nodes cannot represent.
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
 for m in [ivory,red,blue,wood,metal,dark,gold]:
  objects=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.data.materials[0]==m]
  if not objects:continue
  bpy.ops.object.select_all(action='DESELECT')
  for o in objects:o.select_set(True)
  bpy.context.view_layer.objects.active=objects[0]
  if len(objects)>1:bpy.ops.object.join()
  bpy.context.object.name=name+'-'+m.name
 for o in bpy.context.scene.objects:
  bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.triangulate(bm,faces=list(bm.faces));bad=[f for f in bm.faces if f.calc_area()<1e-9];bmesh.ops.delete(bm,geom=bad,context='FACES');bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free();o.data.calc_loop_triangles()
 tris=sum(len(o.data.loop_triangles) for o in bpy.context.scene.objects)
 bpy.ops.export_scene.gltf(filepath=str(out/(name+'.glb')),export_format='GLB',export_yup=True,export_cameras=False,export_lights=False)
 records.append({'asset':name,'editableObjects':count,'meshes':len(bpy.context.scene.objects),'triangles':tris})
def canopy(m):
 cyl('umbrella mast',(0,0,1.15),.045,2.3,wood)
 # Individual alternating fabric gores with shallow domed profile and scalloped edge.
 for i in range(12):
  a=i*math.tau/12;b=(i+1)*math.tau/12;mid=(a+b)/2
  vertices=[(0,0,2.67),(math.cos(a)*.7,math.sin(a)*.7,2.52),(math.cos(b)*.7,math.sin(b)*.7,2.52),(math.cos(a)*1.55,math.sin(a)*1.55,2.2),(math.cos(mid)*1.6,math.sin(mid)*1.6,2.13),(math.cos(b)*1.55,math.sin(b)*1.55,2.2)]
  mesh=bpy.data.meshes.new('canvas gore');mesh.from_pydata(vertices,[],[(0,1,2),(1,3,4,5,2)]);mesh.materials.append(m if i%2 else ivory);o=bpy.data.objects.new('alternating canopy',mesh);bpy.context.collection.objects.link(o)
  beam('canopy rib',(0,0,2.61),vertices[3],.018,metal)
 cyl('canopy finial',(0,0,2.7),.055,.12,wood)
def chair(x):
 for side in [-.32,.32]:
  beam('chair crossed leg',(x+side,-.25,0),(x+side,.6,.43),.035,wood);beam('chair crossed leg',(x+side,.65,0),(x+side,-.3,.43),.035,wood)
  beam('chair back frame',(x+side,.25,.39),(x+side,1.05,1.02),.035,wood)
 box('chair seat',(x,.1,.43),(.62,.86,.045),ivory)
 o=box('reclining canvas',(x,.67,.72),(.62,1,.045),ivory);o.rotation_euler.x=math.radians(38)
for color,name in [(red,'kenting-parasol-coral'),(blue,'kenting-parasol-blue'),(gold,'kenting-parasol-gold')]:
 fresh();canopy(color);chair(-1);chair(1);cyl('small round beach table',(0,-.7,.5),.32,.08,wood);cyl('table foot',(0,-.7,.25),.055,.5,wood);save(name)
fresh()
for x in [-1.5,1.5]:
 for y in [-1.4,1.4]:beam('lookout post',(x,y,0),(x,y,4.2),.10,red)
for y in [-1.4,1.4]:
 beam('cross brace',(-1.5,y,.2),(1.5,y,2.35),.06,red);beam('cross brace',(1.5,y,.2),(-1.5,y,2.35),.06,red)
box('platform',(0,0,2.4),(3.5,3.2,.18),wood)
for y in [-1.4,1.4]:
 for z in [2.75,3.25]:beam('platform rail',(-1.55,y,z),(1.55,y,z),.045,metal)
 for x in [-1,-.5,0,.5,1]:beam('rail baluster',(x,y,2.5),(x,y,3.25),.035,metal)
for x in [-1.5,1.5]:
 for z in [2.75,3.25]:beam('side rail',(x,-1.4,z),(x,1.4,z),.045,metal)
bpy.ops.mesh.primitive_cone_add(vertices=4,radius1=2.9,radius2=0,depth=.9,rotation=(0,0,math.pi/4),location=(0,0,4.5));bpy.context.object.data.materials.append(red);bpy.context.object.name='four sided pitched roof'
for i in range(9):box('access stair',(-2.3,-2+i*.28,.13+i*.265),(1.05,.4,.16),wood)
for x in [-2.84,-1.76]:beam('stair handrail',(x,-2,.8),(x,.3,3.1),.045,metal)
o=ring('rescue ring',(0,1.48,2.91),.32,.095,ivory);o.rotation_euler.x=math.pi/2
beam('flag pole',(1.5,1.4,4.3),(1.5,1.4,6),.025,metal);box('lifeguard pennant',(1.92,1.4,5.65),(.84,.035,.45),gold)
save('kenting-lifeguard')
fresh()
for x in [-2.4,2.4]:
 for y in [-1.3,1.3]:beam('open kiosk post',(x,y,0),(x,y,2.6),.08,wood)
box('rental counter',(0,.95,1),(4.5,.65,.15),wood)
for i in range(10):
 o=box('striped low awning',(-2.5+i*.55,0,2.65),(.55,3.25,.10),ivory if i%2 else blue);o.rotation_euler.x=.08
for x in [-1.8,-.9,0,.9,1.8]:box('counter slat',(x,1.2,.55),(.12,.08,.9),wood)
for i in range(3):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,location=(2.85+i*.38,0,1.25));o=bpy.context.object;o.name='rental surfboard';o.scale=(.27,.09,1.3);o.rotation_euler.y=.16;o.data.materials.append([red,blue,gold][i])
 ring('rental float',(-2.8,0,.8+i*.42),.4,.12,[red,blue,gold][i])
save('kenting-rental')
(out/'assets.json').write_text(json.dumps({'assets':records,'sha256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in out.iterdir() if p.is_file()}},indent=2));print(json.dumps(records))
