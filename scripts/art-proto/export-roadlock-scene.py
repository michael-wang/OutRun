"""Export an edited full-route .blend without rebuilding its authored terrain.

blender --background art-prototype/output/roadlock/Grand_Canyon_Full_Route.blend
        --python-exit-code 1 --python scripts/art-proto/export-roadlock-scene.py
Append -- --render to render the nine saved chase cameras as well.
"""
import sys
from pathlib import Path
import bpy

if not bpy.data.filepath:
    raise RuntimeError('Open the full-route .blend first')
root = Path(bpy.data.filepath).parent
scene = bpy.context.scene
art = [obj for name in ('10_EDIT_FULL_ROUTE_LANDSCAPE', '20_EDIT_THREE_HERO_MASSING')
       for obj in bpy.data.collections[name].all_objects if obj.type == 'MESH']
if not art or any('REFERENCE' in obj.name for obj in art):
    raise RuntimeError('Expected art-only full-route collections')
selected = list(bpy.context.selected_objects)
active = bpy.context.view_layer.objects.active
camera, filepath = scene.camera, scene.render.filepath
try:
    bpy.ops.object.select_all(action='DESELECT')
    for obj in art:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = art[0]
    bpy.ops.export_scene.gltf(filepath=str(root / 'canyon_roadlock_art.glb'),
                              export_format='GLB', use_selection=True,
                              export_apply=True)
    if '--render' in sys.argv:
        scene.render.image_settings.file_format = 'PNG'
        for hero in (1, 2, 3):
            for moment in ('Approach', 'Reveal', 'Exit'):
                name = f'H{hero}_{moment}'
                scene.camera = bpy.data.objects[name]
                scene.render.filepath = str(root / (name + '.png'))
                bpy.ops.render.render(write_still=True)
finally:
    scene.camera, scene.render.filepath = camera, filepath
    bpy.ops.object.select_all(action='DESELECT')
    for obj in selected:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = active
print('Exported existing full-route art; road reference and cameras excluded.')
