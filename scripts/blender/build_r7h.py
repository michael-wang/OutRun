"""R7H: continue the approved R7A sculpt, build one editable body and race derivative.
No inference, face regeneration, hair editing or external dependencies.
Run from repository root with Blender 4.5 -b -t 4 -P this script.
"""
import bpy,bmesh,math,json,hashlib,os
from pathlib import Path
from mathutils import Vector,Matrix,Quaternion
ROOT=Path.cwd(); OUT=ROOT/'art-prototype/output'; REVIEW=ROOT/os.environ.get('OUTRUN_HEROINE_REVIEW','docs/art-review/r7h')
OUT.mkdir(parents=True,exist_ok=True); REVIEW.mkdir(parents=True,exist_ok=True)
SOURCE=OUT/'r7a-heroine-upper-body.blend'
source_hash=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
hair=ROOT/'public/assets/characters/coast-blonde-r6d.glb'
hair_hash=hashlib.sha256(hair.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
old=next(o for o in bpy.data.objects if o.type=='MESH')
old.shape_key_clear();old.modifiers.clear()
# Preserve the sculpted head and neck, discard the cut-off R7A shoulder/garment.
bm=bmesh.new();bm.from_mesh(old.data)
bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.material_index==1],context='FACES')
bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=1e-6,plane_co=(0,0,1.34),plane_no=(0,0,1),clear_inner=True)
bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS')
bm.to_mesh(old.data);bm.free();old.data.update()
paint=old.data.color_attributes.get('Heroine paint')
# Working coordinates are the existing vehicle frame: +Z front, +X driver/left.
def game(p):return Vector((p[0],p[2],-p[1]))
def blender(p):return Vector((p[0],-p[2],p[1]))
P=[tuple(game(v.co)) for v in old.data.vertices]
F=[tuple(p.vertices) for p in old.data.polygons]
MI=[p.material_index for p in old.data.polygons]
C=[tuple(paint.data[i].color) for i in range(len(P))]
head_count=len(P)
# Open the existing lip seam, preserving its surrounding sculpted shape.
keep=[]
for ids in F:
 x=sum(P[i][0] for i in ids)/len(ids);y=sum(P[i][1] for i in ids)/len(ids);z=sum(P[i][2] for i in ids)/len(ids)
 keep.append(not(abs(x)<.036 and abs(y-(1.408+.10*abs(x)))<.0011 and z>-.346))
MI=[m for m,k in zip(MI,keep) if k];F=[f for f,k in zip(F,keep) if k]
eye_vertices={i for f,m in zip(F,MI) if m==3 for i in f}
# Slight desaturation of skin only; keep brown iris, brows, lip and eye whites.
for i,c in enumerate(C):
 r,g,b,a=c
 if r>g*1.35 and g>b*1.15 and r>.3:C[i]=(r*.96,g*1.045,b*1.10,a)
 if i not in eye_vertices and 1.475<P[i][1]<1.513 and .015<abs(P[i][0])<.10 and min(r,g,b)>.55:C[i]=(.70,.36,.23,a)
SKIN=(.70,.39,.27,1); IVORY=(.88,.83,.73,1); GOLD=(.83,.51,.16,1)
def vertex(p,c=SKIN):P.append(tuple(p));C.append(c);return len(P)-1
def face(ids,mat=0):F.append(tuple(ids));MI.append(mat)
def bridge(a,b,mat=0):
 # Zipper unequal neck rings without a detached seam.
 i=j=0
 while i<len(a) or j<len(b):
  if j==len(b) or (i<len(a) and (i+1)/len(a)<=(j+1)/len(b)):
   face((a[i%len(a)],a[(i+1)%len(a)],b[j%len(b)]),mat);i+=1
  else:face((a[i%len(a)],b[(j+1)%len(b)],b[j%len(b)]),mat);j+=1
