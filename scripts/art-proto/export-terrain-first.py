"""Export saved editable Terrain First art, without re-running terrain authoring."""
from pathlib import Path
import bpy,sys
if Path(bpy.data.filepath).name!='Grand_Canyon_Terrain_First.blend':
 raise RuntimeError('Open Grand_Canyon_Terrain_First.blend first')
root=Path(bpy.data.filepath).parent;scene=bpy.context.scene
saved=list(bpy.context.selected_objects);active=bpy.context.view_layer.objects.active
camera,path=scene.camera,scene.render.filepath
try:
 bpy.ops.object.select_all(action='DESELECT')
 for name in ['10_CANYON_SCULPT','20_RIVER','30_BRIDGE_AND_ROAD_EDGES']:
  for obj in bpy.data.collections[name].objects:
   if obj.type=='MESH':obj.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(root/'canyon_terrain_first.glb'),export_format='GLB',use_selection=True,export_apply=True)
 if '--render' in sys.argv:
  scene.render.resolution_x=1920;scene.render.resolution_y=1080;scene.render.resolution_percentage=100
  for hero in [1,2]:
   for moment in ['Approach','Reveal','Exit']:
    name=f'H{hero}_{moment}';scene.camera=bpy.data.objects[name];scene.render.filepath=str(root/(name+'.png'));bpy.ops.render.render(write_still=True)
finally:
 scene.camera,scene.render.filepath=camera,path
 bpy.ops.object.select_all(action='DESELECT')
 for obj in saved:obj.select_set(True)
 bpy.context.view_layer.objects.active=active
