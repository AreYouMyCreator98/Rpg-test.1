"""Render three real rig poses per draft clip from the generated .blend checkpoint.
blender -b /tmp/realm-character/goblin-scout.blend -t 4 --python scripts/characters/render_animation_review.py
"""
import bpy,json,sys
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[2];out=root/'previews/goblin-scout/animations';out.mkdir(parents=True,exist_ok=True)
s=bpy.context.scene;rig=bpy.data.objects['ScoutRig'];body=bpy.data.objects['ScoutSkinnedMesh']
s.render.resolution_x=384;s.render.resolution_y=480;s.cycles.samples=16
s.camera.location=(4,-7,3.2);s.camera.rotation_euler=(Vector((0,0,1.48))-s.camera.location).to_track_quat('-Z','Y').to_euler();s.camera.data.ortho_scale=3.8
report={}
for name in ['Idle','Walk','Run','Attack','Hit','Death']:
 if '--death-only' in sys.argv and name!='Death':continue
 for old in out.glob(name.lower()+'-*.png'):old.unlink()
 action=bpy.data.actions[name];rig.animation_data.action=action
 for track in rig.animation_data.nla_tracks:track.mute=True
 bounds=[]
 for fraction in [.0,.45,.95]:
  s.frame_set(round(action.frame_range.y*fraction));bpy.context.view_layer.update()
  evaluated=body.evaluated_get(bpy.context.evaluated_depsgraph_get());coords=[evaluated.matrix_world@v.co for v in evaluated.data.vertices];bounds.append({'frame':s.frame_current,'min_z':min(v.z for v in coords),'max_z':max(v.z for v in coords)})
  # Center on the deformed bounds so the death pose remains in frame.
  lo=Vector(tuple(min(v[i] for v in coords) for i in range(3)));hi=Vector(tuple(max(v[i] for v in coords) for i in range(3)));target=(lo+hi)/2
  s.camera.location=target+Vector((4,-7,3.2));s.camera.rotation_euler=(target-s.camera.location).to_track_quat('-Z','Y').to_euler()
  s.render.filepath=str(out/f'{name.lower()}-{s.frame_current:02}.png');bpy.ops.render.render(write_still=True)
 report[name]=bounds
previous=json.loads((out/'bounds.json').read_text()) if (out/'bounds.json').exists() else {};previous.update(report)
(out/'bounds.json').write_text(json.dumps(previous,indent=2));print('RENDERED',len(report)*3,'ANIMATION REVIEW POSES')
