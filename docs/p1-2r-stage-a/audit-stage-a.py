import bpy, json, hashlib
from pathlib import Path
import io_scene_gltf2

p = Path(bpy.data.filepath)
result = {'source': str(p), 'sha256': hashlib.sha256(p.read_bytes()).hexdigest(),
          'blender': bpy.app.version_string, 'build_hash': bpy.app.build_hash.decode(),
          'exporter': io_scene_gltf2.bl_info.get('version'), 'objects': []}
for o in bpy.data.objects:
    row = {'name': o.name, 'type': o.type, 'parent': o.parent.name if o.parent else None,
           'location': list(o.location), 'rotation': list(o.rotation_euler), 'scale': list(o.scale),
           'modifiers': [{'name': m.name, 'type': m.type} for m in o.modifiers]}
    if o.type == 'MESH':
        coords = [list(v.co) for v in o.data.vertices]
        row.update(vertices=len(coords), faces=len(o.data.polygons),
                   geometry_sha256=hashlib.sha256(str(coords).encode()).hexdigest(),
                   materials=[m.name if m else None for m in o.data.materials])
    result['objects'].append(row)
result['materials'] = [{'name': m.name, 'diffuse': list(m.diffuse_color),
    'principled': [{i.name: list(i.default_value) if hasattr(i.default_value, '__len__') else i.default_value
                   for i in n.inputs if i.name in ['Base Color','Metallic','Roughness','Emission Color','Emission Strength']}
                  for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'] if m.use_nodes else []}
    for m in bpy.data.materials]
print('STAGE_A_AUDIT ' + json.dumps(result))
