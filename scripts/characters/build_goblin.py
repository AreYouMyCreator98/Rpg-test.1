"""Free, deterministic Blender 4.3+ character authoring. No services or paid assets.
Run from any directory: blender -b -t 4 --python scripts/characters/build_goblin.py
Draft only: never modifies the current game's scout-model.js or legacy glTF.
"""
import bpy, math, json, random, sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
CFG=json.loads((Path(__file__).parent/'goblin-scout.json').read_text())
OUT=ROOT/'assets/models';PRE=ROOT/'previews/goblin-scout'
OUT.mkdir(parents=True,exist_ok=True);PRE.mkdir(parents=True,exist_ok=True)
random.seed(CFG['seed']);bpy.ops.wm.read_factory_settings(use_empty=True)
M={}
for name,h in CFG['palette'].items():
 m=bpy.data.materials.new(name);m.diffuse_color=tuple(((int(h[i:i+2],16)/255+.055)/1.055)**2.4 for i in (0,2,4))+(1,)
 m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=m.diffuse_color
 p.inputs['Roughness'].default_value=.82 if name!='steel' else .32;p.inputs['Metallic'].default_value=.65 if name=='steel' else 0
 # A small vertex palette gives variation without runtime texture dependencies.
 n=m.node_tree.nodes.new('ShaderNodeVertexColor');n.layer_name='Pigment';m.node_tree.links.new(n.outputs['Color'],p.inputs['Base Color'])
 M[name]=m
objects=[]
def mesh(name,verts,faces,mat,bone='Chest',weights=None):
 d=bpy.data.meshes.new(name);d.from_pydata(verts,[],faces);d.update();o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);d.materials.append(M[mat]);objects.append(o)
 c=d.color_attributes.new(name='Pigment',type='FLOAT_COLOR',domain='CORNER')
 col=M[mat].diffuse_color
 for p in d.polygons:
  shade=random.uniform(.92,1.065)
  for i in p.loop_indices:c.data[i].color=tuple(min(1,v*shade) for v in col[:3])+(1,)
 if weights:
  for i,w in enumerate(weights):
   for b,val in w.items():
    g=o.vertex_groups.get(b) or o.vertex_groups.new(name=b);g.add([i],val,'REPLACE')
 else:o.vertex_groups.new(name=bone).add(list(range(len(verts))),1,'REPLACE')
 return o

def tube(name,points,radii,mat,bone='Chest',n=12,weights=None):
 """Hand-shaped cross sections along an arbitrary articulated contour."""
 vs=[];fs=[];ws=[]
 for j,pt in enumerate(points):
  p=Vector(pt);t=Vector(points[min(j+1,len(points)-1)])-Vector(points[max(0,j-1)])
  t.normalize();u=t.cross(Vector((0,1,0))).normalized()
  if u.length<.01:u=t.cross(Vector((0,0,1))).normalized()
  v=t.cross(u).normalized();r=radii[j];r=(r,r) if isinstance(r,(int,float)) else r
  for i in range(n):
   a=2*math.pi*i/n;q=p+u*(r[0]*math.cos(a))+v*(r[1]*math.sin(a));vs.append(tuple(q));ws.append(weights[j] if weights else {bone:1})
 for j in range(len(points)-1):
  for i in range(n):
   a=j*n+i;b=j*n+(i+1)%n;c=b+n;d=a+n
   fs.extend([(a,b,c),(a,c,d)])
 fs.extend([tuple(reversed(range(n))),tuple(range((len(points)-1)*n,len(points)*n))])
 return mesh(name,vs,fs,mat,bone,ws)

def oval(name,p,r,mat,bone='Head',n=16,rings=8):
 pts=[];rs=[]
 for j in range(rings+1):
  a=math.pi*j/rings;pts.append((p[0],p[1],p[2]-r[2]*math.cos(a)));rs.append((max(.001,r[0]*math.sin(a)),max(.001,r[1]*math.sin(a))))
 return tube(name,pts,rs,mat,bone,n)

