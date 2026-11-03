"""Export only the existing Final Attempt artwork; never rebuild terrain.

Open art-prototype/output/Grand_Canyon_Final_Attempt.blend, then run with
--python-exit-code 1 --python scripts/art-proto/export-final-scene.py.
Append -- --render to render the nine unchanged game-camera objects.
"""
import sys
from pathlib import Path
import bpy

if not bpy.data.filepath or Path(bpy.data.filepath).name != 'Grand_Canyon_Final_Attempt.blend':
    raise RuntimeError('Open Grand_Canyon_Final_Attempt.blend first')
root = Path(bpy.data.filepath).parent
scene = bpy.context.scene
art = [obj for name in ('10_FINAL_SHARED_TERRAIN', '20_FINAL_ESCARPMENTS', '30_FINAL_ROAD_SUPPORT')
       for obj in bpy.data.collections[name].all_objects if obj.type == 'MESH']
if not art or any('REFERENCE' in obj.name for obj in art):
    raise RuntimeError('Expected only Final Attempt art collections')
selection, active = list(bpy.context.selected_objects), bpy.context.view_layer.objects.active
camera, path = scene.camera, scene.render.filepath
try:
    bpy.ops.object.select_all(action='DESELECT')
    for obj in art:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = art[0]
    bpy.ops.export_scene.gltf(filepath=str(root / 'grand_canyon_final.glb'),
                              export_format='GLB', use_selection=True, export_apply=True)
    if '--render' in sys.argv:
        scene.render.resolution_x, scene.render.resolution_y = 1920, 1080
        scene.render.resolution_percentage = 100
        scene.render.image_settings.file_format = 'PNG'
        for hero in (1, 2, 3):
            for moment in ('Approach', 'Reveal', 'Exit'):
                name = f'H{hero}_{moment}'
                scene.camera = bpy.data.objects[name]
                scene.render.filepath = str(root / 'final-attempt' / (name + '.png'))
                bpy.ops.render.render(write_still=True)
finally:
    scene.camera, scene.render.filepath = camera, path
    bpy.ops.object.select_all(action='DESELECT')
    for obj in selection:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = active
print('Exported Final Attempt artwork without reference road or cameras.')
