"""One R6f art prototype: 16 closed sculpted locks, 16 independent spring chains.
Blender -b -P this.py -- public/assets/characters/coast-blonde-r6f.glb
Hand-authored head-local curves, one opaque vertex-coloured skin. No old shell.
"""
import bpy, math, sys, json
from pathlib import Path
from mathutils import Vector
out=Path(sys.argv[sys.argv.index('--')+1]);assert out.name=='coast-blonde-r6f.glb'
bpy.ops.wm.read_factory_settings(use_empty=True)
# Coordinates below use game axes (+Y up, +Z front); convert once to Blender.
def b(v):return Vector((v[0],-v[2],v[1]))
guides=[
 ('swept-fringe',[(.04,.18,.105),(-.04,.22,.16),(-.15,.13,.17),(-.17,.04,.11)],.052),
 ('left-crown',[(.04,.195,.05),(-.07,.22,.075),(-.19,.09,.085),(-.19,-.035,.02)],.050),
 ('left-upper', [(-.01,.185,0),(-.13,.21,-.02),(-.22,.045,-.02),(-.20,-.08,-.075)],.049),
 ('left-temple',[(-.12,.10,.04),(-.195,.09,.10),(-.22,-.055,.04),(-.195,-.13,-.03)],.040),
 ('left-nape',[(-.12,.055,-.05),(-.20,.02,-.08),(-.20,-.11,-.10),(-.16,-.16,-.14)],.036),
 ('left-rear',[(.02,.19,-.04),(-.055,.21,-.145),(-.145,.035,-.21),(-.12,-.085,-.18)],.048),
 ('rear-crown',[(.07,.18,-.07),(.005,.185,-.19),(-.06,.025,-.23),(-.025,-.105,-.20)],.050),
 ('right-rear',[(.10,.155,-.09),(.16,.13,-.18),(.17,-.02,-.20),(.115,-.10,-.18)],.047),
 ('right-crown',[(.075,.18,.045),(.155,.21,.045),(.205,.07,.0),(.17,-.035,-.06)],.050),
 ('right-fringe',[(.08,.16,.11),(.13,.19,.18),(.18,.08,.18),(.16,.015,.13)],.045),
 ('right-temple',[(.14,.09,.035),(.20,.075,.09),(.22,-.03,.07),(.20,-.10,.01)],.038),
 ('right-nape',[(.12,.045,-.08),(.19,.015,-.10),(.21,-.105,-.085),(.16,-.15,-.13)],.035),
 ('lower-left',[(-.095,.06,-.11),(-.14,.005,-.19),(-.145,-.12,-.205),(-.09,-.17,-.19)],.036),
 ('lower-centre',[(-.02,.055,-.13),(-.06,-.015,-.205),(-.05,-.13,-.23),(-.005,-.18,-.20)],.034),
 ('lower-right',[(.06,.065,-.12),(.10,.01,-.205),(.15,-.10,-.205),(.09,-.165,-.19)],.036),
 ('rear-overlap',[(.03,.16,-.12),(.075,.12,-.215),(.005,.025,-.245),(.04,-.06,-.21)],.043),
]
def bezier(cp,t):return (1-t)**3*cp[0]+3*(1-t)**2*t*cp[1]+3*(1-t)*t*t*cp[2]+t**3*cp[3]
def smooth(a,z,x):
    t=max(0,min(1,(x-a)/(z-a)));return t*t*(3-2*t)
vertices=[];faces=[];colours=[];weights=[]
def vertex(v,c,w):
    index=len(vertices);vertices.append(tuple(b(v)));colours.append(c);weights.append(w);return index
# Recessed rounded inner hair, open-face border, closed underneath. It is not
# the old sculpted outer shell. All visible gold body surfaces come from locks.
around=32;bands=12
top=vertex((0,.177,0),(.19,.072,.018,1),{'fixed-crown':1})
for j in range(1,bands+1):
    for k in range(around):
        az=k*2*math.pi/around;front=max(0,math.cos(az))
        limit=2.30-.98*front**3;theta=limit*j/bands
        vertex((.140*math.sin(theta)*math.sin(az),.005+.172*math.cos(theta),.135*math.sin(theta)*math.cos(az)),(.19,.072,.018,1),{'fixed-crown':1})
for k in range(around):faces.append((top,1+k,1+(k+1)%around))
for j in range(bands-1):
    for k in range(around):
        a=1+j*around+k;c=1+j*around+(k+1)%around
        faces.extend([(a,a+around,c),(c,a+around,c+around)])
