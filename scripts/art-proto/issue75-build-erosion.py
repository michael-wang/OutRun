"""Author a coherent erosion patch in Blender from exact game Worker ribbon triangles.
Usage: blender -b --factory-startup -t 4 --python scripts/art-proto/issue75-build-erosion.py -- original-surface.json editable.blend target.glb
No third party content. Retopology subdivides the native triangle diagonals, not a new road grid.
"""
import bisect,json,math,pathlib,sys
import bpy
from mathutils import Vector
src,blend,glb=map(pathlib.Path,sys.argv[sys.argv.index('--')+1:])
blend.parent.mkdir(parents=True,exist_ok=True)
glb.parent.mkdir(parents=True,exist_ok=True)
raw=json.loads(src.read_text(encoding='utf-8-sig')); rows=raw['rows']; strips=raw['footprint']['strips']
D0,D1=raw['footprint']['from'],raw['footprint']['to']
def clamp(x): return max(0.,min(1.,x))
def smooth(x):
    x=clamp(x); return x*x*x*(10+x*(-15+6*x))
def fall(x,w): return math.exp(-(x/w)**2)
def start_end(d,x):
    return smooth((d-D0)/37)*smooth((D1-d)/43)*smooth((x-35)/19)*smooth((104-x)/19)
def linear_channel(c):
    return c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4
def linear_hex(h):
    return tuple(linear_channel(int(h[i:i+2],16)/255.) for i in (0,2,4))
STONE=linear_hex('928a75'); SHALE=linear_hex('5a594e'); EARTH=linear_hex('87795d')
def relief(d,x):
    # One descending, gently oblique interfluve and its two flanking cuts.
    # Distances are metres in the original road frame, not UV-scaled noise.
    t=(x-42)/55
    spine=4650+35*t+5*math.sin(3.8*t)+2*math.sin(8*t)
    line=d-spine
    primary=fall(line,20+7*t)
    lower=fall(x-63,25)
    # Steep lee bank and asymmetric runoff channels. All are carved into the same sheet.
    q1=d-(spine-24-12*t+2.7*math.sin(6*t))
    q2=d-(spine+38+5*t+3*math.sin(5.7*t))
    g1=fall(q1,6+4*t)
    g2=fall(q2,8+4*t)
    branch=fall(d-(spine+63-22*t+3*math.sin(7*t)),5+4*t)*fall(x-76,11)
    toe=fall(x-(53+7*math.sin((d-4620)/35)),7.5)*fall(line-3,30)
    ledge=.42*math.sin(x*.89-d*.127+1.15*math.sin(d*.1))+.28*math.sin(x*.38+d*.31)
    micro=.16*math.sin(d*.84+x*.69)*math.cos(d*.37-x*.51)
    env=start_end(d,x)
    dy=env*(4.2*primary*lower + 1.4*toe - 2.95*g1 - 2.5*g2 - 1.25*branch + (ledge+micro)*min(1.,primary+g1+g2*.38))
    bedding=.5+.5*math.sin(x*.67-d*.116+.9*math.sin(d*.071))
    exposure=env*clamp((primary*.8+g1*.62+g2*.33+toe*.72-.2))*(.48+.43*bedding)
    earth=env*clamp((g1*.8+g2*.65+branch*.32+toe*.23))*(.21+.39*(1-bedding))
    rock=tuple(STONE[i]*(.44+bedding*.52)+SHALE[i]*(.56-bedding*.52) for i in range(3))
    return dy, exposure, earth, rock
def vert_src(d,x):
    i=max(0,min(len(rows)-2,int((d-D0)/5.00000000001)))
    j=max(0,min(len(strips)-2,bisect.bisect_right(strips,x)-1))
    u=(x-strips[j])/(strips[j+1]-strips[j]); v=(d-rows[i]['d'])/5
    a,b=rows[i]['e'][j:j+2]; c,e=rows[i+1]['e'][j:j+2]
    vs,w=((a,b,c),(1-u-v,u,v)) if u+v<=1 else ((b,e,c),(1-v,u+v-1,1-u))
    return [tuple(sum(vt[k][m]*q for vt,q in zip(vs,w)) for m in range(3)) for k in ('p','c','n')]
