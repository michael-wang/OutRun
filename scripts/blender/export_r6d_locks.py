"""R6d: replace R6c's upper groove tessellation with five authored cover volumes.
Blender -b -P this.py -- public/assets/characters/coast-blonde-r6d.glb
The R6b core is the exact pre-subdivision topology of R6c; both stay immutable.
"""
import sys, struct, json
from pathlib import Path
import numpy as np
out=Path(sys.argv[sys.argv.index('--')+1])
assert out.name not in ('coast-blonde-r6.glb','coast-blonde-r6b.glb','coast-blonde-r6b-upper.glb'), 'Preserve rollback assets'
def load(path):
    raw=Path(path).read_bytes();size=struct.unpack_from('<I',raw,12)[0]
    doc=json.loads(raw[20:20+size]);binary=raw[28+size:]
    def read(index):
        a=doc['accessors'][index];v=doc['bufferViews'][a['bufferView']]
        return np.frombuffer(binary,dtype={5126:np.float32,5123:np.uint16,5121:np.uint8}[a['componentType']],count=a['count']*{'VEC3':3,'VEC4':4,'MAT4':16,'SCALAR':1}[a['type']],offset=v.get('byteOffset',0)+a.get('byteOffset',0)).reshape(a['count'],-1).copy()
    return doc,read
doc,read=load('public/assets/characters/coast-blonde-r6b.glb')
r6c,read_c=load('public/assets/characters/coast-blonde-r6b-upper.glb')
p=doc['meshes'][0]['primitives'][0]
arrays={name:read(index) for name,index in p['attributes'].items()}
core=arrays['POSITION'].copy();faces=read(p['indices']).reshape(-1,3)
stable=core[:,1]<=.065
for name,index in p['attributes'].items():
    assert np.array_equal(arrays[name][stable],read_c(index)[:len(core)][stable]),name
assert doc['nodes']==r6c['nodes'] and doc['skins']==r6c['skins']
core_count=len(core)
def smooth(a,b,x):
    t=np.clip((x-a)/(b-a),0,1);return t*t*(3-2*t)
# A modest amber underlayer rather than black outlines between light locks.
mask=smooth(.065,.115,core[:,1])
arrays['COLOR_0']*= (1-.08*mask)[:,None]
rows={name:list(a) for name,a in arrays.items()};triangles=list(faces)
origin=np.array([0,.015,0]);a=core[faces[:,0]];e1=core[faces[:,1]]-a;e2=core[faces[:,2]]-a
def surface(point):
    d=point-origin;d/=np.linalg.norm(d)
    h=np.cross(np.broadcast_to(d,e2.shape),e2);det=np.einsum('ij,ij->i',e1,h)
    inv=np.divide(1,det,out=np.zeros_like(det),where=abs(det)>1e-8)
    s=origin-a;u=inv*np.einsum('ij,ij->i',s,h);q=np.cross(s,e1)
    v=inv*(q@d);t=inv*np.einsum('ij,ij->i',e2,q)
    hit=(abs(det)>1e-8)&(u>=-1e-6)&(v>=-1e-6)&(u+v<=1.000001)&(t>0)
    assert np.any(hit),'Cover must sit on existing scalp volume'
    return origin+d*np.max(t[hit])

