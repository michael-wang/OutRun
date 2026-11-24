"""Blender 4.5: hair-only LOD from the accepted motion study (no regeneration).

blender -b SOURCE.blend -P scripts/blender/export_playable_blonde.py -- OUTPUT.glb
The original file is never saved. Five existing deformation fields are projected
onto the decimated surface. Units and axes match the existing WindGroom anchor.
"""
import bpy, bmesh, sys, json
import numpy as np
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

output = Path(sys.argv[sys.argv.index('--') + 1]).resolve()
source = next(o for o in bpy.context.scene.objects if o.name.startswith('Blonde bob'))
mesh = source.data
mesh.calc_loop_triangles()
vertices = np.array([v.co[:] for v in mesh.vertices])
triangles = np.array([t.vertices[:] for t in mesh.loop_triangles])
fields = np.array([[p.co[:] for p in k.data] for k in mesh.shape_keys.key_blocks])
bvh = BVHTree.FromPolygons(vertices.tolist(), triangles.tolist(), all_triangles=True)

lod = source.copy(); lod.data = source.data.copy()
bpy.context.collection.objects.link(lod)
lod.animation_data_clear(); lod.data.shape_keys.animation_data_clear()
lod.shape_key_clear()
bpy.ops.object.select_all(action='DESELECT')
lod.select_set(True); bpy.context.view_layer.objects.active = lod
decimate = lod.modifiers.new('Driving silhouette LOD', 'DECIMATE')
decimate.ratio = 1000 / len(triangles)
decimate.use_collapse_triangulate = True
bpy.ops.object.modifier_apply(modifier=decimate.name)
lod.data.validate(clean_customdata=False)
lod.data.update()
# Collapse can leave detached one/two-triangle flecks from the scanned sculpt.
# Keep the connected hairstyle, not floating specks that cast needle shadows.
bm = bmesh.new(); bm.from_mesh(lod.data)
unseen = set(bm.verts); scraps = []
while unseen:
    seed = unseen.pop(); component = {seed}; stack = [seed]
    while stack:
        for edge in stack.pop().link_edges:
            for vertex in edge.verts:
                if vertex in unseen:
                    unseen.remove(vertex); component.add(vertex); stack.append(vertex)
    if len({face for vertex in component for face in vertex.link_faces}) <= 2:
        scraps.extend(component)
bmesh.ops.delete(bm, geom=scraps, context='VERTS')
bm.to_mesh(lod.data); bm.free(); lod.data.update()
positions = np.array([v.co[:] for v in lod.data.vertices])
# Barycentric transfer retains pinned roots and the six asymmetric lock masks.
deltas = np.zeros((5, len(positions), 3))
for i, p in enumerate(positions):
    hit, _, triangle, _ = bvh.find_nearest(Vector(p))
    ids = triangles[triangle]; a, b, c = vertices[ids]
    uv = np.linalg.lstsq(np.column_stack((b-a, c-a)), np.array(hit)-a, rcond=None)[0]
    weights = np.array([1-uv.sum(), *uv])
    deltas[:, i] = np.sum((fields[1:, ids] - fields[0, ids]) * weights[None, :, None], axis=1)

# One chase-view amplitude pass, local to the original movable tips. Crown and
# fringe zero deltas remain zero. No extra physics or runtime noise generator.
gains = [1.45, 1.5, 1.65, 8.0, 8.0]
positions = positions * .25 + [0, 0, -.048]
lod.data.vertices.foreach_set('co', positions.astype('f').ravel())
lod.data.update()
lod.shape_key_add(name='Basis')
for delta, gain, name in zip(deltas, gains, ['wind', 'sway', 'tipSway', 'flutterCos', 'flutterSin']):
    key = lod.shape_key_add(name=name)
    key.slider_min = -1; key.slider_max = 1
    key.data.foreach_set('co', (positions + delta * .25 * gain).astype('f').ravel())
    key.value = 0
lod.location = (0, 0, 0); lod.rotation_euler = (0, 0, 0); lod.scale = (1, 1, 1)
lod.name = 'blender-blonde-bob'
lod.vertex_groups.clear()
lod.data.materials.clear()
mat = bpy.data.materials.new('Blonde painted locks'); mat.use_nodes = True
bsdf = mat.node_tree.nodes.get('Principled BSDF')
bsdf.inputs['Roughness'].default_value = .65
color = mat.node_tree.nodes.new('ShaderNodeVertexColor')
color.layer_name = lod.data.color_attributes.active_color.name
mat.node_tree.links.new(color.outputs['Color'], bsdf.inputs['Base Color'])
lod.data.materials.append(mat)
for poly in lod.data.polygons: poly.material_index = 0; poly.use_smooth = True
output.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(output), use_selection=True, export_animations=False,
                         export_morph=True, export_morph_normal=True, export_extras=False)
lod.data.calc_loop_triangles()
print(json.dumps({'vertices': len(lod.data.vertices), 'triangles': len(lod.data.loop_triangles),
                  'shapeKeys': 5, 'bytes': output.stat().st_size, 'amplitudeGains': gains}))