def make(name,n,high):
    verts=[]; colors=[]; coords=[]; faces=[]
    lateral=[strips[j]+(strips[j+1]-strips[j])*i/n for j in range(len(strips)-1) for i in range(n)]+[strips[-1]]
    min_y,max_y,max_hard=0,0,0
    for i in range((len(rows)-1)*n+1):
        d=D0+(D1-D0)*i/((len(rows)-1)*n)
        for x in lateral:
            p,c,_=vert_src(d,x)
            dy,a,b,rock=relief(d,x)
            min_y=min(min_y,dy); max_y=max(max_y,dy)
            if x<=40: max_hard=max(max_hard,abs(dy))
            # glTF exporter maps Blender (X,Y,Z) -> game (X,Z,-Y).
            verts.append((p[0],-p[2],p[1]+dy))
            c=tuple((c[k]*(1-b)+EARTH[k]*b)*(1-a)+rock[k]*a for k in range(3))
            colors.extend((*c,1))
            coords.append((d,x))
    width=len(lateral)
    for i in range((len(rows)-1)*n):
        for j in range(width-1):
            k=i*width+j
            faces.extend(((k,k+1,k+width),(k+1,k+width+1,k+width)))
    mesh=bpy.data.meshes.new(name); mesh.from_pydata(verts,[],faces); mesh.update()
    model=bpy.data.objects.new(name,mesh); bpy.context.collection.objects.link(model)
    for polygon in mesh.polygons: polygon.use_smooth=True
    material=bpy.data.materials.get('Kenting uphill · linear color') or bpy.data.materials.new('Kenting uphill · linear color')
    material.use_nodes=True
    bsdf=material.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Roughness'].default_value=.93
    bsdf.inputs['Specular IOR Level'].default_value=.21
    color=material.node_tree.nodes.get('ErosionColor') or material.node_tree.nodes.new('ShaderNodeVertexColor')
    color.layer_name='ErosionColor'; color.name='ErosionColor'
    material.node_tree.links.new(color.outputs['Color'],bsdf.inputs['Base Color'])
    model.data.materials.append(material)
    arr=mesh.color_attributes.new(name='ErosionColor',type='FLOAT_COLOR',domain='POINT')
    mesh.color_attributes.active_color=arr
    arr.data.foreach_set('color',colors)
    normals=[]
    for vert,(d,x) in zip(mesh.vertices,coords):
        wa=min(smooth((d-D0)/9),smooth((D1-d)/9),smooth((x-strips[0])/6),smooth((strips[-1]-x)/6))
        if wa>=.99999: normals.append(vert.normal.copy()); continue
        _,_,nrm=vert_src(d,x)
        aligned=Vector((nrm[0],-nrm[2],nrm[1])).normalized()
        normals.append(aligned.lerp(vert.normal,wa).normalized())
    mesh.normals_split_custom_set_from_vertices(normals)
    model['tracks']=f'{D0}-{D1}'
    model['source_surface']='Exact original game world ribbon triangles from original-surface.json'
    model['heightDeltaMin']=min_y; model['heightDeltaMax']=max_y
    model['maxAbsDeltaAtRaw40']=max_hard
    model['method']='Original deterministic analytic relief: one oblique interfluve, paired runoff gullies and a merged toe. No source textures.'
    model.hide_render=high; model.hide_set(high)
    print('SURFACE',name,'VERTICES',len(verts),'TRIANGLES',len(faces),'DY',min_y,max_y,'RAW<=40',max_hard,flush=True)
    return model
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
# Dense editable master plus directly authored constrained retopology instead of
# unconstrained collapse (which can move original piecewise-linear boundaries).
master=make('Kenting erosion | editable high-resolution',7,True)
target=make('Kenting erosion | in-game surface',3,False)
bpy.context.view_layer.objects.active=target; target.select_set(True)
bpy.ops.wm.save_as_mainfile(filepath=str(blend),compress=True)
bpy.ops.export_scene.gltf(filepath=str(glb),export_format='GLB',use_selection=True,export_normals=True,export_yup=True,export_materials='EXPORT',export_vertex_color='ACTIVE')