def ring(y,w,d,z=-.48,n=32,c=SKIN):return [vertex((w*math.sin(i*2*math.pi/n),y,z+d*math.cos(i*2*math.pi/n)),c) for i in range(n)]
# Coherent shoulder/upper-back surface. Arm openings share the torso vertices.
sections=[(.66,.185,.12),(.76,.195,.133),(.87,.151,.105),(1.01,.157,.109),(1.10,.185,.132),(1.19,.210,.119),(1.25,.166,.087),(1.28,.081,.065),(1.315,.061,.060),(1.33,.059,.059)]
rings=[ring(*s,z=-.48+max(0,min(1,(s[0]-1.25)/.08))*.015) for s in sections]
for row in range(1,len(rings)):
 for i in range(32):
  if row in (5,6) and (6<=i<10 or 22<=i<26):continue
  j=(i+1)%32;face((rings[row-1][i],rings[row-1][j],rings[row][j],rings[row][i]))
# Join source neck cut loop, ordered around its own centre.
boundary=[i for i,p in enumerate(P[:head_count]) if abs(p[1]-1.34)<2e-5]
boundary.sort(key=lambda i:math.atan2(P[i][0],P[i][2]+.465)%(2*math.pi))
bridge(rings[-1],boundary)
body_start=head_count
arm_ranges={};finger_ranges={};leg_ranges={}
for side,lo in [(1,6),(-1,22)]:
 hi=lo+4
 rim=[rings[4][i] for i in range(lo,hi+1)]+[rings[5][hi]]+[rings[6][i] for i in range(hi,lo-1,-1)]+[rings[5][lo]]
 # Every boundary point extends into its own rounded arm strip.
 angles=[math.atan2(P[i][2]+.48,(P[i][1]-1.18)*1.5) for i in rim]
 prev=rim;start=len(P)
 for x,ry,rz in [(.237,.073,.075),(.267,.063,.065),(.32,.053,.055),(.40,.046,.046),(.49,.037,.039),(.54,.041,.043),(.64,.034,.036),(.76,.023,.025)]:
  rr=[vertex((side*x,1.19+ry*math.cos(a),-.48+rz*math.sin(a))) for a in angles]
  bridge(prev,rr);prev=rr
 # Palm and separately articulated fingers; no mitten silhouette.
 for x,ry,rz in [(.785,.023,.035),(.825,.019,.036),(.84,.014,.032)]:
  rr=[vertex((side*x,1.19+ry*math.cos(a),-.48+rz*math.sin(a))) for a in angles];bridge(prev,rr);prev=rr
 face(tuple(reversed(prev)))
 arm_ranges[side]=(start,len(P))
 for k,(z,length) in enumerate([(-.505,.064),(-.484,.077),(-.463,.071),(-.444,.054),(-.524,.054)]):
  start=len(P);prev=None
  for t,r in [(0,.010),(.35,.0095),(.7,.008),(1,.003)]:
   x=.825+t*length if k<4 else .79+t*.047
   zz=z if k<4 else z-t*.024
   rr=[vertex((side*x,1.19+r*math.cos(a*math.tau/8),zz+r*math.sin(a*math.tau/8))) for a in range(8)]
   if prev:bridge(prev,rr)
   prev=rr
  face(prev);finger_ranges[(side,k)]=(start,len(P))
# Legs and heels exist only in the showcase profile.
race_cut=len(P)
for side in [-1,1]:
 start=len(P);prev=None
 for y,x,rx,rz,z in [(.78,.102,.094,.095,-.48),(.65,.104,.086,.086,-.48),(.52,.105,.067,.070,-.48),(.43,.106,.046,.050,-.47),(.36,.107,.048,.052,-.48),(.27,.108,.053,.057,-.49),(.16,.109,.033,.038,-.48),(.10,.109,.025,.032,-.47)]:
  rr=[vertex((side*x+rx*math.sin(i*math.tau/24),y,z+rz*math.cos(i*math.tau/24))) for i in range(24)]
  if prev:bridge(prev,rr)
  prev=rr
 leg_ranges[side]=(start,len(P))

def mesh_obj(name,p,f,material,color):
 m=bpy.data.meshes.new(name);m.from_pydata([blender(v) for v in p],[],f);m.update()
 o=bpy.data.objects.new(name,m);bpy.context.collection.objects.link(o)
 m.materials.append(material)
 attr=m.color_attributes.new(name='Heroine paint',type='FLOAT_COLOR',domain='POINT')
 for i in range(len(p)):attr.data[i].color=color
 for poly in m.polygons:poly.use_smooth=True
 return o
