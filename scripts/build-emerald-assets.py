"""Blender 4.x: authored silhouettes, metric Z-up source -> glTF Y-up.
Run: blender -b --python scripts/build-emerald-assets.py
Original geometry, no downloaded textures. Each named model is one vertex-colour mesh.
"""
import bpy, math, random, json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
material=bpy.data.materials.new('Emerald palette');material.use_nodes=True
bsdf=material.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Roughness'].default_value=.92
colour=material.node_tree.nodes.new('ShaderNodeVertexColor');colour.layer_name='Col'
material.node_tree.links.new(colour.outputs['Color'],bsdf.inputs['Base Color'])
report={}
class Model:
 def __init__(self,name): self.name=name;self.v=[];self.f=[];self.c=[]
 def face(self,points,col):
  n=len(self.v);self.v.extend(points);self.f.append(tuple(range(n,n+len(points))));self.c.extend([(*col,1)]*len(points))
 def tube(self,points,radii,col,n=6):
  rings=[]
  for i,p in enumerate(points):
   d=Vector(points[min(i+1,len(points)-1)])-Vector(points[max(0,i-1)])
   d.normalize();u=d.cross(Vector((0,1,0))).normalized();v=d.cross(u)
   rings.append([Vector(p)+radii[i]*(u*math.cos(j*math.tau/n)+v*math.sin(j*math.tau/n)) for j in range(n)])
  for i in range(len(rings)-1):
   for j in range(n): self.face([rings[i][j],rings[i][(j+1)%n],rings[i+1][(j+1)%n],rings[i+1][j]],tuple(c*(.85+.15*j/n) for c in col))
  self.face(rings[-1],col)
 def crown(self,p,size,col,seed,detail=1):
  rng=random.Random(seed);n=10 if detail else 6;rings=[]
  for k,(z,r) in enumerate([(-.75,.35),(-.3,.88),(.25,1),(.7,.66)]):
   rings.append([Vector((p[0]+size[0]*r*math.cos(j*math.tau/n)*(1+.17*math.sin(j*2.7+k*.8)+rng.uniform(-.07,.07)),p[1]+size[1]*r*math.sin(j*math.tau/n)*(1+.17*math.sin(j*2.7+k*.8)+rng.uniform(-.07,.07)),p[2]+size[2]*(z+rng.uniform(-.09,.09)))) for j in range(n)])
  bottom=Vector((p[0],p[1],p[2]-size[2]));top=Vector((p[0]+.1,p[1],p[2]+size[2]))
  for j in range(n):
   self.face([bottom,rings[0][(j+1)%n],rings[0][j]],tuple(c*.72 for c in col))
   for k in range(3):
    a,b,c,d=rings[k][j],rings[k][(j+1)%n],rings[k+1][(j+1)%n],rings[k+1][j]
    shade=.76+k*.10+rng.random()*.12;cc=tuple(t*shade for t in col)
    self.face([a,b,c],cc);self.face([a,c,d],cc)
   self.face([rings[-1][j],rings[-1][(j+1)%n],top],col)
 def finish(self):
  mesh=bpy.data.meshes.new(self.name);mesh.from_pydata(self.v,[],self.f);mesh.update()
  c=mesh.color_attributes.new(name='Col',type='FLOAT_COLOR',domain='POINT')
  for i,col in enumerate(self.c):c.data[i].color=col
  ob=bpy.data.objects.new(self.name,mesh);bpy.context.collection.objects.link(ob);ob.data.materials.append(material)
  report[self.name]={'triangles':sum(len(f)-2 for f in self.f),'vertices':len(self.v)}