def ribbon(name,points,width,mat,bone='Chest'):
 vs=[]
 for x,y,z in points:vs.extend([(x-width/2,y,z),(x+width/2,y-.007,z)])
 return mesh(name,vs,[(i,i+1,i+3,i+2) for i in range(0,len(vs)-2,2)],mat,bone)

def line(name,points,r,mat,bone='Chest',n=6):return tube(name,points,[r]*len(points),mat,bone,n)
def buckle(name,p,w,h,bone='Pelvis'):
 x,y,z=p
 line(name,[(x-w,y,z-h),(x+w,y,z-h),(x+w,y,z+h),(x-w,y,z+h),(x-w,y,z-h)],.018,'steel',bone)
 line(name+' tongue',[(x,y-.015,z),(x+w*.8,y-.015,z)],.012,'steel',bone)

def sheet(name,rows,mat,bone):
 vs=[p for row in rows for p in row];n=len(rows[0]);fs=[]
 for j in range(len(rows)-1):
  for i in range(n-1):
   a=j*n+i;fs.extend([(a,a+1,a+1+n),(a,a+1+n,a+n)])
 o=mesh(name,vs,fs,mat,bone)
 mod=o.modifiers.new('Cloth thickness','SOLIDIFY');mod.thickness=.012
 bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.modifier_apply(modifier=mod.name);o.select_set(False)
 return o

# A lean torso: shaped rings give a ribcage, waist and exposed abdomen.
tube('Abdomen',[(0,0,1.27),(0,0,1.42),(0,0,1.56),(0,0,1.73)],[(.27,.16),(.225,.14),(.24,.16),(.29,.18)],'skin','Spine',16,
 [{'Pelvis':1},{'Pelvis':.5,'Spine':.5},{'Spine':1},{'Spine':.5,'Chest':.5}])
tube('Fitted leather jerkin',[(0,0,1.55),(0,0,1.73),(0,0,1.92),(0,0,2.05)],[(.25,.175),(.29,.19),(.37,.2),(.29,.16)],'cloth','Chest',20,
 [{'Spine':1},{'Spine':.4,'Chest':.6},{'Chest':1},{'Chest':1}])
tube('Neck',[(0,0,2.0),(0,0,2.18),(0,0,2.27)],[(.13,.12),(.12,.11),(.16,.14)],'skin','Neck',12)
# Face silhouette is authored as asymmetrical-depth planar rings, not a sphere.
headrows=[(2.18,.12,.10,-.02),(2.25,.22,.17,-.025),(2.34,.29,.21,0),(2.45,.32,.24,0),(2.59,.32,.23,.015),(2.72,.27,.21,.035),(2.79,.12,.12,.04)]
vs=[];fs=[]
for z,rx,ry,cy in headrows:
 for i in range(16):
  a=2*math.pi*i/16;vs.append((rx*math.cos(a),cy+ry*math.sin(a),z))
for j in range(len(headrows)-1):
 for i in range(16):
  a=j*16+i;b=j*16+(i+1)%16;fs.extend([(a,b,b+16),(a,b+16,a+16)])
