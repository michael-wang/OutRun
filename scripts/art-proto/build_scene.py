"""Blender 4.x blockout for one fixed 400m OutRun canyon.
Inputs are exact Three.js road samples and chase cameras exported by npm run art:road.
Generate once, THEN EDIT THE .blend BY HAND. No procedural environment at runtime.
Run: blender --background --python scripts/art-proto/build_scene.py -- \
  --input art-prototype/output/road-reference.json \
  --outdir art-prototype/output
"""
import argparse
import json
import math
import os
import sys

import bpy
from mathutils import Vector

args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
parser = argparse.ArgumentParser()
parser.add_argument("--input", default="art-prototype/output/road-reference.json")
parser.add_argument("--outdir", default="art-prototype/output")
opt = parser.parse_args(args)

with open(opt.input, encoding="utf-8") as source:
    road = json.load(source)
assert road["format"] == "outrun-blender-road-reference-v1"
os.makedirs(opt.outdir, exist_ok=True)
frames = road["frames"]
river_level = road["riverY"]
start = road["start"]

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
for col in list(bpy.data.collections):
    if col.name != "Collection" and col.users == 0:
        bpy.data.collections.remove(col)

def col(name):
    c = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(c)
    return c

road_ref = col("00_ROAD_REFERENCE_DO_NOT_EXPORT")
terrain_art = col("10_EDIT_TERRAIN")
scenic_art = col("20_EDIT_SCENIC_ASSETS")
cameras_col = col("90_CHASE_CAMERAS")
lights_col = col("91_LIGHTS")

def material(name, hex_color, rough=0.91):
    h = hex_color.lstrip("#")
    rgb = tuple(int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4))
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*rgb, 1.0)
    mat.use_nodes = True
    node = mat.node_tree.nodes.get("Principled BSDF")
    node.inputs["Base Color"].default_value = (*rgb, 1.0)
    node.inputs["Roughness"].default_value = rough
    return mat

sand = material("Sandstone | warm", "#BB885C")
cut = material("Cut slope | red", "#9D684C")
rim = material("Far escarpment | muted", "#C5A386")
bank = material("River bank | ochre", "#C99D68")
water = material("River | turquoise", "#287F90", .43)
asphalt = material("REFERENCE ONLY | asphalt", "#3E4A4B")
shoulder = material("REFERENCE ONLY | shoulder", "#C8B39A")
ridge = material("Layered red rock", "#AD7555")
ridge_cap = material("Mesa top", "#D2AA78")
palette = [rim, rim, bank, bank, cut, sand, sand, cut, ridge]

# Blender is Z-up. A glTF export maps (x, y, z)_Blender to
# (x, z, -y)_Three; this inverse preserves the REAL game coordinates.
def bvec(three):
    return Vector((three[0], -three[2], three[1]))

def xyz_from_frame(frame, raw, y_override=None):
    center = Vector(frame["center"])
    right = Vector(frame["right"])
    point = center + right * raw
    if y_override is not None:
        point.y = y_override
    return bvec(point)

def mesh_object(name, vertices, faces, materials, collection, bands=None):
    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata([tuple(v) for v in vertices], [], faces)
    mesh.update(calc_edges=True)
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    for mat in materials:
        mesh.materials.append(mat)
    if bands is not None:
        for polygon, band in zip(mesh.polygons, bands):
            polygon.material_index = band
    return obj

def along_sculpt(u, knots):
    if u <= knots[0][0]:
        return knots[0][1]
    for i in range(1, len(knots)):
        if u <= knots[i][0]:
            low, left = knots[i - 1]
            high, right = knots[i]
            t = (u - low) / (high - low)
            t = t * t * (3.0 - 2.0 * t)
            return left + (right - left) * t
    return knots[-1][1]