materials=list(old.data.materials)
for o in list(bpy.data.objects):bpy.data.objects.remove(o,do_unlink=True)
bodymesh=bpy.data.meshes.new('R7H continuous upper back shoulders arms');bodymesh.from_pydata([blender(p) for p in P],[],F);bodymesh.update()
body=bpy.data.objects.new('heroine-body',bodymesh);bpy.context.collection.objects.link(body)
for m in materials:bodymesh.materials.append(m)
attr=bodymesh.color_attributes.new(name='Heroine paint',type='FLOAT_COLOR',domain='POINT')
for i,c in enumerate(C):attr.data[i].color=c
for poly,mi in zip(bodymesh.polygons,MI):poly.material_index=mi;poly.use_smooth=True
# Recalculate connected surface normals, then soften only authored body topology.
bm=bmesh.new();bm.from_mesh(bodymesh)
# Soften the shared shoulder socket before skinning. Only new body topology;
# the approved sculpt above the neck is not re-generated or subdivided.
bm.verts.ensure_lookup_table()
shoulders=[v for v in bm.verts if v.index>=head_count and v.co.z>1.09 and abs(v.co.x)<.32]
for _ in range(8):bmesh.ops.smooth_vert(bm,verts=shoulders,factor=.35,use_axis_x=True,use_axis_y=True,use_axis_z=True)
new_edges=[e for e in bm.edges if all(v.index>=head_count for v in e.verts)]
bmesh.ops.subdivide_edges(bm,edges=new_edges,cuts=1,use_grid_fill=True)
arm_vertices=[v for v in bm.verts if .26<abs(v.co.x)<.73 and v.co.z>1.10]
for _ in range(3):bmesh.ops.smooth_vert(bm,verts=arm_vertices,factor=.3,use_axis_x=True,use_axis_y=True,use_axis_z=True)
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(bodymesh);bm.free()
skin=bpy.data.materials.new('R7H skin');skin.use_nodes=True
bs=skin.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.65
vc=skin.node_tree.nodes.new('ShaderNodeVertexColor');vc.layer_name='Heroine paint';skin.node_tree.links.new(vc.outputs['Color'],bs.inputs['Base Color'])
bodymesh.materials[0]=skin
cloth=materials[1];cloth.name='R7H ivory satin';cloth.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.58
gold=materials[2];gold.name='R7H warm gold'
objects=[body];full_only=[]

def surface(name,rows,mat,color,closed=True):
 p=[v for row in rows for v in row];n=len(rows[0]);f=[]
 for j in range(1,len(rows)):
  for i in range(n if closed else n-1):
   k=(i+1)%n;f.append(((j-1)*n+i,(j-1)*n+k,j*n+k,j*n+i))
 o=mesh_obj(name,p,f,mat,color);objects.append(o);return o
def ribbon(name,path,width,depth,mat,color):
 if len(path)>=3:
  controls=[Vector(p) for p in path];path=[]
  for j in range(len(controls)-1):
   p0=controls[max(0,j-1)];p1=controls[j];p2=controls[j+1];p3=controls[min(len(controls)-1,j+2)]
   for k in range(6):
    t=k/6;path.append((2*p1+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t)*.5)
  path.append(controls[-1])
 rows=[]
 for j,p in enumerate(path):
  t=Vector(path[min(j+1,len(path)-1)])-Vector(path[max(0,j-1)]);t.normalize()
  across=t.cross(Vector((0,0,1))).normalized()
  if across.length<.1:across=Vector((1,0,0))
  normal=t.cross(across).normalized()
  taper=.55+.45*math.sin(math.pi*j/(len(path)-1))**.35
  rows.append([Vector(p)+across*width*taper*math.cos(i*math.tau/8)+normal*depth*math.sin(i*math.tau/8) for i in range(8)])
 return surface(name,rows,mat,color)