fs += [tuple(reversed(range(16))),tuple(range(96,112))]
mesh('Angular head',vs,fs,'skin_light','Head')
# Muzzle and chin with a pronounced wedge nose.
mesh('Sculpted muzzle',[(-.23,-.18,2.37),(-.19,-.29,2.32),(0,-.325,2.32),(.19,-.29,2.32),(.23,-.18,2.37),(.14,-.2,2.23),(0,-.245,2.19),(-.14,-.2,2.23)],[(0,1,2),(0,2,4),(2,3,4),(1,7,6,2),(2,6,5,3),(0,7,1),(4,3,5)],'skin','Head')
mesh('Nose bridge',[(-.065,-.22,2.59),(.065,-.22,2.59),(-.085,-.29,2.45),(.085,-.29,2.45),(0,-.4,2.44),(0,-.28,2.56)],[(0,2,4,5),(1,5,4,3),(0,5,1),(2,3,4)],'skin_light','Head')
line('Smirk',[(-.2,-.294,2.35),(-.1,-.325,2.325),(0,-.332,2.322),(.12,-.319,2.335),(.21,-.282,2.37)],.008,'dark','Head')
for s in [-1,1]:
 # Thick swept ears with inset amber bowls.
 v=[(s*.27,0,2.58),(s*.86,.045,2.81),(s*.54,.02,2.48),(s*.34,-.025,2.43),(s*.44,-.105,2.58),(s*.44,.07,2.59)]
 f=[(0,1,4),(1,2,4),(2,3,4),(3,0,4),(1,0,5),(2,1,5),(3,2,5),(0,3,5)]
 mesh('Pointed ear',v,f if s>0 else [tuple(reversed(a)) for a in f],'skin_light','Head')
 mesh('Ear bowl',[(s*.37,-.06,2.59),(s*.76,.013,2.76),(s*.51,-.024,2.51),(s*.43,-.065,2.5)],[(0,1,2),(0,2,3)],'ear','Head')
 oval('Eye socket',(s*.15,-.212,2.515),(.109,.028,.062),'dark',n=12,rings=5)
 oval('Almond eye',(s*.15,-.239,2.51),(.095,.024,.046),'ivory',n=12,rings=5)
 oval('Amber iris',(s*.139,-.262,2.51),(.039,.014,.039),'amber',n=12,rings=5)
 oval('Slit pupil',(s*.139,-.275,2.51),(.013,.005,.033),'dark',n=8,rings=4)
 oval('Eye glint',(s*.128,-.281,2.527),(.009,.003,.011),'ivory',n=6,rings=4)
 tube('Heavy expressive brow',[(s*.055,-.265,2.55),(s*.13,-.266,2.57),(s*.25,-.217,2.61)],[(.028,.033),(.042,.033),(.014,.018)],'skin','Head',7)
 tube('Ivory tusk',[(s*.175,-.295,2.325),(s*.174,-.317,2.37),(s*.166,-.318,2.414)],[.028,.018,.001],'ivory','Head',8)
 # Thin cheek scar, visible in the authored reference.
 line('Cheek scar',[(s*.23,-.205,2.46),(s*.265,-.168,2.425)],.006,'rust','Head',5)
# Hood open around the face, rear rings close around the back of the skull.
hood=[]
for j,(y,rx,rz,cz) in enumerate([(-.29,.405,.49,2.49),(-.14,.43,.50,2.49),(.065,.44,.47,2.5),(.25,.32,.35,2.49),(.32,.12,.15,2.47)]):
 row=[]
 for i in range(17):
  a=-.42+(math.pi+.84)*i/16
  row.append((rx*math.cos(a),y,cz+rz*math.sin(a)+(0.06 if i==8 else 0)))
 hood.append(row)
sheet('Pointed open hood',hood,'rust','Head')
line('Hood leather binding',hood[0],.024,'edge','Head',6)
# Seal the rear crown; only the intentional face opening remains open.
cap=hood[-1]+[(0,.36,2.45)]
mesh('Rear hood closure',cap,[(i,i+1,17) for i in range(16)]+[(16,0,17)],'rust','Head')
# Close rear lower hood without sealing the face.
sheet('Hood nape',[[hood[j][0],(0,hood[j][0][1]+.08,2.13),hood[j][-1]] for j in range(5)],'rust','Head')
# Stitches along crown seam.
for j in range(7):
 y=-.21+j*.075;z=2.99-max(0,y)*.7
 line('Crown stitching',[(-.024,y,z),(.024,y+.009,z)],.006,'edge','Head',5)