bottom=vertex((0,-.08,-.02),(.19,.072,.018,1),{'fixed-crown':1})
for k in range(around):faces.append((bottom,1+(bands-1)*around+(k+1)%around,1+(bands-1)*around+k))
cap_vertices=len(vertices);cap_triangles=len(faces)
palettes=[(.84,.47,.16),(.73,.36,.10),(.90,.55,.21),(.66,.30,.08)]
rig_points=[];audit=[];rings=19;sides=12
for number,(name,points,width) in enumerate(guides):
    cp=list(map(Vector,points));centres=[bezier(cp,j/(rings-1)) for j in range(rings)]
    rig_points.append([bezier(cp,j/4) for j in range(5)])
    start=len(vertices);tone=palettes[number%len(palettes)]
    for j,center in enumerate(centres):
        t=j/(rings-1);tangent=(centres[min(j+1,rings-1)]-centres[max(j-1,0)]).normalized()
        normal=(center-Vector((0,.005,0))).normalized();side=tangent.cross(normal).normalized();normal=side.cross(tangent).normalized()
        shape=(.30+.70*math.sin(math.pi*t)**.8)*(1-.98*smooth(.65,1,t))
        along=t*4;lo=min(3,int(along));mix=along-lo;root_pin=1-smooth(0,.14,t)
        skin={'fixed-crown':root_pin,f'lock-{number}-{lo}':(1-root_pin)*(1-mix),f'lock-{number}-{lo+1}':(1-root_pin)*mix}
        for k in range(sides):
            phi=k*2*math.pi/sides;crest=max(0,math.sin(phi));v=center+side*(math.cos(phi)*width*.5*shape)+normal*(math.sin(phi)*.007*shape)
            shade=(.72+.28*crest)*(.78+.22*smooth(0,.3,t))
            colour=tuple(min(1,tone[i]*shade+(.065,.055,.025)[i]*crest**4*math.sin(math.pi*t)) for i in range(3))+(1,)
            vertex(v,colour,skin)
    local=[]
    for j in range(rings-1):
        for k in range(sides):
            a=start+j*sides+k;c=start+j*sides+(k+1)%sides
            local.extend([(a,c,a+sides),(c,c+sides,a+sides)])
    for k in range(1,sides-1):
        local.append((start,start+k+1,start+k));end=start+(rings-1)*sides
        local.append((end,end+k,end+k+1))
    faces.extend(local);audit.append({'name':name,'vertices':rings*sides,'triangles':len(local),'widthMeters':width})
mesh=bpy.data.meshes.new('R6f sixteen tapered volumes and recessed inner hair');mesh.from_pydata(vertices,[],faces);mesh.update()
hair=bpy.data.objects.new('blender-blonde-spring',mesh);bpy.context.collection.objects.link(hair)
attribute=mesh.color_attributes.new(name='Gold groups',type='FLOAT_COLOR',domain='POINT')
for i,c in enumerate(colours):attribute.data[i].color=c
for face in mesh.polygons:face.use_smooth=True
# Recalculate outward normals independently for closed cap and each lock.
import bmesh
bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
material=bpy.data.materials.new('R6f honey crests and deep amber inner hair');material.use_nodes=True
bsdf=material.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Roughness'].default_value=.57
color=material.node_tree.nodes.new('ShaderNodeVertexColor');color.layer_name='Gold groups';material.node_tree.links.new(color.outputs['Color'],bsdf.inputs['Base Color']);hair.data.materials.append(material)
arm=bpy.data.armatures.new('R6f independent lock chains');rig=bpy.data.objects.new('R6f blonde rig',arm);bpy.context.collection.objects.link(rig)
rig['windSlots']=[(.25+(i*.618%1)*2.4)+(3 if p[-1][0]>0 else 0) for i,(_,p,_) in enumerate(guides)]
hair['capTriangles']=cap_triangles;hair['lockCount']=16
bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
crown=arm.edit_bones.new('fixed-crown');crown.head=(0,0,0);crown.tail=(0,0,.04)
for chain,points in enumerate(rig_points):
    parent=crown
    for depth in range(5):
        bone=arm.edit_bones.new(f'lock-{chain}-{depth}');bone.head=b(points[depth]);bone.tail=b(points[depth+1]) if depth<4 else b(points[depth]+(points[depth]-points[depth-1]).normalized()*.008)
        bone.parent=parent;parent=bone
bpy.ops.object.mode_set(mode='OBJECT')
groups={bone.name:hair.vertex_groups.new(name=bone.name) for bone in arm.bones}
for i,skin in enumerate(weights):
    for name,w in skin.items():
        if w>1e-7:groups[name].add([i],w,'REPLACE')
mod=hair.modifiers.new('Existing Spring Bone GPU skin','ARMATURE');mod.object=rig;hair.parent=rig
bpy.ops.object.select_all(action='DESELECT');hair.select_set(True);rig.select_set(True);bpy.context.view_layer.objects.active=hair
bpy.ops.export_scene.gltf(filepath=str(out.resolve()),use_selection=True,export_animations=False,export_morph=False,export_skins=True,export_extras=True)
bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=str(Path('art-prototype/output/r6f-sixteen-locks.blend').resolve()),compress=True)
report={'locks':16,'independentChains':16,'activeJoints':64,'bones':81,'triangles':len(faces),'vertices':len(vertices),'capTriangles':cap_triangles,'capVertices':cap_vertices,'capTrianglePercent':100*cap_triangles/len(faces),'bytes':out.stat().st_size,'materials':1,'strands':audit}
Path('docs/art-review/r6f/asset-audit.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
