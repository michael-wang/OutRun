import bpy, json, sys
from pathlib import Path
root=Path(sys.argv[sys.argv.index('--')+1])
revisions=['assembly-05/assembled-native-05.blend','revision-06/native-edit-06.blend','revision-07/native-edit-07.blend']
previous=None
for rev in revisions:
    bpy.ops.wm.open_mainfile(filepath=str(root/rev),load_ui=False,use_scripts=False)
    current={o.name:[[float(c) for c in v.co] for v in o.data.vertices] for o in bpy.data.objects if o.type=='MESH'}
    if previous:
        delta={}
        for name,coords in current.items():
            old=previous[name]
            changed=[i for i,(a,b) in enumerate(zip(old,coords)) if a!=b]
            delta[name]={'changedVertices':len(changed),'totalVertices':len(coords),
                         'beforeBounds':[[min(c[j] for c in old),max(c[j] for c in old)] for j in range(3)],
                         'afterBounds':[[min(c[j] for c in coords),max(c[j] for c in coords)] for j in range(3)]}
        print('NATIVE_DELTA '+json.dumps({'to':rev,'changes':delta}))
    previous=current