# Half-open-back wrap dress: raise the continuous back panel below the shoulder
# blades, blending through the sides into the unchanged front halter neckline.
# This is part of the dress, not a separate band or diagonal back straps.
dressrows=[]
for row in range(19):
 t=row/18;rr=[]
 for i in range(64):
  a=i*math.tau/64;s=math.sin(a);c=math.cos(a)
  front=max(c,0);top=.855+.035*abs(s)+.375*front**1.25+.245*(1-front)**2
  bottom=.48+.055*s+.018*math.cos(2*a)
  y=bottom+(top-bottom)*t
  if y<sections[0][0]:w=.197;d=.135
  else:
   a0,b0=next(((a0,b0) for a0,b0 in zip(sections,sections[1:]) if a0[0]<=y<=b0[0]),(sections[-2],sections[-1]))
   f=(y-a0[0])/(b0[0]-a0[0]);w=a0[1]*(1-f)+b0[1]*f;d=a0[2]*(1-f)+b0[2]*f
  w+=.017;d+=.017
  fold=.0035*math.sin(6*a+9*t)*math.sin(math.pi*t)+.002*math.cos(10*a-4*t)
  rr.append(((w+fold)*s,y,-.48+(d+fold)*c))
 dressrows.append(rr)
dress=surface('Ivory backless wrap minidress',dressrows,cloth,IVORY)
# Slender collar around the base of the neck and front crossed fabric only.
surface('Halter neck band',[[ (.068*math.sin(i*math.tau/40),y,-.46+.069*math.cos(i*math.tau/40)) for i in range(40)] for y in [1.278,1.304]],cloth,IVORY)
for side in [-1,1]:
 ribbon('Front crossover '+str(side),[(side*.055,1.295,-.405),(side*.025,1.27,-.387),(-side*.012,1.245,-.369),(-side*.060,1.185,-.363)],.020,.005,cloth,IVORY)
ribbon('Neck knot',[(0,1.252,-.374),(.008,1.24,-.365),(0,1.226,-.369)],.016,.010,cloth,IVORY)
# An overlaid curved wrap edge and gathered hip knot, with tapered loose tie.
wrap=[]
for j in range(17):
 t=j/16;rr=[]
 for i in range(33):
  a=-.9+i/32*2.15;y=(.49+.055*math.sin(a))*(1-t)+(.70-.18*math.sin(a))*t
  w=.207 if y<.76 else .207-(y-.76)*.36;d=.146 if y<.76 else .146-(y-.76)*.24
  fold=.003*math.sin(12*t+4*a)*math.sin(math.pi*t)
  rr.append(((w+fold)*math.sin(a),y,-.48+(d+fold)*math.cos(a)))
 wrap.append(rr)
surface('Diagonal wrap front',wrap,cloth,IVORY,False)
ribbon('Side waist gathered knot',[(-.157,.867,-.427),(-.17,.85,-.416),(-.165,.83,-.421)],.022,.014,cloth,IVORY)
surface('Side waist tie',[[(-.169+u,.844-t*.33,-.418+.03*t+.012*math.sin(t*8)) for u in [-.019*(1-t*.7),.019*(1-t*.7)]] for t in [i/16 for i in range(17)]],cloth,IVORY,False)
# Golden wrist bracelet; shoes with soles, heel posts, toe and ankle straps.
for side in [-1,1]:
 surface('Gold bracelet '+str(side),[[(side*x,1.19+.027*math.cos(i*math.tau/20),-.48+.030*math.sin(i*math.tau/20)) for i in range(20)] for x in [.737,.753]],gold,GOLD)
 before=len(objects)
 surface('Foot '+str(side),[[ (side*.109+rx*math.sin(i*math.tau/24),y+lift*max(0,-math.cos(i*math.tau/24)),z+dz*math.cos(i*math.tau/24)) for i in range(24)] for y,rx,dz,z,lift in [(.036,.043,.091,-.42,.075),(.065,.041,.080,-.42,.060),(.12,.027,.034,-.47,0)]],skin,SKIN)
 surface('Ivory sandal sole '+str(side),[[ (side*.109+.046*math.sin(i*math.tau/32),y+.075*max(0,-math.cos(i*math.tau/32)),-.42+.096*math.cos(i*math.tau/32)) for i in range(32)] for y in [.024,.036]],cloth,IVORY)
 ribbon('Sandal heel '+str(side),[(side*.109,.015,-.50),(side*.109,.115,-.50)],.009,.009,cloth,IVORY)
 for z,y in [(-.365,.064),(-.475,.114)]:
  ribbon('Sandal strap '+str(side),[(side*.109+.041*math.cos(a),y+.018*math.sin(a),z+.012*math.sin(a)) for a in [i*math.pi/12 for i in range(13)]],.006,.003,cloth,IVORY)
 full_only.extend(objects[before:])

