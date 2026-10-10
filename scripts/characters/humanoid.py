"""Reusable biped template. Non-humanoids must use a separate rig. Units: metres."""
import bpy
def create_humanoid(scale=1.0):
 arm=bpy.data.armatures.new('Humanoid');rig=bpy.data.objects.new('ScoutRig',arm);bpy.context.collection.objects.link(rig);bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
 def bone(n,h,t,parent=None):
  b=arm.edit_bones.new(n);b.head=tuple(v*scale for v in h);b.tail=tuple(v*scale for v in t)
  if parent:b.parent=arm.edit_bones[parent]
  return b
 bone('Root',(0,0,0),(0,0,.2));bone('Pelvis',(0,0,1.28),(0,0,1.45),'Root');bone('Spine',(0,0,1.45),(0,0,1.73),'Pelvis');bone('Chest',(0,0,1.73),(0,0,2.04),'Spine');bone('Neck',(0,0,2.04),(0,0,2.24),'Chest');bone('Head',(0,0,2.24),(0,0,2.8),'Neck')
 for s,side in [(-1,'R'),(1,'L')]:
  bone('Shoulder.'+side,(0,0,2.01),(s*.30,0,1.99),'Chest');bone('UpperArm.'+side,(s*.30,0,1.99),(s*.62,-.005,1.64),'Shoulder.'+side);bone('Forearm.'+side,(s*.62,-.005,1.64),(s*.76,-.05,1.38),'UpperArm.'+side);bone('Hand.'+side,(s*.76,-.05,1.38),(s*.80,-.06,1.24),'Forearm.'+side)
  bone('Weapon.'+side,(s*.80,-.08,1.26),(s*.80,-.08,1.06),'Hand.'+side)
  bone('Thigh.'+side,(s*.17,0,1.28),(s*.22,-.034,.77),'Pelvis');bone('Shin.'+side,(s*.22,-.034,.77),(s*.225,.015,.23),'Thigh.'+side);bone('Foot.'+side,(s*.225,.015,.23),(s*.225,-.23,.09),'Shin.'+side)
 bpy.ops.object.mode_set(mode='OBJECT');rig.select_set(False)
 return rig,arm