# Hood insignia positioned on its sloped front-right panel.
mesh('Hood rune',[(.10,-.307,2.84),(.15,-.305,2.94),(.24,-.305,2.84),(.21,-.307,2.84),(.15,-.309,2.90),(.13,-.309,2.84)],[(0,1,4,5),(1,2,3,4)],'ivory','Head')
# Draped back collar joins both shoulder edges of the front scarf.
sheet('Scarf back wrap',[[(-.34,.12,2.19),(-.22,.24,2.18),(0,.27,2.18),(.22,.24,2.18),(.34,.12,2.19)],[(-.32,.15,2.01),(-.22,.25,1.98),(0,.28,1.96),(.22,.25,1.98),(.32,.15,2.01)]],'rust','Chest')
# Three overlapping scarf folds drape in V-shapes around the shoulders.
for j in range(3):
 r=.35-j*.035;z=2.19-j*.075
 sheet('Scarf fold',[[(-r,.13,z),(-r,-.14,z),(-.15,-.25,z-.06),(0,-.28,z-.1),(.16,-.24,z-.06),(r,-.12,z),(r,.13,z)],
 [(-r,.15,z-.085),(-r*.93,-.16,z-.08),(-.15,-.28,z-.15),(0,-.31,z-.19),(.16,-.27,z-.15),(r*.93,-.14,z-.08),(r,.15,z-.085)]],'rust','Chest')
# Ragged tails behind the left hip (the reference's characteristic silhouette).
for k in range(2):
 rows=[]
 for j in range(7):
  z=2.08-j*.135;cx=-.12-k*.13-j*.045;y=.22+j*.033
  rows.append([(cx-.1,y,z),(cx,y+.024,z-.025),(cx+.1,y,z-(.12 if j==6 else 0))])
 sheet('Torn scarf tail',rows,'rust','Chest')
# Belt / separated skirt tassets retain leg clearance.
tube('Waist belt',[(0,0,1.295),(0,0,1.39)],[(.292,.195),(.285,.19)],'leather','Pelvis',20)
buckle('Belt buckle',(0,-.212,1.34),.066,.052)
for s in [-1,1]:
 for i in range(3):
  x=s*(.11+i*.065);oval('Belt rivet',(x,-.206+i*.009,1.355),(.008,.005,.008),'steel','Pelvis',6,3)
 # individual asymmetric panels
 for k in range(3):
  a=-math.pi/2+s*(.4+k*.49);rows=[]
  for j,(r,z) in enumerate([(.275,1.29),(.33,1.13),(.39,.93+(k%2)*.07)]):
   rows.append([(r*math.cos(a+q),r*.72*math.sin(a+q),z+(random.random()*.035 if j==2 else 0)) for q in [-.24,0,.24]])
  sheet('Layered leather tasset',rows,'leather' if k!=1 else 'cloth','Pelvis')
# Cloth underskirt wraps the back and hips; panels are separate for leg motion.
for k in range(12):
 a=math.tau*k/12
 rows=[]
 for r,z in [(.277,1.29),(.32,1.13),(.37,.94)]:
  rows.append([(r*math.cos(a+q),r*.75*math.sin(a+q),z-(.04 if q==0 else 0)) for q in [-.255,0,.255]])
 sheet('Ragged underskirt',rows,'cloth','Pelvis')
