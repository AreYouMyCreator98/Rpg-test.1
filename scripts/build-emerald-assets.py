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
  rng=random.Random(seed);n=8 if detail else 5;rings=[]
  for k,(z,r) in enumerate([(-.75,.35),(-.3,.88),(.25,1),(.7,.66)]):
   rings.append([Vector((p[0]+size[0]*r*math.cos(j*math.tau/n)*(1+rng.uniform(-.2,.2)),p[1]+size[1]*r*math.sin(j*math.tau/n)*(1+rng.uniform(-.2,.2)),p[2]+size[2]*(z+rng.uniform(-.09,.09)))) for j in range(n)])
  bottom=Vector((p[0],p[1],p[2]-size[2]));top=Vector((p[0]+.1,p[1],p[2]+size[2]))
  for j in range(n):
   self.face([bottom,rings[0][(j+1)%n],rings[0][j]],tuple(c*.65 for c in col))
   for k in range(3):
    a,b,c,d=rings[k][j],rings[k][(j+1)%n],rings[k+1][(j+1)%n],rings[k+1][j]
    shade=.72+k*.12+rng.random()*.1;cc=tuple(t*shade for t in col)
    self.face([a,b,c],cc);self.face([a,c,d],cc)
   self.face([rings[-1][j],rings[-1][(j+1)%n],top],col)
 def finish(self):
  mesh=bpy.data.meshes.new(self.name);mesh.from_pydata(self.v,[],self.f);mesh.update()
  c=mesh.color_attributes.new(name='Col',type='FLOAT_COLOR',domain='POINT')
  for i,col in enumerate(self.c):c.data[i].color=col
  ob=bpy.data.objects.new(self.name,mesh);bpy.context.collection.objects.link(ob);ob.data.materials.append(material)
  report[self.name]={'triangles':sum(len(f)-2 for f in self.f),'vertices':len(self.v)}
wood=(.19,.095,.04);green=(.23,.43,.055)
for name,seed,kind in [('oak-a',14,'oak'),('oak-b',43,'oak'),('birch-a',28,'birch'),('ancient-oak',92,'oak'),('pine-a',55,'pine'),('fir-a',67,'pine'),('willow-a',82,'willow')]:
 for lod in ['near','far']:
  rng=random.Random(seed);m=Model(name+'-'+lod);near=lod=='near';h=9 if kind=='pine' else 7.5
  lean=rng.uniform(-.6,.6);bark=(.58,.57,.4) if kind=='birch' else wood
  m.tube([(0,0,0),(.12,0,h*.3),(lean,.12,h*.65),(lean*.7,.18,h)],[.32,.23,.13,.025],bark,7)
  if near:
   for j in range(5):
    a=j*math.tau/5;m.tube([(math.cos(a)*.65,math.sin(a)*.65,.02),(math.cos(a)*.25,math.sin(a)*.25,.15),(0,0,.8)],[.06,.13,.1],bark,5)
  if kind=='pine':
   for tier in range(7 if near else 5):
    t=tier/(7 if near else 5);z=h*(.25+t*.69);radius=(1-t)*3.05+.15
    for j in range(6):
     a=j*math.tau/6+tier*.8;dx,dy=math.cos(a),math.sin(a)
     if near:m.tube([(lean*t,0,z),(dx*radius*.5,dy*radius*.5,z-.25),(dx*radius,dy*radius,z-.5)],[.075,.045,.008],wood,4)
     # Broad asymmetric, serrated needles around a downward-curved branch, not stacked cones.
     origin=Vector((lean*t,0,z+.55));tip=Vector((dx*radius,dy*radius,z-.4));side=Vector((-dy,dx,0))*radius*.65
     ridge=(origin+tip)*.5+Vector((0,0,.4));cc=(.032+t*.012,.16+t*.08,.055+t*.015)
     edge=[origin,origin*.4+tip*.6+side*.85,tip*.85+origin*.15+side*.45,tip,tip*.8+origin*.2-side*.4,origin*.45+tip*.55-side*.85]
     if not near:edge=[origin,origin*.45+tip*.55+side,tip,origin*.45+tip*.55-side]
     for k in range(len(edge)):
      m.face([ridge,edge[k],edge[(k+1)%len(edge)]],tuple(v*(.8+(k%3)*.13) for v in cc))
      m.face([ridge-Vector((0,0,.9)),edge[(k+1)%len(edge)],edge[k]],tuple(v*.7 for v in cc))
   m.crown((lean*.7,0,h-.1),(.35,.4,.8),(.07,.32,.14),seed,0)
  else:
   count=10 if near else 5
   for j in range(count):
    a=j*2.4;radius=(1.2+(j%3)*.5)*(1.25 if name=='ancient-oak' else 1);z=h*(.63+(j%4)*.07)
    endpoint=(math.cos(a)*radius,math.sin(a)*radius,z)
    m.tube([(lean*.5,0,h*.44),(endpoint[0]*.55,endpoint[1]*.55,z-.65),endpoint],[.12,.075,.025],bark,5 if near else 4)
    pal=(.36,.5,.095) if kind=='birch' else (.19,.38,.065) if kind=='willow' else (.16+(j%3)*.025,.34+(j%3)*.035,.045)
    m.crown(endpoint,(1.65,1.55,1.4 if kind!='willow' else .65),pal,seed+j,near)
    if kind=='willow' and near:
     for k in range(3):
      xx=endpoint[0]+math.sin(k*2)*.7;yy=endpoint[1]+math.cos(k*2)*.7
      m.crown((xx,yy,z-1.2),(.3,.35,1.55),(.16,.34,.07),seed+j+k,0)
  m.finish()
