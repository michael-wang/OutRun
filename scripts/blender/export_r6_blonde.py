"""R6: accepted Blender bob -> opaque, medium-to-tip skinned driving groom.
blender -b ACCEPTED.blend -P this.py -- OUTPUT.glb NEW_STUDY.blend
Never overwrites the accepted study. No generated character or alpha hair.
"""
import bpy, bmesh, sys, json, math
import numpy as np
from pathlib import Path
from mathutils import Vector

output, study = map(Path, sys.argv[sys.argv.index('--')+1:])
source = next(o for o in bpy.context.scene.objects if o.name.startswith('Blonde bob'))
for ob in bpy.context.scene.objects:
    ob.hide_render = True
    ob.hide_set(True)
hair = source.copy(); hair.data = source.data.copy()
bpy.context.collection.objects.link(hair)
hair.hide_render = False; hair.hide_set(False)
hair.animation_data_clear(); hair.shape_key_clear()
bpy.ops.object.select_all(action='DESELECT')
hair.select_set(True); bpy.context.view_layer.objects.active = hair
hair.data.calc_loop_triangles()
decimate = hair.modifiers.new('R6 silhouette and layered tips', 'DECIMATE')
decimate.ratio = 2300 / len(hair.data.loop_triangles)
decimate.use_collapse_triangulate = True
bpy.ops.object.modifier_apply(modifier=decimate.name)
bm = bmesh.new(); bm.from_mesh(hair.data)
unseen = set(bm.verts); scraps = []
while unseen:
    seed = unseen.pop(); component = {seed}; stack = [seed]
    while stack:
        for edge in stack.pop().link_edges:
            for vertex in edge.verts:
                if vertex in unseen:
                    unseen.remove(vertex); component.add(vertex); stack.append(vertex)
    if len({f for v in component for f in v.link_faces}) <= 2: scraps.extend(component)
bmesh.ops.delete(bm, geom=scraps, context='VERTS')
bm.to_mesh(hair.data); bm.free()
v = np.array([p.co[:] for p in hair.data.vertices]) * .25 + [0,0,-.048]
original = v.copy()
angles = np.radians([-83,-51,-20,15,48,81])
def smooth(a,b,x):
    t = np.clip((x-a)/(b-a),0,1); return t*t*(3-2*t)
az = np.arctan2(v[:,0],v[:,1]); radius = np.hypot(v[:,0],v[:,1])
group = np.argmin(abs(az[:,None]-angles),axis=1)
# Preserve crown/fringe. Narrow existing lower sculpted fans into separated
# terminal locks; retain their existing layer relief and asymmetric silhouette.
tip = (1-smooth(-.10,.015,v[:,2])) * smooth(-.035,.025,v[:,1])
tip *= 1-smooth(math.radians(94),math.radians(113),abs(az))
az += (angles[group]-az) * .55 * tip
v[:,0] = np.sin(az)*radius; v[:,1] = np.cos(az)*radius
v[:,2] -= .012*tip
hair.data.vertices.foreach_set('co',v.astype('f').ravel())
hair.location=(0,0,0); hair.rotation_euler=(0,0,0); hair.scale=(1,1,1)
hair.name='blender-blonde-spring'
hair.data.materials.clear()
mat=bpy.data.materials.new('R6 opaque painted gold'); mat.use_nodes=True
bsdf=mat.node_tree.nodes.get('Principled BSDF'); bsdf.inputs['Roughness'].default_value=.57
color=mat.node_tree.nodes.new('ShaderNodeVertexColor')
color.layer_name=hair.data.color_attributes.active_color.name
mat.node_tree.links.new(color.outputs['Color'],bsdf.inputs['Base Color'])
hair.data.materials.append(mat)
for p in hair.data.polygons: p.material_index=0; p.use_smooth=True
arm=bpy.data.armatures.new('R6 six progressive spring chains')
rig=bpy.data.objects.new('R6 blonde rig',arm); bpy.context.collection.objects.link(rig)
bpy.context.view_layer.objects.active=rig; rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
root=arm.edit_bones.new('fixed-crown'); root.head=(0,0,0); root.tail=(0,0,.04)
chains=[]
for j,a in enumerate(angles):
    ids=np.flatnonzero((group==j)&(tip>.25))
    r=float(np.median(radius[ids])); top=.045; bottom=float(np.percentile(v[ids,2],4))
    points=[Vector((math.sin(a)*r,math.cos(a)*r,z)) for z in np.linspace(top,bottom,4)]
    names=[]; parent=root
    for k in range(4):
        bone=arm.edit_bones.new(f'lock-{j}-{k}'); bone.head=points[k]
        bone.tail=points[k+1] if k<3 else points[k]+Vector((0,0,-.008))
        bone.parent=parent; parent=bone; names.append(bone.name)
    chains.append({'bones':names,'top':top,'bottom':bottom})
bpy.ops.object.mode_set(mode='OBJECT')
hair.vertex_groups.clear()
groups={n:hair.vertex_groups.new(name=n) for n in ['fixed-crown']+[b for c in chains for b in c['bones']]}
for i,p in enumerate(v):
    c=chains[group[i]]
    # R6b: flex the exposed upper/middle back locks; keep crown >= .108m and all low tips unchanged.
    flex=float((1-smooth(.010,.108,p[2]))*smooth(-.04,.025,p[1])*(1-smooth(math.radians(94),math.radians(113),abs(np.arctan2(p[0],p[1])))))
    along=float(np.clip((c['top']-p[2])/(c['top']-c['bottom'])*3,0,2))
    lo=min(1,int(along)); blend=along-lo
    weights={'fixed-crown':1-flex,c['bones'][lo]:flex*(1-blend),c['bones'][lo+1]:flex*blend}
    for name,w in weights.items():
        if w>1e-7: groups[name].add([i],w,'REPLACE')
mod=hair.modifiers.new('R6 GPU skin','ARMATURE'); mod.object=rig; hair.parent=rig
bpy.ops.object.select_all(action='DESELECT'); hair.select_set(True); rig.select_set(True)
bpy.context.view_layer.objects.active=hair
hair.data.validate(clean_customdata=False); hair.data.update()
output.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(output),use_selection=True,export_animations=False,export_morph=False,export_skins=True)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(study),compress=True)
hair.data.calc_loop_triangles()
audit={'triangles':len(hair.data.loop_triangles),'vertices':len(v),'bones':25,'dynamicJoints':18,'materials':1,'bytes':output.stat().st_size,'maxTipSculptMeters':float(np.linalg.norm(v-original,axis=1).max()),'chains':chains}
output.with_suffix('.audit.json').write_text(json.dumps(audit,indent=2))
print(json.dumps(audit))