wood=(.19,.095,.04);green=(.23,.43,.055)
for name,seed,kind in [('oak-a',14,'oak'),('oak-b',43,'oak'),('oak-c',71,'oak'),('birch-b',37,'birch'),('pine-b',104,'pine'),('pine-c',126,'pine'),('birch-a',28,'birch'),('ancient-oak',92,'oak'),('pine-a',55,'pine'),('fir-a',67,'pine'),('willow-a',82,'willow'),('dead-tree',153,'dead'),('sapling',177,'sapling')]:
 for lod in ['near','far']:
  rng=random.Random(seed);m=Model(name+'-'+lod);near=lod=='near';h=9 if kind=='pine' else 7.5
  lean=rng.uniform(-.6,.6);bark=(.58,.57,.4) if kind=='birch' else wood
  m.tube([(0,0,0),(.12,0,h*.3),(lean,.12,h*.65),(lean*.7,.18,h)],[.32,.23,.13,.025],bark,7)
  if near:
   for j in range(5):
    a=j*math.tau/5;m.tube([(math.cos(a)*.65,math.sin(a)*.65,.02),(math.cos(a)*.25,math.sin(a)*.25,.15),(0,0,.8)],[.06,.13,.1],bark,5)
  if kind=='dead':
   for j in range(5):
    a=j*2.4;z=h*(.35+j*.1);m.tube([(lean*.5,0,z),(math.cos(a)*1.2,math.sin(a)*1.2,z+.6),(math.cos(a)*1.8,math.sin(a)*1.8,z+.5)],[.13,.06,.007],wood,5 if near else 4)
  elif kind=='pine':
   for tier in range(7 if near else 5):
    t=tier/(7 if near else 5);z=h*(.25+t*.69);radius=(1-t)*3.05+.15
    for j in range(6):
     a=j*math.tau/6+tier*.8;dx,dy=math.cos(a),math.sin(a)
     if near:m.tube([(lean*t,0,z),(dx*radius*.5,dy*radius*.5,z-.25),(dx*radius,dy*radius,z-.5)],[.075,.045,.008],wood,4)
     # Broad asymmetric, serrated needles around a downward-curved branch, not stacked cones.
     origin=Vector((lean*t,0,z+.55));tip=Vector((dx*radius,dy*radius,z-.4));side=Vector((-dy,dx,0))*radius*.65
     ridge=(origin+tip)*.5+Vector((0,0,.4));cc=(.055+t*.032,.235+t*.13,.095+t*.035)
     edge=[origin,origin*.4+tip*.6+side*.85,tip*.85+origin*.15+side*.45,tip,tip*.8+origin*.2-side*.4,origin*.45+tip*.55-side*.85]
     if not near:edge=[origin,origin*.45+tip*.55+side*.8,tip*.8+origin*.2+side*.35,tip,tip*.8+origin*.2-side*.35,origin*.45+tip*.55-side*.8]
     for k in range(len(edge)):
      m.face([ridge,edge[k],edge[(k+1)%len(edge)]],tuple(v*(.8+(k%3)*.13) for v in cc))
      m.face([ridge-Vector((0,0,.9)),edge[(k+1)%len(edge)],edge[k]],tuple(v*.72 for v in cc))
   # Connected needle spire replaces the isolated oval cap above a bare trunk.
   for tier in range(3):
    z=h*.83+tier*.49;r=.83-tier*.23;upper=max(.015,r-.29)
    for j in range(8):
     a=j*math.tau/8;b=(j+1)*math.tau/8
     m.face([(lean*.7+math.cos(a)*r,math.sin(a)*r,z),(lean*.7+math.cos(b)*r,math.sin(b)*r,z),(lean*.7+math.cos(b)*upper,math.sin(b)*upper,z+.64),(lean*.7+math.cos(a)*upper,math.sin(a)*upper,z+.64)],(.07+tier*.018,.30+tier*.028,.13))
  else:
   count=10 if near else 6
   for j in range(count):
    a=j*2.4;radius=(1.2+(j%3)*.5)*(1.25 if name=='ancient-oak' else 1);z=h*(.63+(j%4)*.07)
    endpoint=(math.cos(a)*radius,math.sin(a)*radius,z)
    m.tube([(lean*.5,0,h*.44),(endpoint[0]*.55,endpoint[1]*.55,z-.65),endpoint],[.12,.075,.025],bark,5 if near else 4)
    pal=(.36,.5,.095) if kind=='birch' else (.19,.38,.065) if kind=='willow' else (.18+(j%3)*.035,.39+(j%3)*.045,.065+(j%2)*.02)
    m.crown(endpoint,(1.65,1.55,1.85 if kind!='willow' else 1.0),pal,seed+j,near)
    if near and kind not in ['willow','sapling'] and j%2==0:
     # Broken terminal foliage masses and sun-catching young shoots, not a smooth ball.
     tip=(endpoint[0]*1.32,endpoint[1]*1.32,z+.48)
     m.tube([endpoint,tip],[.025,.006],bark,4)
     m.crown(tip,(.75,.68,.65),tuple(c*1.08 for c in pal),seed+j+100,0)
    if kind=='willow' and near:
     for k in range(3):
      xx=endpoint[0]+math.sin(k*2)*.7;yy=endpoint[1]+math.cos(k*2)*.7
      m.crown((xx,yy,z-1.2),(.3,.35,1.55),(.16,.34,.07),seed+j+k,0)
  if kind=='sapling':m.v=[tuple(v*.3 for v in p) for p in m.v]
  m.finish()
