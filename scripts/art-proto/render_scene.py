"""Render/export the opened, artist-edited scene without rebuilding any geometry.

blender --background art-prototype/output/Grand_Canyon_Art_Prototype.blend \
    --python-exit-code 1 --python scripts/art-proto/render_scene.py
"""
import json
import math
from pathlib import Path

import bpy
from mathutils import Vector

if not bpy.data.filepath:
    raise RuntimeError("Open the edited .blend before running this script")
root = Path(bpy.data.filepath).parent
road = json.loads((root / "road-reference.json").read_text(encoding="utf-8"))
scene = bpy.context.scene


def converted(v):
    return Vector((v[0], -v[2], v[1]))


for spec in road["cameras"]:
    obj = bpy.data.objects[spec["name"]]
    direction = (converted(spec["look"]) - converted(spec["eye"])).normalized()
    actual = obj.matrix_world.to_quaternion() @ Vector((0, 0, -1))
    corners = obj.data.view_frame(scene=scene)
    hfov = math.degrees(2 * math.atan(abs(corners[0].x / corners[0].z)))
    vfov = math.degrees(2 * math.atan(abs(corners[0].y / corners[0].z)))
    if ((obj.matrix_world.translation - converted(spec["eye"])).length > .001
            or (direction - actual).length > .00001
            or abs(hfov - spec["horizontalFov"]) > .0001
            or abs(vfov - spec["verticalFov"]) > .0001):
        raise RuntimeError("Game chase camera mismatch: " + spec["name"])

camera, filepath = scene.camera, scene.render.filepath
selected = list(bpy.context.selected_objects)
active = bpy.context.view_layer.objects.active
try:
    scene.render.image_settings.file_format = "PNG"
    for spec in road["cameras"]:
        scene.camera = bpy.data.objects[spec["name"]]
        scene.render.filepath = str(root / (spec["name"] + ".png"))
        bpy.ops.render.render(write_still=True)
    bpy.ops.object.select_all(action="DESELECT")
    art = [obj for name in ("10_EDIT_TERRAIN", "20_EDIT_SCENIC_ASSETS")
           for obj in bpy.data.collections[name].all_objects if obj.type == "MESH"]
    if not art:
        raise RuntimeError("No art meshes to export")
    for obj in art:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = art[0]
    bpy.ops.export_scene.gltf(filepath=str(root / "canyon_art_only.glb"),
                              export_format="GLB", use_selection=True,
                              export_apply=True)
    print("Rendered three game cameras; exported", len(art), "art meshes")
    print("GLB uses material base colors; Blender weathering nodes are not baked.")
finally:
    scene.camera, scene.render.filepath = camera, filepath
    bpy.ops.object.select_all(action="DESELECT")
    for obj in selected:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = active
