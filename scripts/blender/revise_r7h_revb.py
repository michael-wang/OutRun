"""Costume-only B-2 patch on the saved v0.10.29 master. No character rebuild.
Owner explicitly chose shoulder ribbons (NO neck loop), overriding Issue #51's
earlier nape design. Run Blender 4.5 -b -t 4 -P this file from the repo root.
"""
import bpy,math,json,hashlib
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path.cwd();OUT=ROOT/'art-prototype/output';REVIEW=ROOT/'docs/art-review/r7h-revb';REVIEW.mkdir(parents=True,exist_ok=True)
SOURCE=OUT/'r7h-heroine-fullbody-v029.blend'
source_hash=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
body=bpy.data.objects['heroine-body'];rig=bpy.data.objects['heroine-r7h-rig'];old=body.data
def game(p):return Vector((p[0],p[2],-p[1]))
def blender(p):return Vector((p[0],-p[2],p[1]))
P=[game(v.co) for v in old.vertices];original_count=len(P)
F=[list(f.vertices) for f in old.polygons];MI=[f.material_index for f in old.polygons]
C=[tuple(c.color) for c in old.color_attributes['Heroine paint'].data]
color_type=old.color_attributes['Heroine paint'].data_type
W=[{g.group:g.weight for g in v.groups} for v in old.vertices]
group_names=[g.name for g in body.vertex_groups]
keys={k.name:[v.co.copy() for v in k.data] for k in old.shape_keys.key_blocks}
tracks=[(t.name,t.strips[0].action) for t in old.shape_keys.animation_data.nla_tracks]
materials=list(old.materials)
# Identify existing, disconnected CLOTH pieces; never select a skin/head face.
adj={}
for f,mat in zip(F,MI):
 if mat==1:
  for i in f:adj.setdefault(i,set()).update(f)
components=[];unseen=set(adj)
while unseen:
 todo=[unseen.pop()];component=set(todo)
 while todo:
  for i in adj[todo.pop()]:
   if i in unseen:unseen.remove(i);component.add(i);todo.append(i)
 components.append(component)
shell=next(c for c in components if len(c)==1216)
removed=set().union(*(c for c in components if min(P[i].y for i in c)>1.16))
assert len(removed)>300,'Expected the old collar, crossover ribbons and front knot'
keep=[i for i,f in enumerate(F) if not any(v in removed for v in f)]
F=[F[i] for i in keep];MI=[MI[i] for i in keep]
lookup={tuple(round(n,5) for n in P[i]):i for i in shell}
sections=[(.66,.185,.12),(.76,.195,.133),(.87,.151,.105),(1.01,.157,.109),(1.10,.185,.132),(1.19,.210,.119),(1.25,.166,.087),(1.28,.081,.065),(1.315,.061,.060),(1.33,.059,.059)]
def shell_point(row,i,revision):
 t=row/18;a=i*math.tau/64;s=math.sin(a);c=math.cos(a);front=max(c,0)
 if revision:
  # Back lowered 10 cm. Front becomes a soft, shoulder-supported neckline.
  top=1.0+.035*s*s+.16*front**.5-.035*front**8
 else:top=.855+.035*abs(s)+.375*front**1.25+.245*(1-front)**2
 bottom=.48+.055*s+.018*math.cos(2*a);y=bottom+(top-bottom)*t
 if y<sections[0][0]:w=.197;d=.135
 else:
  a0,b0=next(((a0,b0) for a0,b0 in zip(sections,sections[1:]) if a0[0]<=y<=b0[0]),(sections[-2],sections[-1]))
  f=(y-a0[0])/(b0[0]-a0[0]);w=a0[1]*(1-f)+b0[1]*f;d=a0[2]*(1-f)+b0[2]*f
 w+=.017;d+=.017;fold=.0035*math.sin(6*a+9*t)*math.sin(math.pi*t)+.002*math.cos(10*a-4*t)
 return Vector(((w+fold)*s,y,-.48+(d+fold)*c))
grid={}
for row in range(19):
 for i in range(64):
  v=lookup[tuple(round(n,5) for n in shell_point(row,i,False))];grid[row,i]=v;P[v]=shell_point(row,i,True)