# Front cloth tabard with gold binding and insignia.
sheet('Rust tabard',[[(-.12,-.218,1.28),(0,-.235,1.27),(.12,-.218,1.28)],[(-.115,-.272,.99),(0,-.30,.95),(.115,-.272,.99)],[(-.075,-.30,.79),(0,-.31,.67),(.075,-.30,.81)]],'rust','Pelvis')
line('Tabard binding',[(-.12,-.23,1.27),(-.115,-.285,.99),(-.075,-.31,.79),(0,-.32,.67),(.075,-.31,.81),(.115,-.285,.99),(.12,-.23,1.27)],.008,'edge','Pelvis',5)
mesh('Tabard rune',[(0,-.312,1.14),(-.062,-.316,1.04),(0,-.326,.92),(.062,-.316,1.04),(0,-.325,1.10),(-.032,-.325,1.04),(0,-.331,.97),(.032,-.325,1.04)],[(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],'ivory','Pelvis')
# Crossing chest straps, stitching and central clasp.
for s in [-1,1]:
 ribbon('Cross harness',[(s*.31,-.16,2.0),(s*.20,-.213,1.86),(0,-.231,1.71),(-s*.23,-.18,1.59)],.075,'edge')
 for j in range(8):
  t=j/7;x=s*(.27-.5*t);z=1.96-.35*t
  oval('Harness rivet',(x,-.225,z),(.006,.006,.006),'ivory','Chest',5,3)
buckle('Harness clasp',(0,-.249,1.72),.046,.05,'Chest')
# Leg anatomy / layered boots. The continuous knee rings have blended weights.
for s,side in [(-1,'R'),(1,'L')]:
 th='Thigh.'+side;sh='Shin.'+side;ft='Foot.'+side
 tube('Athletic leg '+side,[(s*.17,0,1.29),(s*.19,0,1.11),(s*.21,-.014,.88),(s*.22,-.034,.77),(s*.225,0,.61),(s*.225,.015,.45)],[(.135,.13),(.13,.125),(.096,.09),(.085,.084),(.11,.09),(.076,.073)],'skin',th,14,[{th:1},{th:1},{th:.85,sh:.15},{th:.35,sh:.65},{sh:1},{sh:1}])
 tube('Boot shaft '+side,[(s*.225,.015,.13),(s*.225,.015,.27),(s*.225,.01,.42),(s*.225,0,.5)],[(.105,.11),(.084,.085),(.10,.09),(.12,.105)],'cloth',sh,14)
 tube('Ankle wrap '+side,[(s*.225,0,.46),(s*.225,0,.53),(s*.225,0,.57)],[(.113,.098),(.112,.10),(.102,.094)],'ivory',sh,12)
 for z,r in [(.19,.11),(.39,.112),(.46,.128)]:
  tube('Boot strap',[(s*.225,0,z),(s*.225,0,z+.038)],[(r,.102),(r,.105)],'leather',sh,12)
 tube('Boot heel '+side,[(s*.225,.07,.04),(s*.225,.07,.18)],[(.1,.12),(.095,.1)],'leather',ft,12)
 # Toe volume sweeps forward with a flat sole.
 tube('Boot toe '+side,[(s*.225,-.08,.048),(s*.225,-.085,.11),(s*.225,-.06,.17),(s*.225,.005,.25)],[(.129,.23),(.123,.22),(.112,.18),(.085,.092)],'leather',ft,14)
 tube('Boot sole '+side,[(s*.225,-.08,.018),(s*.225,-.08,.06)],[(.131,.235),(.129,.23)],'edge',ft,16)
 buckle('Boot clasp',(s*.225,-.104,.41),.035,.023,sh)
# Relaxed A-pose arms; joint sections can deform, bracers stay rigid.
for s,side in [(-1,'R'),(1,'L')]:
 upper='UpperArm.'+side;fore='Forearm.'+side;hand='Hand.'+side
 pts=[(s*.30,0,1.99),(s*.43,0,1.91),(s*.56,0,1.76),(s*.62,-.005,1.64),(s*.69,-.025,1.50),(s*.76,-.05,1.38)]
 tube('Arm '+side,pts,[(.125,.12),(.14,.12),(.108,.097),(.09,.085),(.094,.08),(.062,.06)],'skin',upper,14,[{upper:1},{upper:1},{upper:1},{upper:.45,fore:.55},{fore:1},{fore:1}])
 tube('Linen sleeve '+side,pts[2:4],[(.118,.106),(.107,.095)],'ivory',upper,12)
 tube('Bracer '+side,pts[3:],[(.114,.1),(.108,.095),(.079,.076)],'cloth',fore,12)
 for t in [.2,.7]:
  a=Vector(pts[3]).lerp(Vector(pts[-1]),t);b=a+Vector((s*.024,-.005,-.022))
  tube('Bracer strap',[a,b],[.112 if t<.5 else .094]*2,'leather',fore,10)
 oval('Glove '+side,(s*.80,-.059,1.31),(.087,.071,.105),'cloth',hand,12,7)
 for f in range(4):
  x=s*(.748+f*.03);y=-.065+(f%2)*.015
  tube('Finger',[(x,y,1.27),(x+s*.015,y-.008,1.215),(x+s*.008,y-.032,1.20)],[.018,.017,.011],'skin',hand,7)
 tube('Thumb',[(s*.739,-.078,1.34),(s*.71,-.11,1.28),(s*.725,-.127,1.255)],[.025,.022,.014],'skin',hand,8)
# Asymmetrical articulated shoulder armour.
sheet('Left layered pauldron',[[ (.27,-.13,2.04),(.37,-.17,2.08),(.45,-.12,2.0)],[ (.31,.02,2.09),(.43,.01,2.11),(.54,.0,1.95)],[ (.29,.14,2.03),(.42,.16,2.06),(.5,.13,1.93)]],'leather','UpperArm.L')
for x,z in [(.34,2.055),(.44,2.035),(.49,1.978)]:oval('Shoulder stud',(x,-.13,z),(.013,.013,.013),'steel','UpperArm.L',6,3)
# Pack, pouches and a bedroll give the rear silhouette real geometry.
for x,z,b in [(-.3,1.21,'Pelvis'),(.32,1.22,'Pelvis'),(.11,1.77,'Chest')]:
 y=.21 if b=='Chest' else -.04
 tube('Travel pouch',[(x,y,z-.11),(x,y,z-.08),(x,y,z+.10),(x,y,z+.13)],[(.09,.06),(.11,.085),(.10,.08),(.075,.05)],'leather',b,10)
 ribbon('Pouch flap',[(x,y-.081,z+.1),(x,y-.096,z+.04),(x,y-.098,z-.05)],.085,'edge',b)
 buckle('Pouch buckle',(x,y-.108,z+.01),.023,.025,b)
tube('Backpack',[(.04,.23,1.64),(.04,.27,1.74),(.04,.25,1.95)],[(.17,.10),(.18,.12),(.13,.08)],'leather','Chest',12)
tube('Rolled blanket',[(-.17,.37,1.8),(.23,.37,1.8)],[.082,.082],'edge','Chest',14)
for side in [-1,1]:
 x=-.175 if side<0 else .235
 pts=[]
 for i in range(40):
  a=i*.43;r=.006+i*.00165;pts.append((x,.37+r*math.cos(a),1.8+r*math.sin(a)))
 line('Bedroll spiral',pts,.006,'cloth','Chest',5)
# Proper steel dagger in the right hand, weighted to Hand.R.
line('Dagger grip',[(-.80,-.08,1.38),(-.80,-.08,1.20)],.028,'leather','Hand.R',10)
line('Dagger guard',[(-.9,-.08,1.19),(-.70,-.08,1.19)],.018,'steel','Hand.R',8)
mesh('Dagger blade',[(-.86,-.08,1.18),(-.74,-.08,1.18),(-.80,-.107,1.10),(-.80,-.08,.86),(-.80,-.055,1.10)],[(0,2,1),(0,3,2),(2,3,1),(0,4,3),(1,3,4),(0,1,4)],'steel','Hand.R')

# Reusable humanoid armature. Blender Z-up, exported glTF Y-up / +Z forward.
arm=bpy.data.armatures.new('Humanoid');rig=bpy.data.objects.new('ScoutRig',arm);bpy.context.collection.objects.link(rig);bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
def bone(n,h,t,parent=None):
 b=arm.edit_bones.new(n);b.head=h;b.tail=t
 if parent:b.parent=arm.edit_bones[parent]
 return b
bone('Root',(0,0,0),(0,0,.2));bone('Pelvis',(0,0,1.28),(0,0,1.45),'Root');bone('Spine',(0,0,1.45),(0,0,1.73),'Pelvis');bone('Chest',(0,0,1.73),(0,0,2.04),'Spine');bone('Neck',(0,0,2.04),(0,0,2.24),'Chest');bone('Head',(0,0,2.24),(0,0,2.8),'Neck')
for s,side in [(-1,'R'),(1,'L')]:
 bone('Shoulder.'+side,(0,0,2.01),(s*.30,0,1.99),'Chest');bone('UpperArm.'+side,(s*.30,0,1.99),(s*.62,-.005,1.64),'Shoulder.'+side);bone('Forearm.'+side,(s*.62,-.005,1.64),(s*.76,-.05,1.38),'UpperArm.'+side);bone('Hand.'+side,(s*.76,-.05,1.38),(s*.80,-.06,1.24),'Forearm.'+side)
 bone('Weapon.'+side,(s*.80,-.08,1.26),(s*.80,-.08,1.06),'Hand.'+side)
 bone('Thigh.'+side,(s*.17,0,1.28),(s*.22,-.034,.77),'Pelvis');bone('Shin.'+side,(s*.22,-.034,.77),(s*.225,.015,.23),'Thigh.'+side);bone('Foot.'+side,(s*.225,.015,.23),(s*.225,-.23,.09),'Shin.'+side)
bpy.ops.object.mode_set(mode='OBJECT');rig.select_set(False)
# Join into one weighted mesh; glTF splits only by the shared material palette.
for o in objects:o.select_set(True)
bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();body=bpy.context.object;body.name='ScoutSkinnedMesh'
mod=body.modifiers.new('Humanoid skin','ARMATURE');mod.object=rig;body.parent=rig
# Recalculate winding for all authored surfaces.
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT')
body.data.calc_loop_triangles();triangles=len(body.data.loop_triangles)
for p in rig.pose.bones:p.rotation_mode='XYZ'
s=bpy.context.scene;s.render.fps=30
clips={}
for name,frames in [('Idle',60),('Walk',30),('Run',20),('Attack',24),('Hit',15),('Death',48)]:
 rig.animation_data_create();act=bpy.data.actions.new(name);rig.animation_data.action=act
 for f in range(0,frames+1,2):
  t=f/frames;wave=math.sin(t*math.tau)
  for p in rig.pose.bones:p.location=(0,0,0);p.rotation_euler=(0,0,0);p.scale=(1,1,1)
  p=rig.pose.bones
  if name=='Idle':
   p['Chest'].scale=(1+wave*.012,1+wave*.006,1+wave*.012);p['Head'].rotation_euler.z=wave*.025
  elif name in ['Walk','Run']:
   amp=.33 if name=='Walk' else .56
   for side,phase in [('L',0),('R',math.pi)]:
    v=math.sin(t*math.tau+phase);p['Thigh.'+side].rotation_euler.x=amp*v;p['Shin.'+side].rotation_euler.x=-max(0,v)*amp*1.3;p['Foot.'+side].rotation_euler.x=-amp*v*.25
    p['UpperArm.'+side].rotation_euler.x=-amp*v*.65;p['Forearm.'+side].rotation_euler.x=-.13-max(0,-v)*.2
   p['Chest'].rotation_euler.x=.05 if name=='Walk' else .13
  elif name=='Attack':
   # Deliberate anticipation, fast slash, gradual recovery.
   a=math.sin(min(t/.35,1)*math.pi/2) if t<.35 else max(0,1-(t-.35)/.65)
   slash=max(0,1-abs(t-.48)/.15)
   p['Chest'].rotation_euler.z=.32*a-.70*slash;p['UpperArm.R'].rotation_euler.x=-.75*a;p['UpperArm.R'].rotation_euler.z=-.4*a+1.35*slash;p['Forearm.R'].rotation_euler.x=-.6*a
  elif name=='Hit':
   a=math.sin(math.pi*t)**2;p['Chest'].rotation_euler.x=-.25*a;p['Head'].rotation_euler.x=-.18*a;p['UpperArm.L'].rotation_euler.z=-.15*a
  else:
   a=min(1,t*1.3);p['Root'].location.y=0;p['Root'].rotation_euler.x=-1.48*a
   p['Thigh.L'].rotation_euler.x=.55*a;p['Shin.L'].rotation_euler.x=-.8*a;p['Thigh.R'].rotation_euler.x=.35*a;p['Shin.R'].rotation_euler.x=-.7*a;p['Chest'].rotation_euler.x=.15*a
  # Match the support plane after each sampled pose; the root stays in-place.
  if name in ['Walk','Run','Death']:
   bpy.context.view_layer.update()
   evaluated=body.evaluated_get(bpy.context.evaluated_depsgraph_get())
   low=min((evaluated.matrix_world @ v.co).z for v in evaluated.data.vertices)
   p['Root'].location.y += .018-low
  for b in p:
   for prop in ['rotation_euler','location','scale']:b.keyframe_insert(prop,frame=f)
 for fc in act.fcurves:
  for k in fc.keyframe_points:k.interpolation='LINEAR'
 track=rig.animation_data.nla_tracks.new();track.name=name;strip=track.strips.new(name,0,act);strip.name=name;track.mute=True;clips[name]=act
rig.animation_data.action=None
for p in rig.pose.bones:p.location=(0,0,0);p.rotation_euler=(0,0,0);p.scale=(1,1,1)
s.frame_set(0)
bpy.ops.object.select_all(action='DESELECT');body.select_set(True);rig.select_set(True);bpy.context.view_layer.objects.active=rig
# NLA actions exported independently; no scene cameras or lights in the game file.
for tr in rig.animation_data.nla_tracks:tr.mute=False
bpy.ops.export_scene.gltf(filepath=str(OUT/'goblin_scout.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_skins=True,export_yup=True)
for tr in rig.animation_data.nla_tracks:tr.mute=True
rig.animation_data.action=clips['Idle'];s.frame_set(0)
# Neutral studio for actual mesh review (Cycles CPU, no GPU or paid software).
s.render.engine='CYCLES';s.cycles.device='CPU';s.cycles.samples=32;s.cycles.use_denoising=False
s.render.resolution_x=720;s.render.resolution_y=900;s.render.resolution_percentage=100
s.world=bpy.data.worlds.new('Studio');s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs[0].default_value=(.18,.21,.22,1);s.world.node_tree.nodes['Background'].inputs[1].default_value=.5
s.view_settings.view_transform='AgX'
bpy.ops.mesh.primitive_plane_add(size=200);floor=bpy.context.object;floor.name='Preview floor';fm=bpy.data.materials.new('Studio floor');fm.diffuse_color=(.11,.13,.125,1);floor.data.materials.append(fm);floor.location.z=-.012
for n,pos,power,size,col in [('Key',(-3,-4,6),500,4,(1,.88,.72)),('Fill',(3,-2,4),250,3,(.76,.86,1)),('Rim',(2,3,5),650,3,(1,.78,.54))]:
 bpy.ops.object.light_add(type='AREA',location=pos);o=bpy.context.object;o.name=n;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.data.color=col;o.rotation_euler=(Vector((0,0,1.5))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();cam=bpy.context.object;s.camera=cam;cam.data.type='ORTHO';cam.data.ortho_scale=3.65
views={'three-quarter':(4,-7,3.2),'front':(0,-8,2.2),'left':(-8,0,2.2),'right':(8,0,2.2),'back':(0,8,2.2)}
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
for name,pos in views.items():
 if '--no-render' in args:continue
 if '--first-only' in args and name!='three-quarter':continue
 cam.location=pos;cam.rotation_euler=(Vector((0,0,1.48))-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(PRE/(name+'.png'));bpy.ops.render.render(write_still=True)
manifest={'blender':bpy.app.version_string,'triangles':triangles,'bones':len(arm.bones),'clips':list(clips),'materials':len(M),'seed':CFG['seed'],'status':'draft — not integrated; animation ground-contact review pending'}
(PRE/'manifest.json').write_text(json.dumps(manifest,indent=2));print('CHARACTER REPORT',json.dumps(manifest))
bpy.ops.wm.save_as_mainfile(filepath='/tmp/realm-character/goblin-scout.blend')
