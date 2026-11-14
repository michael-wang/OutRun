"""R6g single controlled layered bob prototype, authored in head-local metres.
Blender -b -P scripts/blender/export_r6g_hair.py -- public/assets/characters/coast-blonde-r6g.glb
Eight wrapping primary volumes, ten short edge feathers, recessed honey inner mass.
"""
import bpy, math, sys, json, bmesh
from pathlib import Path
from mathutils import Vector
out=Path(sys.argv[sys.argv.index('--')+1]);assert out.name=='coast-blonde-r6g.glb'
bpy.ops.wm.read_factory_settings(use_empty=True)
def b(v):return Vector((v[0],-v[2],v[1]))
def smooth(a,z,x):
    t=max(0,min(1,(x-a)/(z-a)));return t*t*(3-2*t)
def bezier(cp,t):return (1-t)**3*cp[0]+3*(1-t)**2*t*cp[1]+3*(1-t)*t*t*cp[2]+t**3*cp[3]
# Theta / azimuth curves wrap the head instead of bridging over it like stalks.
# +Z is the face; azimuth 0 is front, pi is rear. Each root is buried under
# a neighbouring primary lock. Width is full cross-section width in metres.
guides=[
 ('sweeping-fringe',[(.24,.50),(.58,-.05),(1.02,-.85),(1.66,-1.55)],.094),
 ('left-temple-wrap',[(.43,-.32),(.87,-.73),(1.43,-1.19),(2.12,-1.72)],.104),
 ('left-back-wrap',[(.34,-1.70),(.86,-1.91),(1.56,-2.12),(2.30,-2.47)],.108),
 ('rear-left-sweep',[(.16,-2.70),(.78,-2.74),(1.58,-2.92),(2.34,-3.23)],.107),
 ('rear-right-wrap',[(.39,2.18),(.94,2.33),(1.57,2.61),(2.27,2.84)],.102),
 ('right-temple-wrap',[(.43,1.12),(.92,1.28),(1.57,1.51),(2.13,1.85)],.100),
 ('short-part-fringe',[(.31,.62),(.72,.69),(1.13,.93),(1.80,1.27)],.078),
 ('nape-overlap',[(1.02,3.06),(1.48,3.18),(1.95,3.39),(2.39,3.57)],.079),
 # Deliberately shorter, mostly below the broad primary forms.
 ('left-ear-edge',[(1.20,-1.12),(1.50,-1.28),(1.84,-1.39),(2.10,-1.59)],.032),
 ('left-ear-feather',[(1.44,-1.42),(1.73,-1.52),(2.03,-1.64),(2.22,-1.91)],.027),
 ('left-nape-feather',[(1.60,-1.98),(1.88,-2.09),(2.15,-2.23),(2.36,-2.47)],.031),
 ('back-left-edge',[(1.63,-2.54),(1.88,-2.62),(2.16,-2.69),(2.43,-2.96)],.030),
 ('back-centre-edge',[(1.70,-3.02),(1.95,-3.14),(2.18,-3.21),(2.44,-3.38)],.029),
 ('back-right-edge',[(1.57,2.54),(1.87,2.66),(2.14,2.82),(2.38,3.02)],.031),
 ('right-nape-feather',[(1.59,2.01),(1.88,2.11),(2.15,2.24),(2.35,2.48)],.030),
 ('right-ear-feather',[(1.36,1.36),(1.70,1.47),(1.99,1.63),(2.22,1.90)],.028),
 ('left-side-flick',[(1.30,-.86),(1.56,-1.02),(1.81,-1.19),(1.97,-1.43)],.025),
 ('right-side-flick',[(1.24,1.01),(1.51,1.12),(1.80,1.28),(1.99,1.53)],.025),
]
vertices=[];faces=[];colours=[];weights=[]
def vertex(v,c,w):
    i=len(vertices);vertices.append(tuple(b(v)));colours.append(c);weights.append(w);return i
around=40;bands=14
inner=(.43,.235,.068,1)
top=vertex((0,.166,0),inner,{'fixed-crown':1})
for j in range(1,bands+1):
    for k in range(around):
        az=k*2*math.pi/around;front=max(0,math.cos(az))
        # Keep the underlayer behind the temple, never a honey-coloured cheek.
        limit=2.30-1.15*front**.8;theta=limit*j/bands
        c=tuple(v*(.92+.08*math.cos(theta/2)) for v in inner[:3])+(1,)
        vertex((.137*math.sin(theta)*math.sin(az),-.006+.172*math.cos(theta),.133*math.sin(theta)*math.cos(az)),c,{'fixed-crown':1})
for k in range(around):faces.append((top,1+k,1+(k+1)%around))
for j in range(bands-1):
    for k in range(around):
        a=1+j*around+k;c=1+j*around+(k+1)%around
        faces.extend([(a,a+around,c),(c,a+around,c+around)])
