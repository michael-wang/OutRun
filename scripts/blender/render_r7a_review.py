"""Actual Blender review of the exported sculpt-derived bust + frozen R6d hair."""
import bpy,math
from pathlib import Path
from mathutils import Vector
root=Path('C:/astra-dev/outrun');out=root/'docs/art-review/r7a';out.mkdir(exist_ok=True,parents=True)
bpy.ops.wm.open_mainfile(filepath=str(root/'art-prototype/output/r7a-heroine-upper-body.blend'))
existing=set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=str(root/'public/assets/characters/coast-blonde-r6d.glb'))
for o in set(bpy.data.objects)-existing:
 if not o.parent:o.location+=Vector((0,.465,1.485));o['frozen_R6d_preview']=True
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='OPTIX';prefs.refresh_devices()
for device in prefs.devices:device.use=device.type=='OPTIX'
scene.cycles.device='GPU' if any(d.use for d in prefs.devices) else 'CPU'
scene.render.resolution_x=700;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='JPEG';scene.render.image_settings.quality=94
scene.world=bpy.data.worlds.new('R7A neutral review');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.18,.20,.25,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.45
target=Vector((0,.465,1.38))
def aim(o):o.rotation_euler=(target-o.location).to_track_quat('-Z','Y').to_euler()
for name,pos,power,color in [('key',(-1,-1,2.4),90,(1,.94,.88)),('fill',(1,-.4,1.8),35,(.78,.88,1)),('rim',(.5,1.8,2),100,(1,.90,.75))]:
 data=bpy.data.lights.new(name,'AREA');data.energy=power;data.color=color;data.size=1.3
 ob=bpy.data.objects.new(name,data);scene.collection.objects.link(ob);ob.location=pos;aim(ob)
data=bpy.data.cameras.new('R7A review camera');cam=bpy.data.objects.new('R7A review camera',data);scene.collection.objects.link(cam);scene.camera=cam
data.type='ORTHO';data.ortho_scale=.66
for angle,name in [(0,'studio-front'),(-45,'studio-front45'),(90,'studio-side'),(180,'studio-back')]:
 a=math.radians(angle);cam.location=target+Vector((2*math.sin(a),-2*math.cos(a),.025));aim(cam)
 scene.render.filepath=str(out/(name+'.jpg'));bpy.ops.render.render(write_still=True)
bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=str(root/'art-prototype/output/r7a-heroine-review.blend'),compress=True)
