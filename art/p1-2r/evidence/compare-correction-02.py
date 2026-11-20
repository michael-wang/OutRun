import bpy, json, hashlib
from pathlib import Path
base=Path(r'<LOCAL_WORKSPACE>')
def read(name):
 p=base/name
 bpy.ops.wm.open_mainfile(filepath=str(p),load_ui=False)
 o=bpy.data.objects['Grid']
 return {'sha':hashlib.sha256(p.read_bytes()).hexdigest(),'coordinates':[list(o.matrix_world@v.co) for v in o.data.vertices],'faces':[list(f.vertices) for f in o.data.polygons]}
a=read('stage-b-input-failure-01.blend'); b=read('stage-b-correction-02.blend')
changes=[{'vertex':i,'before':x,'after':y} for i,(x,y) in enumerate(zip(a['coordinates'],b['coordinates'])) if x!=y]
r={'before_sha':a['sha'],'after_sha':b['sha'],'vertex_count_same':len(a['coordinates'])==len(b['coordinates']),'faces_identical':a['faces']==b['faces'],'changes':changes}
print('CORRECTION_02_COMPARE '+json.dumps(r))
