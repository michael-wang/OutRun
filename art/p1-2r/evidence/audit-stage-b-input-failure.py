import bpy, hashlib, json
from pathlib import Path

p = Path(bpy.data.filepath)
r = {'source': str(p), 'bytes': p.stat().st_size,
     'sha256': hashlib.sha256(p.read_bytes()).hexdigest(),
     'blender': bpy.app.version_string, 'objects': []}
for o in bpy.data.objects:
    item = {'name': o.name, 'type': o.type}
    if o.type == 'MESH':
        coords = [list(v.co) for v in o.data.vertices]
        item.update(vertices=len(coords), faces=len(o.data.polygons),
                    quads=sum(len(f.vertices) == 4 for f in o.data.polygons),
                    axis_values=[[round(x,6) for x in sorted(set(v[a] for v in coords))] for a in range(3)],
                    coordinates=coords,
                    modifiers=[m.type for m in o.modifiers])
    r['objects'].append(item)
print('STAGE_B_FAILURE_AUDIT ' + json.dumps(r))