# Query the ORIGINAL body surface and skin weights to conform the satin bands.
skin_faces=[f for f,mat in zip(F,MI) if mat==0 and max(P[i].y for i in f)<1.28 and min(P[i].y for i in f)>.80]
bvh=BVHTree.FromPolygons(P,skin_faces,all_triangles=False)
def conform(p):
 hit,normal,face,_=bvh.find_nearest(p)
 # The legacy torso has inward winding; retain that mesh untouched and orient
 # the fitting normal outward only, so ribbons sit above rather than in skin.
 if normal.dot(Vector((hit.x,(hit.y-1.10)*.4,hit.z+.48)))<0:normal.negate()
 weights={};total=0
 for i in skin_faces[face]:
  q=1/max((P[i]-hit).length,.001)**2;total+=q
  for g,w in W[i].items():weights[g]=weights.get(g,0)+q*w
 return hit,normal,{g:w/total for g,w in weights.items()}
def add(p,w,color=(.88,.83,.73,1)):
 P.append(p.copy());W.append(w.copy());C.append(color);return len(P)-1
def quad(ids):
 if len(set(ids))>=3:F.append(list(dict.fromkeys(ids)));MI.append(1)
def curve(controls):
 result=[]
 for j in range(len(controls)-1):
  p0=controls[max(0,j-1)];p1=controls[j];p2=controls[j+1];p3=controls[min(len(controls)-1,j+2)]
  for k in range(6):
   t=k/6;result.append((2*p1+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t)*.5)
 result.append(controls[-1]);return result
anchors=[];ribbon_start=len(P)
for side in [1,-1]:
 # Each band actually shares vertices with the front edge and back panel seam.
 front_ids=[grid[18,5],grid[18,7]] if side==1 else [grid[18,57],grid[18,59]]
 back_ids=[grid[16,31],grid[16,29]] if side==1 else [grid[16,35],grid[16,33]]
 front_ids.sort(key=lambda i:P[i].x);back_ids.sort(key=lambda i:P[i].x)
 start=(P[front_ids[0]]+P[front_ids[1]])*.5;end=(P[back_ids[0]]+P[back_ids[1]])*.5
 path=curve([start,Vector((side*.134,1.205,-.39)),Vector((side*.137,1.250,-.465)),Vector((side*.132,1.225,-.55)),Vector((side*.108,1.15,-.60)),Vector((side*.067,1.065,-.61)),end])
 rings=[]
 for j,point in enumerate(path):
  t=j/(len(path)-1);hit,normal,weights=conform(point)
  tangent=path[min(j+1,len(path)-1)]-path[max(0,j-1)];tangent.normalize()
  across=tangent.cross(normal).normalized()
  if across.x<0:across.negate()
  # 3.2cm broad satin, 4mm rounded cross-section; taper into real seams.
  half=.016;edge_blend=max(0,1-min(j,len(path)-1-j)/4)
  ids=front_ids if j<len(path)/2 else back_ids
  seam_half=(P[ids[1]]-P[ids[0]]).length*.5
  half=half*(1-edge_blend)+seam_half*edge_blend
  center=hit+normal*.006
  if edge_blend:
   center=center.lerp(point,edge_blend);across=across.lerp((P[ids[1]]-P[ids[0]]).normalized(),edge_blend).normalized()
  ring=[]
  for k,(u,depth) in enumerate([(-1,0),(-.85,.0018),(.85,.0018),(1,0),(1,-.001),(.85,-.0028),(-.85,-.0028),(-1,-.001)]):
   if j in (0,len(path)-1) and k in (0,3,4,7):
    ring.append(ids[0] if k in (0,7) else ids[1]);continue
   raw=center+across*(half*u)
   surface,n,w=conform(raw);p=surface+n*(.006+depth)
   p=p.lerp(raw+normal*depth,edge_blend)
   ring.append(add(p,w))
  if rings:
   prev=rings[-1]
   for k in range(8):quad([prev[k],prev[(k+1)%8],ring[(k+1)%8],ring[k]])
  rings.append(ring)
 anchors.append({'side':side,'front':[list(P[i]) for i in front_ids],'back':[list(P[i]) for i in back_ids],'sharedVertices':front_ids+back_ids,'rows':len(rings)})

