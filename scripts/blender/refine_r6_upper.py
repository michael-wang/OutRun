"""One offline sculpt pass on the accepted R6b GLB, not a new hairstyle.
python refine_r6_upper.py INPUT.glb OUTPUT.glb
Keeps skin/bones, lower vertices and original asset; output imports in Blender.
"""
import json, math, struct, sys
from pathlib import Path
import numpy as np

source, destination = map(Path, sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else sys.argv[1:])
assert source.resolve()!=destination.resolve(), 'Keep the accepted source immutable'
raw = source.read_bytes(); length = struct.unpack_from('<I', raw, 12)[0]
doc = json.loads(raw[20:20+length]); binary = raw[28+length:]
primitive = doc['meshes'][0]['primitives'][0]
types = {5126:np.float32, 5123:np.uint16, 5121:np.uint8}
width = {'SCALAR':1,'VEC3':3,'VEC4':4,'MAT4':16}
def read(index):
    a=doc['accessors'][index]; v=doc['bufferViews'][a['bufferView']]
    return np.frombuffer(binary,dtype=types[a['componentType']],count=a['count']*width[a['type']],offset=v.get('byteOffset',0)+a.get('byteOffset',0)).reshape(a['count'],-1).copy()
arrays={name:read(index) for name,index in primitive['attributes'].items()}
triangles=read(primitive['indices']).reshape(-1,3)
original_triangles=len(triangles)
original_count=len(arrays['POSITION']); original=arrays['POSITION'].copy()

# Two conforming local subdivisions. Split neighbours along shared edges too;
# nothing below 65 mm is displaced or given different weights.
for iteration in range(2):
    rows={name:list(a) for name,a in arrays.items()}; mid={}
    def midpoint(a,b):
        key=tuple(sorted((int(a),int(b))))
        if key in mid:return mid[key]
        if min(arrays['POSITION'][a,1],arrays['POSITION'][b,1])<=.065:return None
        index=len(rows['POSITION']); mid[key]=index
        for name in rows:
            if name in ('JOINTS_0','WEIGHTS_0'):continue
            rows[name].append((arrays[name][a]+arrays[name][b])*.5)
        weights={}
        for vertex in (a,b):
            for joint,weight in zip(arrays['JOINTS_0'][vertex],arrays['WEIGHTS_0'][vertex]):
                weights[int(joint)]=weights.get(int(joint),0)+float(weight)*.5
        top=sorted(weights.items(),key=lambda kv:-kv[1])[:4]
        top+= [(0,0)]*(4-len(top)); total=sum(w for _,w in top)
        rows['JOINTS_0'].append([j for j,_ in top]);rows['WEIGHTS_0'].append([w/total for _,w in top])
        return index
    faces=[]
    for a,b,c in triangles:
        ab,bc,ca=midpoint(a,b),midpoint(b,c),midpoint(c,a)
        flags=sum((v is not None)<<i for i,v in enumerate((ab,bc,ca)))
        cases={0:[(a,b,c)],1:[(a,ab,c),(ab,b,c)],2:[(b,bc,a),(bc,c,a)],4:[(c,ca,b),(ca,a,b)],
          3:[(ab,b,bc),(a,ab,c),(ab,bc,c)],6:[(bc,c,ca),(b,bc,a),(bc,ca,a)],
          5:[(ca,a,ab),(c,ca,b),(ca,ab,b)],7:[(a,ab,ca),(ab,b,bc),(ca,bc,c),(ab,bc,ca)]}
        faces.extend(cases[flags])
    arrays={name:np.array(rows[name],dtype=a.dtype) for name,a in arrays.items()}
    triangles=np.array(faces,dtype=np.uint16)

def smooth(a,b,x):
    t=np.clip((x-a)/(b-a),0,1);return t*t*(3-2*t)
