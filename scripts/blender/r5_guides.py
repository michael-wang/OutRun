"""Import R5 authored road geometry into Blender (offline authoring only).

Run from repo root after 'npm run r5:road-guide':
  blender -b --python scripts/blender/r5_guides.py -- \
      art-prototype/output/r5-road-guide.json \
      art-prototype/output/r5-road-guide.blend

The input is GENERATED FROM THE LIVE GAME SAMPLER. Guide objects are
non-colliding art references. They are not exported as gameplay roads.
"""
import json
import os
import sys
from pathlib import Path

import bpy


def game_to_blender(xyz):
    # Three.js is Y-up, Blender is Z-up. Keep all metres and depth.
    return (xyz[0], xyz[2], xyz[1])


def curve(name, positions, collection):
    geometry = bpy.data.curves.new(name, "CURVE")
    geometry.dimensions = "3D"
    geometry.resolution_u = 1
    spline = geometry.splines.new("POLY")
    spline.points.add(len(positions) - 1)
    for point, xyz in zip(spline.points, positions):
        point.co = (*game_to_blender(xyz), 1.0)
    obj = bpy.data.objects.new(name, geometry)
    collection.objects.link(obj)
    return obj


def main():
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    source = Path(args[0]) if args else Path("art-prototype/output/r5-road-guide.json")
    output = Path(args[1]) if len(args) > 1 else Path("art-prototype/output/r5-road-guide.blend")
    with source.open(encoding="utf-8") as stream:
        guide = json.load(stream)
    assert guide.get("schemaVersion") == 1 and guide.get("stage") == "coast"
    samples = guide["samples"]
    assert len(samples) > 2 and all(samples[i]["distance"] < samples[i + 1]["distance"]
                                    for i in range(len(samples) - 1))

    existing = bpy.data.collections.get("R5_GUIDES")
    if existing:
        for obj in list(existing.objects):
            bpy.data.objects.remove(obj, do_unlink=True)
        bpy.data.collections.remove(existing)
    collection = bpy.data.collections.new("R5_GUIDES")
    bpy.context.scene.collection.children.link(collection)

    curve("R5_RoadCenter_REFERENCE_ONLY", [row["position"] for row in samples], collection)
    # Show each true world-space hero location as an ART-DIRECTION anchor.
    # These are not colliders, road surface or final scenic geometry.
    for hero in guide.get("heroSlots", []):
        marker = bpy.data.objects.new("HERO_" + hero["id"], None)
        marker.empty_display_type = "SPHERE"
        marker.empty_display_size = 18
        marker.location = game_to_blender(hero["position"])
        marker["roadDistance"] = hero["distance"]
        marker["lookAheadM"] = hero["lookAheadM"]
        marker["lookingTo"] = hero["side"]
        marker["brief"] = hero["brief"]
        collection.objects.link(marker)

    def shifted(row, lateral):
        return [row["position"][k] + row["right"][k] * lateral for k in range(3)]

    curve("R5_LeftShoulder_REFERENCE_ONLY",
          [shifted(row, -row["roadWidth"] / 2 - 3) for row in samples], collection)
    verge = curve("R5_InlandVerge_GeometryNodesSource",
                  [shifted(row, row["roadWidth"] / 2 + 40) for row in samples], collection)

    # This tiny Geometry Nodes proof puts NON-COLLIDING rock proxies along the
    # real inland guide. Deliberately no final materials or baked terrain yet.
    # Refine/exchange the rock source after the whitebox has been driven.
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=1)
    rock = bpy.context.object
    rock.name = "R5_RockPrototype"
    rock.scale = (4, 5, 3)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    rock.location = (0, 0, -10000)  # prevent uninstanced source in scenic shots
    # Source mesh lives in the scene only as the instancing object.

    group = bpy.data.node_groups.new("R5_GN_SimpleRockScatter", "GeometryNodeTree")
    group.interface.new_socket(name="Geometry", in_out="INPUT", socket_type="NodeSocketGeometry")
    group.interface.new_socket(name="Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    nodes, links = group.nodes, group.links
    inlet = nodes.new("NodeGroupInput")
    outlet = nodes.new("NodeGroupOutput")
    to_points = nodes.new("GeometryNodeCurveToPoints")
    to_points.mode = "LENGTH"
    to_points.inputs["Length"].default_value = 65
    source_node = nodes.new("GeometryNodeObjectInfo")
    source_node.inputs["Object"].default_value = rock
    instances = nodes.new("GeometryNodeInstanceOnPoints")
    scale = nodes.new("FunctionNodeRandomValue")
    scale.data_type = "FLOAT"
    scale.inputs["Min"].default_value = 0.75
    scale.inputs["Max"].default_value = 1.6
    links.new(inlet.outputs["Geometry"], to_points.inputs["Curve"])
    links.new(to_points.outputs["Points"], instances.inputs["Points"])
    links.new(source_node.outputs["Geometry"], instances.inputs["Instance"])
    links.new(scale.outputs["Value"], instances.inputs["Scale"])
    links.new(instances.outputs["Instances"], outlet.inputs["Geometry"])
    modifier = verge.modifiers.new("R5_RockScatter_PREVIEW_ONLY", "NODES")
    modifier.node_group = group

    output.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(output.resolve()))
    print(f"R5c Blender guide built: {len(samples)} source samples; {output}")


if __name__ == "__main__":
    main()