# Small opaque oral cavity and upper teeth, belonging to the same head rig.
for label,cx,cy,cz,sx,sy,sz,color in [('Mouth interior',0,1.403,-.357,.031,.011,.003,(.055,.008,.011,1)),('Upper teeth',0,1.406,-.342,.026,.002,.001,(.91,.87,.77,1))]:
 rows=[]
 for j in range(13):
  v=math.pi*(j+.05)/12.1
  rows.append([(cx+sx*math.sin(v)*math.cos(i*math.tau/20),cy+sy*math.cos(v),cz+sz*math.sin(v)*math.sin(i*math.tau/20)) for i in range(20)])
 surface(label,rows,skin,color)

# Rig is deliberately small; arms are in the SAME skin mesh as shoulders.
arm=bpy.data.armatures.new('Heroine R7H rig');rig=bpy.data.objects.new('heroine-r7h-rig',arm);bpy.context.collection.objects.link(rig)
bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
rests={'root':(0,.80,-.48),'head':(0,1.30,-.46)}
for side in [-1,1]:
 for name,p in [('upper',(side*.20,1.19,-.48)),('fore',(side*.49,1.19,-.48)),('hand',(side*.76,1.19,-.48)),('thigh',(side*.105,.78,-.48)),('shin',(side*.106,.43,-.47)),('foot',(side*.109,.10,-.47))]:rests[f'{name}{side}']=p
for name,p in rests.items():
 b=arm.edit_bones.new(name);b.head=blender(p);b.tail=b.head+Vector((0,0,.10))
 if name!='root':b.parent=arm.edit_bones['root']
bpy.ops.object.mode_set(mode='OBJECT')
def clamp(x):return max(0,min(1,x))
def smooth(x):x=clamp(x);return x*x*(3-2*x)
def bind(o,profile='body'):
 groups={n:o.vertex_groups.new(name=n) for n in rests}
 for v in o.data.vertices:
  x,y,z=game(v.co);weights={'root':1}
  if y>1.26: h=smooth((y-1.26)/.10);weights={'root':1-h,'head':h}
  elif profile=='body' and abs(x)>.16 and y>1.10:
   side=1 if x>0 else -1;d=abs(x);a=smooth((d-.15)/.12);f=smooth((d-.46)/.06);hand=smooth((d-.73)/.05)
   weights={'root':1-a,f'upper{side}':a*(1-f),f'fore{side}':a*f*(1-hand),f'hand{side}':a*f*hand}
  elif profile=='body' and y<.75:
   side=1 if x>0 else -1;t=smooth((.47-y)/.08);foot=smooth((.15-y)/.06)
   weights={f'thigh{side}':1-t,f'shin{side}':t*(1-foot),f'foot{side}':t*foot}
  elif o.name.startswith('Gold bracelet'):weights={f'hand{1 if x>0 else -1}':1}
  elif o in full_only:weights={f'foot{1 if x>0 else -1}':1}
  for n,w in weights.items():
   if w>0:groups[n].add([v.index],w,'REPLACE')
 mod=o.modifiers.new('Unified heroine rig','ARMATURE');mod.object=rig;o.parent=rig
for o in objects:bind(o,'body' if o==body else 'garment')
hidden=body.vertex_groups.new(name='showcase-only')
hidden.add([v.index for v in body.data.vertices if v.co.z<.76],1,'REPLACE')
for o in full_only:o.vertex_groups.new(name='showcase-only').add(list(range(len(o.data.vertices))),1,'REPLACE')
# Shared material primitives and a single deforming mesh, not one draw per tie.
bpy.ops.object.select_all(action='DESELECT')
for o in objects:o.select_set(True)
bpy.context.view_layer.objects.active=body;bpy.ops.object.join();objects=[body]
# Smooth the NEW torso/arms only, never subdivide/reconstruct the approved face.
body.shape_key_add(name='Basis');smile=body.shape_key_add(name='smile');opened=body.shape_key_add(name='mouthOpen');pucker=body.shape_key_add(name='pucker');cupped=body.shape_key_add(name='handCup')
for i,v in enumerate(body.data.vertices):
 x,y,z=game(v.co)
 if abs(x)>.825 and 1.16<y<1.22:
  curl=smooth((abs(x)-.825)/.075)
  cupped.data[i].co.x-=math.copysign(.014*curl,x);cupped.data[i].co.y-=.020*curl
 if y<1.34:continue
 front=smooth((z+.40)/.04)
 w=math.exp(-(x/.048)**4-((y-1.404)/.022)**4)*front
 opened.data[i].co.z-=.016*w*smooth((1.412-y)/.012)
 smile.data[i].co.z+=.003*math.exp(-((abs(x)-.037)/.018)**2-((y-1.408)/.018)**2)*front
 pucker.data[i].co.x*=1-.18*w;pucker.data[i].co.y-=.008*w

