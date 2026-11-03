"""One-off Blender terrain-first blockout. No road or old terrain is read.
Run once to author Gate A; subsequent road fitting edits the saved scene.
"""
import bpy, math, json
from pathlib import Path
from mathutils import Vector, noise

ROOT=Path(__file__).resolve().parents[2]/'art-prototype'/'output'/'terrain-first'
ROOT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
art=bpy.data.collections.new('10_CANYON_SCULPT');scene.collection.children.link(art)
watercol=bpy.data.collections.new('20_RIVER');scene.collection.children.link(watercol)
cams=bpy.data.collections.new('90_TERRAIN_OVERVIEWS');scene.collection.children.link(cams)
def cv(p):return (p[0],-p[2],p[1])
def mat(name,color,rough=.9):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough
 # Actual Blender Noise -> Bump surface detail; geometry carries the large forms.
 tex=m.node_tree.nodes.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=2.7;tex.inputs['Detail'].default_value=3
 bump=m.node_tree.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.28;bump.inputs['Distance'].default_value=.25
 m.node_tree.links.new(tex.outputs['Fac'],bump.inputs['Height']);m.node_tree.links.new(bump.outputs['Normal'],p.inputs['Normal'])
 return m
colors=[(.37,.16,.085),(.49,.245,.13),(.59,.325,.18),(.65,.40,.24),(.72,.49,.30),(.43,.27,.17),(.52,.34,.22)]
materials=[mat('Sediment '+str(i),c) for i,c in enumerate(colors)]
river=mat('Colorado turquoise',(.025,.22,.205),.28)
def mesh(name,vs,fs,col,mats):
 me=bpy.data.meshes.new(name);me.from_pydata([cv(p) for p in vs],[],fs);me.update();o=bpy.data.objects.new(name,me);col.objects.link(o)
 for m in mats:me.materials.append(m)
 for p in me.polygons:p.use_smooth=True
 return o
def smooth(t):t=max(0,min(1,t));return t*t*(3-2*t)
def interp(z,knots):
 for (a,x),(b,y) in zip(knots,knots[1:]):
  if z<=b:return x+(y-x)*smooth((z-a)/(b-a))
 return knots[-1][1]
def river_axis(z):return interp(z,[(-1300,-320),(-700,-190),(-100,-70),(350,-130),(600,-100),(780,-20),(1050,-180),(1450,-130),(1900,80),(2800,180)])
def valley_width(z):return interp(z,[(-1300,220),(-300,300),(350,365),(540,290),(780,125),(1050,300),(1450,440),(2800,600)])
def n(x,z,s):return noise.noise_vector(Vector((x/s,z/s,2.71)),noise_basis='PERLIN_ORIGINAL').x
def terrain_y(x,z):
 c=river_axis(z);w=valley_width(z);u=abs(x-c)/w
 # Tributary recesses and broad irregular contours are independent of roads.
 u+=.095*n(x,z,180)+.035*n(x,z,57)
 floor=41+.004*(z+1200)
 levels=[(0,0),(.08,1),(.19,8),(.38,43),(.48,108),(.60,119),(.67,124),(.85,224),(1.0,245),(1.22,254),(1.38,307),(1.7,329),(3,345),(8,350)]
 height=interp(u,levels)
 # Broad plateaus, erosion gullies and broken bedding; no freestanding towers.
 strength=smooth((u-.10)/.45)
 height+=strength*(18*n(x,z,240)+7*n(x,z,65)+2.5*n(x,z,17))
 height+=strength*7*math.sin(z*.031+3*n(x,z,90))*smooth((u-.6)/.4)
 return floor+height

xs=list(range(-1700,1701,8));zs=list(range(-1400,2801,8));verts=[(x,terrain_y(x,z),z) for z in zs for x in xs];nx=len(xs)
faces=[(j*nx+i,j*nx+i+1,(j+1)*nx+i+1,(j+1)*nx+i) for j in range(len(zs)-1) for i in range(nx-1)]
land=mesh('Connected canyon with two eroded rims',verts,faces,art,materials)
for p in land.data.polygons:
 y=p.center.z
 # center is updated below; use vertex mean for deterministic sediment bands.
 y=sum(land.data.vertices[i].co.z for i in p.vertices)/len(p.vertices)
 zone=(y+3*math.sin(p.center.y*.008))%83
 p.material_index=4 if zone<5 else 0 if zone<14 else 1 if zone<35 else 2 if zone<61 else 3
bpy.context.view_layer.objects.active=land;land.select_set(True)
tex=bpy.data.textures.new('Rock fracture displacement',type='CLOUDS');tex.noise_scale=24;tex.noise_depth=2
dis=land.modifiers.new('Applied eroded rock displacement','DISPLACE');dis.texture=tex;dis.strength=3.8;dis.mid_level=.5
bpy.ops.object.modifier_apply(modifier=dis.name)
# Keep the sculptable mesh dense; GLB can use an evaluated decimation later.
vs=[]
for z in range(-1400,2801,5):
 c=river_axis(z)+7*math.sin(z*.014);width=16+4*math.sin(z*.009+.7)
 for x in [c-width,c+width]:vs.append((x,43.5+.004*(z+1200),z))
mesh('Continuous meandering river',vs,[(i,i+1,i+3,i+2) for i in range(0,len(vs)-2,2)],watercol,[river])

def camera(name,eye,look,lens=38,ortho=None):
 data=bpy.data.cameras.new(name);o=bpy.data.objects.new(name,data);cams.objects.link(o);o.location=cv(eye);o.rotation_euler=(Vector(cv(look))-o.location).to_track_quat('-Z','Y').to_euler();data.lens=lens;data.clip_end=12000
 if ortho:data.type='ORTHO';data.ortho_scale=ortho
 return o
camera('A01_Canyon_Plan',(150,2600,650),(-50,0,650),ortho=2800)
camera('A02_Canyon_Section',(1400,1000,-550),(-60,150,650),44)
camera('A03_Hero_Basins',(720,610,100),(-170,135,650),35)
sun=bpy.data.lights.new('Canyon late afternoon','SUN');sun.energy=2.5;sun.angle=.12;o=bpy.data.objects.new('Canyon late afternoon',sun);scene.collection.objects.link(o);o.rotation_euler=(.6,-.65,-.5)
world=bpy.data.worlds.new('Blue desert sky');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.49,.64,.8,1);world.node_tree.nodes['Background'].inputs[1].default_value=.65;scene.world=world
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True;scene.render.resolution_x=1920;scene.render.resolution_y=1080;scene.render.resolution_percentage=100;scene.view_settings.view_transform='AgX'
scene['workflow']='Terrain FIRST: canyon mesh and natural narrows authored before any road coordinates.'
scene['visual_revision']=0
scene.camera=bpy.data.objects['A02_Canyon_Section']
text=bpy.data.texts.new('TERRAIN_FIRST_NOTES');text.write('Independent connected river canyon. Natural narrows at world Z=780. Lower bench around Y=165, upper rims around Y=300–400. Road not yet designed. Blender Clouds Displace applied to sculpt mesh; Noise/Bump rock surfaces. No old terrain imported.')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Grand_Canyon_Terrain_First.blend'))
for name in ['A01_Canyon_Plan','A02_Canyon_Section','A03_Hero_Basins']:
 scene.camera=bpy.data.objects[name];scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
print('Gate A terrain only saved and rendered',flush=True)