# Explicit four-point sculpt guides: forelock, temple, left rear, centre rear,
# right rear. Controls follow the approved side part, not regularly spaced ribs.
guides=[
 ('forelock',[[.075,.18,.07],[.01,.20,.12],[-.09,.15,.16],[-.145,.078,.105]],.062,[.81,.435,.145]),
 ('temple',[[.05,.20,.02],[-.065,.19,.025],[-.15,.13,.065],[-.17,.068,.00]],.058,[.67,.315,.09]),
 ('left-rear',[[.035,.20,-.015],[-.065,.18,-.07],[-.12,.125,-.14],[-.12,.069,-.105]],.080,[.85,.49,.18]),
 ('centre-rear',[[.07,.19,-.035],[.01,.18,-.12],[-.025,.125,-.18],[.02,.070,-.16]],.083,[.74,.38,.115]),
 ('right-rear',[[.10,.18,-.025],[.145,.16,-.08],[.15,.12,-.14],[.12,.073,-.10]],.070,[.82,.445,.15]),
]
root_joint=next(i for i,node in enumerate(doc['skins'][0]['joints']) if doc['nodes'][node]['name']=='fixed-crown')
audit=[];rings=13;sides=10
for lock,(name,controls,width,tone) in enumerate(guides):
    cp=np.array(controls);centres=[]
    for t in np.linspace(0,1,rings):
        curve=(1-t)**3*cp[0]+3*(1-t)**2*t*cp[1]+3*(1-t)*t*t*cp[2]+t**3*cp[3]
        centres.append(surface(curve))
    start=len(rows['POSITION']);centres=np.array(centres)
    for i,c in enumerate(centres):
        t=i/(rings-1);n=c-origin;n/=np.linalg.norm(n)
        tangent=centres[min(i+1,rings-1)]-centres[max(0,i-1)];tangent/=np.linalg.norm(tangent)
        side=np.cross(tangent,n);side/=np.linalg.norm(side)
        taper=(.22+.78*np.sin(np.pi*min(t/.94,1))**.65)*(1-.94*smooth(.75,1,t))
        for k in range(sides):
            phi=k*2*np.pi/sides;cross=np.cos(phi);crest=max(0,np.sin(phi))
            anchor=surface(c+side*cross*width*.5*taper)
            # Roots tuck under the crown; convex bellies overlap adjacent locks.
            tuck=-.003*(1-smooth(0,.16,t))
            point=anchor+n*(.002+np.sin(phi)*.011*taper+tuck)
            # The closing tip stays in the upper/mid zone, never changes nape ends.
            point[1]=max(.066,point[1])
            nearest=int(np.argmin(np.sum((core-anchor)**2,axis=1)))
            rows['POSITION'].append(point);rows['NORMAL'].append(n)
            colour=np.array(tone)*(.84+.16*crest)*( .91+.09*smooth(0,.3,t))
            colour+=np.array([.08,.07,.035])*crest**5*(1-abs(2*t-1))
            rows['COLOR_0'].append(np.clip(colour,0,1))
            # Front/crown stay rigid; three rear cover ends borrow existing skin.
            rows['JOINTS_0'].append(arrays['JOINTS_0'][nearest] if lock>=2 else [root_joint,0,0,0])
            rows['WEIGHTS_0'].append(arrays['WEIGHTS_0'][nearest] if lock>=2 else [1,0,0,0])
    new=[]
    for i in range(rings-1):
        for k in range(sides):
            x=start+i*sides+k;y=start+i*sides+(k+1)%sides
            new.extend([(x,y,x+sides),(y,y+sides,x+sides)])
    for k in range(1,sides-1):
        new.append((start,start+k+1,start+k));end=start+(rings-1)*sides
        new.append((end,end+k,end+k+1))
    verts=np.array(rows['POSITION']);f=np.array(new)
    normal=np.zeros_like(verts);cross=np.cross(verts[f[:,1]]-verts[f[:,0]],verts[f[:,2]]-verts[f[:,0]])
    for k in range(3):np.add.at(normal,f[:,k],cross)
    # Ensure convex top faces point away from the scalp.
    sample=start+6*sides+2
    if np.dot(normal[sample],verts[sample]-origin)<0:
        new=[(x,z,y) for x,y,z in new];normal*=-1
    for index in range(start,len(verts)):
        rows['NORMAL'][index]=normal[index]/max(np.linalg.norm(normal[index]),1e-9)
    triangles.extend(new);audit.append({'name':name,'vertices':rings*sides,'triangles':len(new),'widthMeters':width})

arrays={name:np.asarray(rows[name],dtype=value.dtype) for name,value in arrays.items()}
triangles=np.array(triangles,dtype=np.uint16)
chunks=[];offset=0
for index,access in enumerate(doc['accessors']):
    name=next((name for name,n in p['attributes'].items() if n==index),None)
    data=arrays[name] if name else triangles.reshape(-1,1) if index==p['indices'] else read(index)
    payload=data.tobytes();access['count']=len(data)
    if name=='POSITION':access['min']=data.min(axis=0).tolist();access['max']=data.max(axis=0).tolist()
    view=doc['bufferViews'][access['bufferView']];view['byteOffset']=offset;view['byteLength']=len(payload)
    payload+=b'\0'*((-len(payload))%4);chunks.append(payload);offset+=len(payload)
doc['buffers'][0]['byteLength']=offset;doc['materials'][0]['name']='R6d honey gold grouped cover locks'
encoded=json.dumps(doc,separators=(',',':')).encode();encoded+=b' '*((-len(encoded))%4);data=b''.join(chunks)
out.write_bytes(struct.pack('<III',0x46546c67,2,28+len(encoded)+len(data))+struct.pack('<II',len(encoded),0x4e4f534a)+encoded+struct.pack('<II',len(data),0x004e4942)+data)
report={'triangles':len(triangles),'vertices':len(arrays['POSITION']),'coreVertices':core_count,'bytes':out.stat().st_size,'materials':1,'bones':25,'locks':audit}
Path('docs/art-review/r6d/asset-audit.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
if 'bpy' in sys.modules:
    import bpy
    bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(out.resolve()))
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(Path('art-prototype/output/r6d-cover-locks.blend').resolve()),compress=True)