# Reconstruct only this object's storage, carrying original face/body morphs and
# all original groups/actions through unchanged. The source .blend is untouched.
used=sorted({i for f in F for i in f});remap={v:i for i,v in enumerate(used)}
mesh=bpy.data.meshes.new('R7H B2 shoulder-ribbon garment');mesh.from_pydata([blender(P[i]) for i in used],[],[[remap[i] for i in f] for f in F]);mesh.update()
for m in materials:mesh.materials.append(m)
paint=mesh.color_attributes.new(name='Heroine paint',type=color_type,domain='POINT')
for n,i in enumerate(used):paint.data[n].color=C[i]
for f,mi in zip(mesh.polygons,MI):f.material_index=mi;f.use_smooth=True
body.data=mesh
body.vertex_groups.clear()
for name in group_names:body.vertex_groups.new(name=name)
for n,i in enumerate(used):
 for group,weight in W[i].items():
  if weight>0:body.vertex_groups[group].add([n],weight,'REPLACE')
for name,positions in keys.items():
 key=body.shape_key_add(name=name)
 for n,i in enumerate(used):key.data[n].co=blender(P[i]) if i in shell or i>=original_count else positions[i]
body.data.shape_keys.animation_data_create()
for name,action in tracks:
 tr=body.data.shape_keys.animation_data.nla_tracks.new();tr.name=name;tr.strips.new(name,0,action)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'r7h-heroine-fullbody.blend'),compress=True)
def export(path,objects):
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=rig
 bpy.ops.export_scene.gltf(filepath=str(path),use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_skins=True,export_morph=True,export_extras=True)
export(ROOT/'public/assets/characters/coast-heroine-r7h-full.glb',list(bpy.data.objects))
# Same race cut used by R7H. Remove only explicitly tagged showcase vertices.
hidden=body.vertex_groups['showcase-only'].index
race_used=[i for i in range(len(mesh.vertices)) if not any(g.group==hidden and g.weight>.5 for g in mesh.vertices[i].groups)]
race_set=set(race_used);race_faces=[f for f in mesh.polygons if all(i in race_set for i in f.vertices)]
mapping={v:i for i,v in enumerate(race_used)}
race=bpy.data.meshes.new('R7H B2 race');race.from_pydata([mesh.vertices[i].co for i in race_used],[],[[mapping[i] for i in f.vertices] for f in race_faces]);race.update()
for m in materials:race.materials.append(m)
colors=race.color_attributes.new(name='Heroine paint',type=color_type,domain='POINT')
# The glTF exporter can invalidate cached RNA attribute handles. Use the
# immutable source colors, not the pre-export `paint` handle, for the race cut.
for n,i in enumerate(race_used):colors.data[n].color=C[used[i]]
for f,oldface in zip(race.polygons,race_faces):f.material_index=oldface.material_index;f.use_smooth=True
saved_keys={k.name:[v.co.copy() for v in k.data] for k in mesh.shape_keys.key_blocks}
saved_weights=[{g.group:g.weight for g in v.groups} for v in mesh.vertices]
body.data=race
body.vertex_groups.clear()
for name in group_names:body.vertex_groups.new(name=name)
for n,i in enumerate(race_used):
 for group,weight in saved_weights[i].items():body.vertex_groups[group].add([n],weight,'REPLACE')
for name,positions in saved_keys.items():
 key=body.shape_key_add(name=name)
 for n,i in enumerate(race_used):key.data[n].co=positions[i]
body.data.shape_keys.animation_data_create()
for name,action in tracks:
 tr=body.data.shape_keys.animation_data.nla_tracks.new();tr.name=name;tr.strips.new(name,0,action)
export(ROOT/'public/assets/characters/coast-heroine-r7h-race.glb',[body,rig])
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==source_hash
(REVIEW/'construction.json').write_text(json.dumps({'source':str(SOURCE),'sourceSha256':source_hash,'backCenterTop':1.0,'previousBackCenterTop':1.1,'removedNeckVertices':len(removed),'modifiedBodiceVertices':len(shell),'newRibbonVertices':len(P)-ribbon_start,'ribbonWidth':.032,'ribbonThickness':.0046,'anchors':anchors},indent=2))
print('B2 COSTUME EXPORT COMPLETE')
