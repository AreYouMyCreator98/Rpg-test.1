"""Free geometry-only Scout LOD. Run after build_goblin.py:
blender -b /tmp/realm-character/goblin-scout.blend -t 4 --python scripts/characters/build_scout_lod.py
The primary GLB is never overwritten. Runtime reuses its rig and animation clips.
"""
import bpy,json,struct
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
body=bpy.data.objects['ScoutSkinnedMesh'];rig=bpy.data.objects['ScoutRig']
rig.animation_data.action=None
for tr in rig.animation_data.nla_tracks:tr.mute=True
for b in rig.pose.bones:b.location=(0,0,0);b.rotation_euler=(0,0,0);b.scale=(1,1,1)
bpy.context.view_layer.update();bpy.ops.object.select_all(action='DESELECT');body.select_set(True);bpy.context.view_layer.objects.active=body
mod=body.modifiers.new('Mobile simplification','DECIMATE');mod.ratio=.5;mod.use_collapse_triangulate=True
while body.modifiers.find(mod.name)>0:bpy.ops.object.modifier_move_up(modifier=mod.name)
bpy.ops.object.modifier_apply(modifier=mod.name)
body.data.calc_loop_triangles();count=len(body.data.loop_triangles)
assert 3000<count<6000,count
rig.select_set(True)
out=ROOT/'assets/models/goblin_scout_lod.glb'
bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',use_selection=True,export_animations=False,export_skins=True,export_yup=True)
data=out.read_bytes();doc=json.loads(data[20:20+struct.unpack_from('<I',data,12)[0]])
exported=sum(doc['accessors'][p['indices']]['count']//3 for m in doc['meshes'] for p in m['primitives'])
manifest={'blender_triangles':count,'blender':bpy.app.version_string,'triangles':exported,'bytes':out.stat().st_size,'bones':len(rig.data.bones),'animations':'reuses primary rig and clips','ratio':.5}
(ROOT/'previews/goblin-scout/lod-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print('SCOUT LOD',json.dumps(manifest))