for name in ['fern','flowers','reeds','grass','tall-grass','bush','mushrooms','moss','ivy','river-rock','moss-rock','stepping-stone','outcrop','fallen-log','stump','branch']:
 m=Model(name);rng=random.Random(800)
 if name in ['fern','grass','tall-grass','reeds']:
  for j in range(7):
   a=j*2.4;dx,dy=math.cos(a),math.sin(a);h=.8 if name=='tall-grass' else .45 if name=='grass' else .65 if name=='fern' else 1.2
   if name=='fern':
    m.tube([(0,0,0),(dx*.25,dy*.25,h),(dx*.65,dy*.65,h*.6)],[.014,.009,.002],(.12,.28,.035),3)
    for k in range(1,6):
     t=k/6;center=Vector((dx*.65*t,dy*.65*t,h*math.sin(t*1.9)));width=.18*(1-t)+.025
     for side in [-1,1]:m.face([center,center+Vector((-dy*width*side,dx*width*side,-.025)),center+Vector((dx*.16,dy*.16,.045))],(.10+k*.012,.28+k*.013,.055))
   else:
    center=Vector((dx*.12,dy*.12,0));width=.07 if name=='grass' else .035
    left=center+Vector((-dy*width,dx*width,0));right=center-Vector((-dy*width,dx*width,0))
    bend=center+Vector((dx*.10,dy*.10,h*.62));tip=center+Vector((dx*.34,dy*.34,h))
    m.face([left,right,bend],(.16,.32,.06));m.face([left,bend,tip],(.29,.46,.095))
    if name=='reeds':m.tube([(dx*.3,dy*.3,h*.7),(dx*.3,dy*.3,h)],[.04,.028],(.23,.15,.05),5)
 elif name=='flowers':
  for j in range(4):
   x,y=math.sin(j*2)*.25,math.cos(j*2)*.25;z=.3+j*.045;m.tube([(x,y,0),(x+.02,y,z)],[.012,.007],(.16,.3,.04),3)
   for k in range(5):
    a=k*math.tau/5;m.face([(x,y,z),(x+math.cos(a)*.12,y+math.sin(a)*.12,z+.04),(x+math.cos(a+.9)*.12,y+math.sin(a+.9)*.12,z+.02)],(.85,.67,.25) if j%2 else (.43,.35,.68))
 elif name=='bush':
  for j in range(4):m.crown((math.sin(j*2.4)*.4,math.cos(j*2.4)*.4,.4+j*.08),(.6,.55,.45),(.12,.3,.045),j+42,0)
 elif name=='mushrooms':
  for j in range(3):
   x,y=j*.14,math.sin(j*2)*.15;m.tube([(x,y,0),(x,y,.18+j*.03)],[.027,.022],(.62,.52,.34),5);m.crown((x,y,.21+j*.03),(.12,.11,.065),(.5,.18,.05),j+80,0)
 elif name in ['moss','ivy']:
  for j in range(6):m.crown((math.sin(j*2.4)*.3,math.cos(j*2.4)*.3,.035),(.22,.18,.06),(.17,.31,.055),j+23,0)
 elif name=='stump':
  m.tube([(0,0,0),(.05,0,.4),(0,.04,.7)],[.45,.34,.29],wood,9);m.crown((0,.04,.7),(.25,.24,.025),(.45,.28,.1),34,0)
 elif name=='branch':m.tube([(-.8,0,.04),(0,.1,.08),(.7,-.1,.04)],[.035,.05,.015],wood,5);m.tube([(0,.1,.08),(.3,.5,.05)],[.035,.01],wood,5)
 elif name=='stepping-stone':m.crown((0,0,.06),(.8,.65,.13),(.39,.44,.4),133,0)
 elif name=='outcrop':
  for j in range(3):m.crown((j*.7,math.sin(j)*.3,.6+j*.1),(.85,.8,1.1),(.32,.36,.34),200+j,1)
 elif name=='fallen-log':m.tube([(-1.8,0,.23),(-.5,.08,.32),(1.8,.15,.28)],[.28,.32,.24],wood,9);m.tube([(.2,.05,.4),(.4,.5,.65)],[.09,.025],wood,5)
 else:
  m.crown((0,0,.18 if name=='river-rock' else .35),(.55,.4,.35) if name=='river-rock' else (.9,.65,.7),(.34,.39,.35),123,0)
  if name=='moss-rock':m.crown((.04,0,.65),(.6,.5,.14),(.18,.29,.055),129,0)
 m.finish()
path=ROOT/'assets/environment/emerald-library.glb';path.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',export_yup=True,export_apply=True,export_materials='EXPORT',export_normals=True,export_animations=False)
(ROOT/'assets/environment/emerald-library.json').write_text(json.dumps({'author':'Noxavere Studios / Realm of the Fallen','generator':'scripts/build-emerald-assets.py','units':'metres','models':report},indent=2)+'\n')
print(json.dumps(report))