# These four editorial heights are HAND-AUTHORED. They aren't generated
# from a seed; adjust them directly while reviewing the three cameras.
LEFT_RIM = [(0, 12), (105, 28), (235, 40), (400, 15)]
RIGHT_WALL = [(0, 10), (110, 28), (250, 26), (400, 9)]
LEFT_PROFILE = [
    (-420, "river", 99), (-350, "river", 94),
    (-285, "river", 81), (-225, "river", 66),
    (-180, "river", 38), (-152, "river", 20),
    (-139, "river", 8), (-129, "river", -2),
    (-103, "river", -2), (-93, "river", 11),
    (-74, "road", -39), (-56, "road", -22),
    (-36, "road", -7), (-20, "road", -1.1),
]
RIGHT_PROFILE = [
    (20, "road", -1.1), (33, "road", 5),
    (53, "road", 13), (75, "road", 20),
    (112, "road", 30), (165, "road", 38),
    (225, "road", 44), (310, "road", 52), (420, "road", 52),
]

def ground_height(frame, raw, sign):
    u = frame["distance"] - start
    if sign == "left":
        profile = LEFT_PROFILE
        # A genuine distant ridge rather than freestanding thin towers.
        for offset, datum, value in profile:
            if abs(raw - offset) < .01:
                if datum == "road":
                    return frame["center"][1] + frame["right"][1] * raw + value
                return river_level + value + (
                    along_sculpt(u, LEFT_RIM) if raw < -175 else 0
                )
    else:
        for offset, datum, value in RIGHT_PROFILE:
            if abs(raw - offset) < .01:
                return frame["center"][1] + frame["right"][1] * raw + value + (
                    along_sculpt(u, RIGHT_WALL) * max(0, min(1, (raw - 33) / 70))
                )
    raise ValueError("Unknown authored terrain offset: %r" % raw)

def terrain_band(name, profile, which, materials, collection):
    n = len(profile)
    vertices = []
    faces = []
    bands = []
    for frame in frames:
        for raw, _, _ in profile:
            vertices.append(xyz_from_frame(frame, raw, ground_height(frame, raw, which)))
    for row in range(len(frames) - 1):
        for i in range(n - 1):
            a = row * n + i
            faces.append((a, a + 1, a + n + 1, a + n))
            bands.append(min(len(materials) - 1, int(i * len(materials) / (n - 1))))
    return mesh_object(name, vertices, faces, materials, collection, bands)

terrain_band("LEFT | continuous river valley and far shore",
             LEFT_PROFILE, "left", palette, terrain_art)
terrain_band("RIGHT | connected sandstone cut",
             RIGHT_PROFILE, "right", list(reversed(palette)), terrain_art)

def flat_strip(name, offsets, height_fn, mat, collection):
    vertices, faces = [], []
    for frame in frames:
        for raw in offsets:
            vertices.append(xyz_from_frame(frame, raw, height_fn(frame, raw)))
    for i in range(len(frames) - 1):
        a = i * len(offsets)
        faces.append((a, a + 1, a + 3, a + 2))
    return mesh_object(name, vertices, faces, [mat], collection)

# A 26m river has one constant world height. The giant -5m sea is NOT here.
flat_strip("RIVER | authored channel, fixed world height",
           [-128.5, -103.5], lambda f, r: river_level + .14, water, scenic_art)

# Grey road and shoulders are EXPORTED ONLY AS VIEWPORT REFERENCES.
# The actual runtime road will remain authoritative for driving/collision.
flat_strip("REFERENCE | asphalt (not exported)", [-7, 7],
           lambda f, r: f["center"][1] + f["right"][1] * r + .03, asphalt, road_ref)
flat_strip("REFERENCE | left shoulder", [-20, -7],
           lambda f, r: f["center"][1] + f["right"][1] * r - .1, shoulder, road_ref)
flat_strip("REFERENCE | right shoulder", [7, 20],
           lambda f, r: f["center"][1] - .1, shoulder, road_ref)

def closest_frame(distance):
    return min(frames, key=lambda f: abs(f["distance"] - distance))