bottom=vertex((0,-.09,-.025),inner,{'fixed-crown':1})
for k in range(around):faces.append((bottom,1+(bands-1)*around+(k+1)%around,1+(bands-1)*around+k))
cap_vertices=len(vertices);cap_triangles=len(faces)
palette=[(.83,.50,.19),(.75,.405,.12),(.88,.56,.23),(.78,.45,.15)]
rig_points=[];audit=[];rings=21;sides=12
for number,(name,points,width) in enumerate(guides):
    primary=number<8;cp=list(map(Vector,points))
    def point(t):
        theta,az=bezier(cp,t)
        # Root close to the inner mass, shallow rounded mid volume, restrained
        # outward flick only at the short lower edges. No large root air gaps.
        lift=(.006 if primary else .003)*math.sin(math.pi*t)+(.014 if primary else .022)*smooth(.70,1,t)-.018*(1-smooth(0,.16,t))
        r=(.146+lift,.180+lift*.35,.143+lift)
        return Vector((r[0]*math.sin(theta)*math.sin(az),-.004+r[1]*math.cos(theta),r[2]*math.sin(theta)*math.cos(az)))
    centres=[point(j/(rings-1)) for j in range(rings)]
    rig_points.append([point(j/3) for j in range(4)])
    start=len(vertices);tone=palette[number%len(palette)]
    for j,center in enumerate(centres):
        t=j/(rings-1);tangent=(centres[min(j+1,rings-1)]-centres[max(j-1,0)]).normalized()
        normal=(center-Vector((0,-.004,0))).normalized();side=tangent.cross(normal).normalized();normal=side.cross(tangent).normalized()
        # Broad embedded root, convex body, long tapered final third. At no
        # point are these flat cards or carved grooves on the inner shell.
        shape=(.70+.30*math.sin(math.pi*t))*(1-.99*smooth(.48 if primary else .32,1,t))
        along=t*3;lo=min(2,int(along));mix=along-lo;pin=1-smooth(.06,.34 if primary else .19,t)
        skin={'fixed-crown':pin,f'lock-{number}-{lo}':(1-pin)*(1-mix),f'lock-{number}-{lo+1}':(1-pin)*mix}
        for k in range(sides):
            phi=k*2*math.pi/sides;crest=max(0,math.sin(phi));thickness=.013 if primary else .005
            v=center+side*(math.cos(phi)*width*.5*shape)+normal*(math.sin(phi)*thickness*shape)
            shade=(.77+.23*crest)*(.84+.16*smooth(0,.32,t))
            c=tuple(min(1,tone[i]*shade+(.045,.034,.015)[i]*crest**6*math.sin(math.pi*t)) for i in range(3))+(1,)
            vertex(v,c,skin)
    local=[]
    for j in range(rings-1):
        for k in range(sides):
            a=start+j*sides+k;c=start+j*sides+(k+1)%sides
            local.extend([(a,c,a+sides),(c,c+sides,a+sides)])
    for k in range(1,sides-1):
        local.append((start,start+k+1,start+k));end=start+(rings-1)*sides;local.append((end,end+k,end+k+1))
    faces.extend(local);audit.append({'name':name,'layer':'primary' if primary else 'secondary','vertices':rings*sides,'triangles':len(local),'widthMeters':width,'lengthMeters':sum((centres[i]-centres[i-1]).length for i in range(1,rings))})
mesh=bpy.data.meshes.new('R6g controlled layered bob volumes');mesh.from_pydata(vertices,[],faces);mesh.update()
hair=bpy.data.objects.new('blender-blonde-spring',mesh);bpy.context.collection.objects.link(hair)
attribute=mesh.color_attributes.new(name='Gold groups',type='FLOAT_COLOR',domain='POINT')
for i,c in enumerate(colours):attribute.data[i].color=c
for face in mesh.polygons:face.use_smooth=True
bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
material=bpy.data.materials.new('R6g warm honey layers');material.use_nodes=True
bsdf=material.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Roughness'].default_value=.62
color=material.node_tree.nodes.new('ShaderNodeVertexColor');color.layer_name='Gold groups';material.node_tree.links.new(color.outputs['Color'],bsdf.inputs['Base Color']);hair.data.materials.append(material)
arm=bpy.data.armatures.new('R6g primary and feather chains');rig=bpy.data.objects.new('R6g blonde rig',arm);bpy.context.collection.objects.link(rig)
rig['windSlots']=[(.25+(i*.618%1)*2.4)+(3 if math.sin(p[-1][1])>0 else 0) for i,(_,p,_) in enumerate(guides)]
rig['primaryCount']=8;hair['capTriangles']=cap_triangles;hair['lockCount']=18
bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
crown=arm.edit_bones.new('fixed-crown');crown.head=(0,0,0);crown.tail=(0,0,.04)
for chain,points in enumerate(rig_points):
    parent=crown
    for depth in range(4):
        bone=arm.edit_bones.new(f'lock-{chain}-{depth}');bone.head=b(points[depth]);bone.tail=b(points[depth+1]) if depth<3 else b(points[depth]+(points[depth]-points[depth-1]).normalized()*.008)
        bone.parent=parent;parent=bone
bpy.ops.object.mode_set(mode='OBJECT')
groups={bone.name:hair.vertex_groups.new(name=bone.name) for bone in arm.bones}
for i,skin in enumerate(weights):
    for name,w in skin.items():
        if w>1e-7:groups[name].add([i],w,'REPLACE')
mod=hair.modifiers.new('Existing Spring Bone GPU skin','ARMATURE');mod.object=rig;hair.parent=rig
bpy.ops.object.select_all(action='DESELECT');hair.select_set(True);rig.select_set(True);bpy.context.view_layer.objects.active=hair
bpy.ops.export_scene.gltf(filepath=str(out.resolve()),use_selection=True,export_animations=False,export_morph=False,export_skins=True,export_extras=True)
bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=str(Path('art-prototype/output/r6g-layered-bob.blend').resolve()),compress=True)
report={'primaryLocks':8,'secondaryLocks':10,'independentChains':18,'activeJoints':54,'bones':73,'triangles':len(faces),'vertices':len(vertices),'capTriangles':cap_triangles,'capVertices':cap_vertices,'capTrianglePercent':100*cap_triangles/len(faces),'bytes':out.stat().st_size,'materials':1,'strands':audit}
Path('docs/art-review/r6g').mkdir(parents=True,exist_ok=True);Path('docs/art-review/r6g/asset-audit.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