# Pose clips authored in Blender; the game only plays these small tracks.
def orient(name,pos,direction=None,rotation=None):
 b=rig.pose.bones[name];rest=arm.bones[name].matrix_local.to_quaternion()
 q=Quaternion()
 if direction is not None:q=Vector((1 if name.endswith('1') and not name.endswith('-1') else -1,0,0)).rotation_difference(Vector(direction).normalized())
 if rotation is not None:q=rotation
 # quaternion given in vehicle coordinates -> Blender coordinates
 basis=Matrix(((1,0,0),(0,0,-1),(0,1,0)))
 qb=(basis@q.to_matrix()@basis.inverted()).to_quaternion()
 desired=Matrix.Translation(blender(pos))@(qb@rest).to_matrix().to_4x4()
 b.matrix_basis=arm.bones[name].matrix_local.inverted()@desired
def pose(action,t):
 duration=2.2 if action=='victory' else 1.8
 w=smooth(t/.36)*(1-smooth((t-(duration-.42))/.42))
 left=action.endswith('Left');right=action.endswith('Right');kiss=action.startswith('kiss')
 yaw=(.40 if left else -.30 if right else 0)*w;rise=(.32 if left else .07 if action=='victory' else 0)*w
 root=rig.pose.bones['root'];root.matrix_basis=Matrix.Identity(4)
 body.data.shape_keys.key_blocks['smile'].value=.45
 opened.value=(.8 if action=='victory' or action.startswith('shout') else 0)*w;pucker.value=w if kiss else 0
 cupped.value=(.8 if action.startswith('shout') else .3 if action=='victory' else 0)*w
 # Bone matrices here are object-space; root movement is applied once below.
 for name,p in rests.items():
  if name!='root':orient(name,p)
 headyaw=(.80 if left else -.95 if right else 0)*w
 orient('head',rests['head'],rotation=Quaternion(Vector((0,1,0)),headyaw))
 for side in [-1,1]:
  shoulder=Vector(rests[f'upper{side}']);restW=Vector((side*.135,.86,-.29))
  target=restW.copy()
  if action in ('victory','applause'):target=Vector((side*.29,1.73,-.42))
  elif action=='wave' and side==-1:target=Vector((-.34,1.72,-.40))
  elif (right and side==-1) or (left and side==1):
   sign=1 if left else -1
   release=smooth((t-.70)/.33) if kiss else 0
   target=Vector((sign*(.15+.32*release),1.43-.035*release,-.37-.02*release))
  wrist=restW.lerp(target,w);delta=wrist-shoulder;length=min(delta.length,.555);axis=delta.normalized();wrist=shoulder+axis*length
  along=(length*length+.29**2-.27**2)/(2*length)
  bend=Vector((side*.65,-.6,-.5));bend=(bend-axis*bend.dot(axis)).normalized()
  elbow=shoulder+axis*along+bend*math.sqrt(max(0,.29**2-along**2))
  orient(f'upper{side}',shoulder,elbow-shoulder);orient(f'fore{side}',elbow,wrist-elbow)
  handDir=(wrist-elbow).normalized()
  if (right and side==-1) or (left and side==1):handDir=handDir.lerp(Vector((side*.7,.65,0)),w).normalized()
  orient(f'hand{side}',wrist,handDir)
 # Apply torso rise/turn to all child matrices, preserving coherent shoulders.
 pivot=blender(rests['root']);transform=Matrix.Translation(pivot+Vector((0,0,rise)))@Matrix.Rotation(yaw,4,'Z')@Matrix.Translation(-pivot)
 root.matrix_basis=arm.bones['root'].matrix_local.inverted()@transform@arm.bones['root'].matrix_local