def mesa_object(name, distance, raw, across, depth, height):
    frame = closest_frame(distance)
    center = xyz_from_frame(frame, raw)
    tangent = bvec([
        -math.sin(frame["heading"]), frame["grade"],
        math.cos(frame["heading"])
    ]).normalized()
    lateral = bvec(frame["right"]).normalized()
    up = Vector((0, 0, 1))
    base_y = ground_height(
        frame, -225 if raw < 0 else 165,
        "left" if raw < 0 else "right"
    )
    # A few broad stable strata blocks, not a row of disconnected columns.
    bottom = base_y - height * .65
    rings = [
        (-.0, .95, 1.0), (.35, 1.0, .96), (.72, .80, .86),
        (1.0, .62, .71),
    ]
    vertices = []
    for z, w, dep in rings:
        for sx, sy in [(-1, -1), (1, -1), (1, 1), (-1, 1)]:
            v = center + lateral * sx * across * w / 2 \
                + tangent * sy * depth * dep / 2
            v.z = bottom + height * z
            vertices.append(v)
    faces = []
    for i in range(3):
        for k in range(4):
            a = i * 4 + k
            b = i * 4 + (k + 1) % 4
            faces.append((a, b, b + 4, a + 4))
    faces.append((12, 13, 14, 15))
    return mesh_object(name, vertices, faces,
                       [ridge, ridge_cap], scenic_art,
                       [0] * 12 + [1])

# Only TWO authored large silhouette masses, as an initial art experiment.
mesa_object("FAR | layered plateau 01", start + 205, -315, 135, 160, 45)
mesa_object("FAR | layered plateau 02", start + 355, -370, 110, 135, 34)

scene = bpy.context.scene
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.film_transparent = False
scene.camera = None
try:
    scene.render.engine = "BLENDER_EEVEE_NEXT"
except Exception:
    scene.render.engine = "BLENDER_EEVEE"

world = bpy.data.worlds.new("Warm canyon daylight") if bpy.data.worlds.get("Warm canyon daylight") is None \
    else bpy.data.worlds["Warm canyon daylight"]
scene.world = world
world.use_nodes = True
background = world.node_tree.nodes.get("Background")
background.inputs["Color"].default_value = (.38, .57, .70, 1)
background.inputs["Strength"].default_value = .75

light_data = bpy.data.lights.new("Canyon afternoon sunlight", type="SUN")
light_obj = bpy.data.objects.new("Canyon afternoon sunlight", light_data)
lights_col.objects.link(light_obj)
light_data.energy = 2.3
light_data.angle = math.radians(15)
light_obj.rotation_euler = (math.radians(28), math.radians(-16), math.radians(-35))

for spec in road["cameras"]:
    data = bpy.data.cameras.new(spec["name"])
    obj = bpy.data.objects.new(spec["name"], data)
    cameras_col.objects.link(obj)
    obj.location = bvec(spec["eye"])
    target = bvec(spec["look"])
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()
    data.type = "PERSP"
    data.lens_unit = "FOV"
    data.sensor_fit = "HORIZONTAL"
    data.angle = math.radians(spec["horizontalFov"])
    data.clip_start = .5
    data.clip_end = 2500

cameras = [bpy.data.objects[spec["name"]] for spec in road["cameras"]]
scene.camera = cameras[1]

blend_file = os.path.abspath(os.path.join(opt.outdir, "Grand_Canyon_Art_Prototype.blend"))
bpy.ops.wm.save_as_mainfile(filepath=blend_file)

for obj in cameras:
    scene.camera = obj
    scene.render.filepath = os.path.abspath(
        os.path.join(opt.outdir, obj.name + ".png"))
    bpy.ops.render.render(write_still=True)

# Only geometry in art collections is exported for Three.js. The game road
# and its collision remain the single source of truth.
bpy.ops.object.select_all(action="DESELECT")
for collection in (terrain_art, scenic_art):
    for obj in collection.objects:
        obj.select_set(True)
scene.view_layers.objects.active = next(iter(terrain_art.objects))
glb_file = os.path.abspath(os.path.join(opt.outdir, "canyon_art_only.glb"))
bpy.ops.export_scene.gltf(
    filepath=glb_file, export_format="GLB",
    use_selection=True, export_apply=True
)
print("Blockout created:", blend_file, glb_file)
print("Preview: 01_Approach.png / 02_Reveal.png / 03_Exit.png")