positions=arrays['POSITION']; normals=arrays['NORMAL']; unsculpted=positions.copy()
height=positions[:,1]
mask=smooth(.065,.105,height)*(1-smooth(.184,.207,height))
az=np.arctan2(positions[:,0]-.018,-positions[:,2]+.008)
flow=.62*smooth(.075,.195,height)
# Seven asymmetric swept seams, broad locks rather than comb-like fine stripes.
groove=np.zeros(len(positions)); shoulder=groove.copy()
for angle in [-2.55,-1.60,-.91,-.24,.48,1.28,2.30]:
    d=np.arctan2(np.sin(az-angle-flow),np.cos(az-angle-flow))
    groove=np.maximum(groove,np.exp(-(d/.105)**2))
    shoulder=np.maximum(shoulder,np.exp(-((d-.11)/.10)**2))
normals/=np.maximum(np.linalg.norm(normals,axis=1)[:,None],1e-9)
# One continuous inward direction across split colour/normal vertices prevents
# cracks at existing seams. Never puff up the silhouette with another hair shell.
inward=positions-np.array([.018,.025,-.008])
inward[:,1]*=.8
inward/=np.maximum(np.linalg.norm(inward,axis=1)[:,None],1e-9)
positions-=inward*(mask*groove*.004)[:,None]

def surface_normals(p):
    n=np.zeros_like(p)
    cross=np.cross(p[triangles[:,1]]-p[triangles[:,0]],p[triangles[:,2]]-p[triangles[:,0]])
    for corner in range(3):np.add.at(n,triangles[:,corner],cross)
    return n/np.maximum(np.linalg.norm(n,axis=1)[:,None],1e-9)
# Preserve accepted smoothing; add only the change from carved upper facets.
changed=mask>0
normals[changed]+= (surface_normals(positions)-surface_normals(unsculpted))[changed]
normals[changed]/=np.maximum(np.linalg.norm(normals[changed],axis=1)[:,None],1e-9)
arrays['COLOR_0']*= (1+mask*(-.48*groove+.075*shoulder))[:,None]
arrays['COLOR_0']=np.clip(arrays['COLOR_0'],0,1)
# Restore every original lower attribute bit-for-bit (including old normal length).
for name,index in primitive['attributes'].items():
    old=read(index); stable=original[:,1]<=.065
    arrays[name][:original_count][stable]=old[stable]

buffers=[];offset=0
for index,a in enumerate(doc['accessors']):
    name=next((n for n,i in primitive['attributes'].items() if i==index),None)
    data=arrays[name] if name else triangles.reshape(-1,1) if index==primitive['indices'] else read(index)
    payload=data.astype(types[a['componentType']]).tobytes(); a['count']=len(data)
    if name=='POSITION':a['min']=data.min(axis=0).tolist();a['max']=data.max(axis=0).tolist()
    view=doc['bufferViews'][a['bufferView']];view['byteOffset']=offset;view['byteLength']=len(payload)
    padded=payload+b'\0'*((-len(payload))%4);buffers.append(padded);offset+=len(padded)
doc['buffers'][0]['byteLength']=offset
doc['materials'][0]['name']='R6b upper sculpted gold / same lower finish'
encoded=json.dumps(doc,separators=(',',':')).encode();encoded+=b' '*((-len(encoded))%4)
data=b''.join(buffers);glb=struct.pack('<III',0x46546c67,2,28+len(encoded)+len(data))+struct.pack('<II',len(encoded),0x4e4f534a)+encoded+struct.pack('<II',len(data),0x004e4942)+data
destination.write_bytes(glb)
audit={'verticesBefore':original_count,'verticesAfter':len(positions),'trianglesBefore':original_triangles,'trianglesAfter':len(triangles),'maxInsetMeters':float(np.max(np.linalg.norm(positions-unsculpted,axis=1))),'bones':25,'materials':1,'lowerUnchangedBelowMeters':.065,'bytes':len(glb)}
destination.with_suffix('.audit.json').write_text(json.dumps(audit,indent=2)+'\n')
print(json.dumps(audit))

# Optional Blender invocation also saves a genuinely editable mesh/skin study.
if 'bpy' in sys.modules:
    import bpy
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(destination.resolve()))
    bpy.context.preferences.filepaths.save_version=0
    study=Path('art-prototype/output/r6-upper.blend');study.parent.mkdir(parents=True,exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(study.resolve()),compress=True)
