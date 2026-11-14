import bpy,math
from pathlib import Path
from mathutils import Vector,Matrix
ROOT=Path.cwd();out=ROOT/'docs/art-review/r7h';out.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'art-prototype/output/r7h-heroine-fullbody.blend'))
rig=bpy.data.objects['heroine-r7h-rig'];body=bpy.data.objects['heroine-body']
for owner in [rig,body.data.shape_keys]:
 for track in owner.animation_data.nla_tracks:track.mute=True
def bp(p):return Vector((p[0],-p[2],p[1]))
basis=Matrix(((1,0,0),(0,0,-1),(0,1,0)))
def bone(name,p,d):
 q=Vector((1 if name.endswith('1') and not name.endswith('-1') else -1,0,0)).rotation_difference(Vector(d).normalized())
 q=(basis@q.to_matrix()@basis.inverted()).to_quaternion()
 rig.pose.bones[name].matrix=Matrix.Translation(bp(p))@(q@rig.data.bones[name].matrix_local.to_quaternion()).to_matrix().to_4x4()
for side in [-1,1]:
 shoulder=Vector((side*.20,1.19,-.48));elbow=Vector((side*.25,.91,-.47));wrist=Vector((side*.24,.64,-.45))
 bone(f'upper{side}',shoulder,elbow-shoulder);bone(f'fore{side}',elbow,wrist-elbow);bone(f'hand{side}',wrist,(side*.05,-1,.08))
bpy.context.view_layer.update()
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='OPTIX';prefs.refresh_devices()
for device in prefs.devices:device.use=device.type=='OPTIX'
scene.cycles.device='GPU';scene.render.resolution_x=800;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='JPEG';scene.render.image_settings.quality=94
scene.world=bpy.data.worlds.new('Neutral review');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.16,.18,.23,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.4
target=Vector((0,.46,.85))
def aim(o):o.rotation_euler=(target-o.location).to_track_quat('-Z','Y').to_euler()
for name,pos,power,color in [('key',(-2,-2,3),200,(1,.94,.87)),('fill',(2,-1,2),100,(.78,.88,1)),('rim',(.5,2.5,2.8),220,(1,.88,.70))]:
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.color=color;d.size=2
 o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=pos;aim(o)
data=bpy.data.cameras.new('Fullbody review');cam=bpy.data.objects.new('Fullbody review',data);scene.collection.objects.link(cam);scene.camera=cam;data.type='ORTHO';data.ortho_scale=1.85
for angle,name in [(0,'front'),(-45,'front45'),(90,'side'),(180,'back')]:
 a=math.radians(angle);cam.location=target+Vector((3*math.sin(a),-3*math.cos(a),.03));aim(cam)
 scene.render.filepath=str(out/('studio-'+name+'.jpg'));bpy.ops.render.render(write_still=True)

# Save an immediately useful standing review scene, not the last animation frame.
bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'art-prototype/output/r7h-heroine-review.blend'),compress=True)
target=Vector((0,.46,1.13));data.ortho_scale=.90
cam.location=target+Vector((2,3,.15));aim(cam)
scene.render.filepath=str(out/'studio-back-detail.jpg');bpy.ops.render.render(write_still=True)
target=Vector((0,.46,1.25));data.ortho_scale=1.25
for action in ['shoutRight','kissRight','shoutLeft','kissLeft','victory']:
 for owner in [rig,body.data.shape_keys]:
  for track in owner.animation_data.nla_tracks:track.mute=track.name!=action
 scene.frame_set(29 if action.startswith('kiss') else 24);bpy.context.view_layer.update()
 cam.location=target+Vector((0,3,.22));aim(cam)
 scene.render.filepath=str(out/('pose-'+action+'.jpg'));bpy.ops.render.render(write_still=True)