for action in ['shoutRight','kissRight','shoutLeft','kissLeft','victory','wave','applause']:
 rig.animation_data_create();body.data.shape_keys.animation_data_create()
 rig.animation_data.action=bpy.data.actions.new(action+'-rig');body.data.shape_keys.animation_data.action=bpy.data.actions.new(action+'-face')
 duration=2.2 if action=='victory' else 1.8
 for frame in range(round(duration*30)+1):
  pose(action,frame/30)
  for b in rig.pose.bones:
   b.keyframe_insert('location',frame=frame);b.keyframe_insert('rotation_quaternion' if b.rotation_mode=='QUATERNION' else 'rotation_euler',frame=frame);b.keyframe_insert('scale',frame=frame)
  for key in body.data.shape_keys.key_blocks:
   if key.name!='Basis':key.keyframe_insert('value',frame=frame)
 for owner in [rig,body.data.shape_keys]:
  data=owner.animation_data;track=data.nla_tracks.new();track.name=action
  track.strips.new(action,0,data.action);data.action=None
 for owner in [rig,body.data.shape_keys]:
  for track in owner.animation_data.nla_tracks:track.mute=True

pose('idle',0)
for owner in [rig,body.data.shape_keys]:
 for track in owner.animation_data.nla_tracks:track.mute=False
bpy.context.scene.render.fps=30
# The showcase carries an untouched imported copy of R6d. Race keeps using the
# existing separate runtime asset and Spring Bones, with no duplicate scalp.
existing=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=str(hair));hair_objects=list(set(bpy.data.objects)-existing)
for o in hair_objects:
 if not o.parent:
  o.location+=Vector((0,.465,1.485));bpy.context.view_layer.update();world=o.matrix_world.copy()
  o.parent=rig;o.parent_type='BONE';o.parent_bone='head';o.matrix_world=world;o['frozen_R6d']=True
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'r7h-heroine-fullbody.blend'),compress=True)
def export(path,selected):
 bpy.ops.object.select_all(action='DESELECT')
 for o in selected:o.select_set(True)
 bpy.context.view_layer.objects.active=rig
 bpy.ops.export_scene.gltf(filepath=str(path),use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_skins=True,export_morph=True,export_extras=True)
export(ROOT/'public/assets/characters/coast-heroine-r7h-full.glb',objects+[rig]+hair_objects)
# Race profile strips leg vertices and shoes, shares ALL visible source surfaces.
saved_keys={key.name:{tuple(round(x,7) for x in v.co):key.data[i].co.copy() for i,v in enumerate(body.data.vertices)} for key in body.data.shape_keys.key_blocks}
saved_actions=[(t.name,t.strips[0].action) for t in body.data.shape_keys.animation_data.nla_tracks]
body.shape_key_clear();bm=bmesh.new();bm.from_mesh(body.data)
deform=bm.verts.layers.deform.active;hidden_id=body.vertex_groups['showcase-only'].index
bmesh.ops.delete(bm,geom=[v for v in bm.verts if v[deform].get(hidden_id,0)>.5],context='VERTS');bm.to_mesh(body.data);bm.free()
# Reattach face keys from exported master without a second sculpt.
body.shape_key_add(name='Basis')
for key in ['smile','mouthOpen','pucker','handCup']:
 k=body.shape_key_add(name=key)
 for i,v in enumerate(body.data.vertices):k.data[i].co=saved_keys[key].get(tuple(round(x,7) for x in v.co),v.co)
body.data.shape_keys.animation_data_create()
for name,action in saved_actions:
 nt=body.data.shape_keys.animation_data.nla_tracks.new();nt.name=name
 nt.strips.new(name,0,action)
export(ROOT/'public/assets/characters/coast-heroine-r7h-race.glb',objects+[rig])
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==source_hash
assert hashlib.sha256(hair.read_bytes()).hexdigest()==hair_hash
(REVIEW/'source-audit.json').write_text(json.dumps({'source':str(SOURCE),'sourceSha256':source_hash,'hairSha256':hair_hash,'referenceSha256':'06bee74821689b671f13e56892cac3a328b9bd3a8c873ca27c6c4164bcd34cf4','fullbody':str(OUT/'r7h-heroine-fullbody.blend')},indent=2))
print('R7H EXPORT COMPLETE')
