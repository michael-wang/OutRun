import bpy, sys, json, hashlib
from pathlib import Path
p = Path(sys.argv[sys.argv.index('--') + 1])
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(p))
print('STAGE_A_GLB ' + json.dumps({'file':str(p), 'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),
    'objects':[{'name':o.name,'type':o.type,'parent':o.parent.name if o.parent else None}
               for o in bpy.data.objects]}))