for name in ['fern','flowers','reeds','grass','river-rock','moss-rock','fallen-log']:
 m=Model(name);rng=random.Random(800)
 if name in ['fern','grass','reeds']:
  for j in range(7):
   a=j*2.4;dx,dy=math.cos(a),math.sin(a);h=.45 if name=='grass' else .65 if name=='fern' else 1.2
   if name=='fern':
    m.tube([(0,0,0),(dx*.25,dy*.25,h),(dx*.65,dy*.65,h*.6)],[.014,.009,.002],(.12,.28,.035),3)
    for k in range(1,6):
     t=k/6;center=Vector((dx*.65*t,dy*.65*t,h*math.sin(t*1.9)));width=.18*(1-t)+.025
     for side in [-1,1]:m.face([center,center+Vector((-dy*width*side,dx*width*side,-.025)),center+Vector((dx*.16,dy*.16,.045))],(.10+k*.012,.28+k*.013,.055))
   else:
    center=Vector((dx*.12,dy*.12,0));width=.07 if name=='grass' else .035
    m.face([center+Vector((-dy*width,dx*width,0)),center-Vector((-dy*width,dx*width,0)),center+Vector((dx*.3,dy*.3,h))],(.24,.4,.065))
    if name=='reeds':m.tube([(dx*.3,dy*.3,h*.7),(dx*.3,dy*.3,h)],[.04,.028],(.23,.15,.05),5)
 elif name=='flowers':
  for j in range(4):
   x,y=math.sin(j*2)*.25,math.cos(j*2)*.25;z=.3+j*.045;m.tube([(x,y,0),(x+.02,y,z)],[.012,.007],(.16,.3,.04),3)
   for k in range(5):
    a=k*math.tau/5;m.face([(x,y,z),(x+math.cos(a)*.12,y+math.sin(a)*.12,z+.04),(x+math.cos(a+.9)*.12,y+math.sin(a+.9)*.12,z+.02)],(.85,.67,.25) if j%2 else (.43,.35,.68))
 elif name=='fallen-log':m.tube([(-1.8,0,.23),(-.5,.08,.32),(1.8,.15,.28)],[.28,.32,.24],wood,9);m.tube([(.2,.05,.4),(.4,.5,.65)],[.09,.025],wood,5)
 else:
  m.crown((0,0,.18 if name=='river-rock' else .35),(.55,.4,.35) if name=='river-rock' else (.9,.65,.7),(.34,.39,.35),123,0)
  if name=='moss-rock':m.crown((.04,0,.65),(.6,.5,.14),(.18,.29,.055),129,0)
 m.finish()
path=ROOT/'assets/environment/emerald-library.glb';path.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',export_yup=True,export_apply=True,export_materials='EXPORT',export_normals=True,export_animations=False)
(ROOT/'assets/environment/emerald-library.json').write_text(json.dumps({'author':'Noxavere Studios / Realm of the Fallen','generator':'scripts/build-emerald-assets.py','units':'metres','models':report},indent=2)+'\n')
print(json.dumps(report))
