"""Author the original rigid-jointed scout glTF. Python stdlib only; no runtime build.
Coordinates: +Y up, +Z forward. Geometry is merged by joint/material, shared on clone.
Run: python scripts/build-goblin-scout.py
"""
import math, json, struct, base64, pathlib
D={'asset':{'version':'2.0','generator':'Realm of the Fallen scout authoring v1'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[],'meshes':[],'materials':[{'name':'Matte vertex palette','pbrMetallicRoughness':{'baseColorFactor':[1,1,1,1],'metallicFactor':0,'roughnessFactor':.9}},{'name':'Forged steel','pbrMetallicRoughness':{'baseColorFactor':[1,1,1,1],'metallicFactor':.65,'roughnessFactor':.38}}],'accessors':[],'bufferViews':[],'animations':[]}
buf=bytearray(); batches={}
def node(name,pos=(0,0,0),parent=None):
 i=len(D['nodes']);D['nodes'].append({'name':name,'translation':list(pos)})
 if parent is not None:D['nodes'][parent].setdefault('children',[]).append(i)
 return i
def color(h):
 vals=[int(h[i:i+2],16)/255 for i in (0,2,4)]
 return [v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in vals]
def tri(n,points,c,metal=0):
 a,b,d=points;u=[b[i]-a[i] for i in range(3)];v=[d[i]-a[i] for i in range(3)];norm=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];length=math.sqrt(sum(x*x for x in norm)) or 1;norm=[x/length for x in norm]
 p,no,co=batches.setdefault((n,metal),([],[],[]))
 for a in points:p.extend(a);no.extend(norm);co.extend(color(c))
def poly(n,verts,faces,c,metal=0):
 for face in faces:
  for j in range(1,len(face)-1):tri(n,[verts[face[0]],verts[face[j]],verts[face[j+1]]],c,metal)
def box(n,c,p,s,rz=0,metal=0):
 verts=[]
 for x,y,z in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]:
  x,y,z=x*s[0]/2,y*s[1]/2,z*s[2]/2;verts.append([p[0]+x*math.cos(rz)-y*math.sin(rz),p[1]+x*math.sin(rz)+y*math.cos(rz),p[2]+z])
 poly(n,verts,[(0,3,2,1),(4,5,6,7),(0,4,7,3),(1,2,6,5),(3,7,6,2),(0,1,5,4)],c,metal)
def ell(n,c,p,s,segments=8,rings=5):
 vs=[]
 for j in range(rings+1):
  a=math.pi*j/rings
  for i in range(segments):
   b=2*math.pi*i/segments;vs.append([p[0]+s[0]*math.sin(a)*math.cos(b),p[1]+s[1]*math.cos(a),p[2]+s[2]*math.sin(a)*math.sin(b)])
 for j in range(rings):
  for i in range(segments):
   a=j*segments+i;b=j*segments+(i+1)%segments;poly(n,vs,[(a,b,b+segments,a+segments)],c)
def cuff(n,c,p,rx,rz,h):
 vs=[[p[0]+rx*math.cos(i*math.pi/4),p[1]+y*h/2,p[2]+rz*math.sin(i*math.pi/4)] for y in [-1,1] for i in range(8)]
 poly(n,vs,[(i+8,(i+1)%8+8,(i+1)%8,i) for i in range(8)]+[tuple(range(8)),tuple(reversed(range(8,16)))],c)
def stud(n,p):
 x,y,z=p;r=.045
 poly(n,[[x-r,y,z],[x,y+r,z],[x+r,y,z],[x,y-r,z],[x,y,z+.035]],[(0,4,1),(1,4,2),(2,4,3),(3,4,0)],'a8adb0',1)
def cone(n,c,p,r,h,metal=0):
 vs=[[p[0]+r*math.cos(i*math.pi/3),p[1],p[2]+r*math.sin(i*math.pi/3)] for i in range(6)]+[[p[0],p[1]+h,p[2]]]
 poly(n,vs,[(6,(i+1)%6,i) for i in range(6)]+[tuple(range(6))],c,metal)
root=node('Scout');rig=node('Rig',parent=root);hips=node('Hips',(0,.88,0),rig);torso=node('Torso',(0,.16,0),hips);neck=node('Neck',(0,.51,0),torso);head=node('Head',(0,.32,0),neck)
skin='799b34';light='8eac40';leather='69472e';trim='87603c';cloth='302f22';steel='a8adb0'
ell(torso,cloth,(0,.16,0),(.34,.39,.23));ell(neck,skin,(0,0,0),(.17,.2,.16))
ell(head,light,(0,.045,0),(.43,.42,.32),10,7);ell(head,skin,(0,-.2,.12),(.34,.22,.27));ell(head,'617d29',(0,-.28,.15),(.27,.11,.24))
# Thick angular ears, inset bowls, cheek planes, ivory eyes and upward tusks.
for side in (-1,1):
 v=[[side*.3,.12,.02],[side*.93,.25,-.035],[side*.49,-.17,.035],[side*.43,.025,.16],[side*.44,.02,-.14]]
 faces=[(0,1,3),(1,2,3),(2,0,3),(1,0,4),(2,1,4),(0,2,4)]
 if side>0:faces=[tuple(reversed(f)) for f in faces]
 poly(head,v,faces,skin);poly(head,[[side*.44,.09,.18],[side*.81,.205,.055],[side*.5,-.08,.155]],[(2,1,0) if side>0 else (0,1,2)],'425b21')
 ell(head,skin,(side*.29,-.13,.235),(.145,.15,.12))
 ell(head,'e2dbb5',(side*.16,.015,.297),(.115,.11,.045),8,4);ell(head,'181e13',(side*.15,.005,.339),(.052,.069,.023),8,4);ell(head,'fff4d6',(side*.135,.03,.36),(.015,.019,.008),6,3)
 box(head,'242d18',(side*.17,.13,.33),(.27,.09,.085),side*.21)
 cone(head,'ede5c7',(side*.225,-.265,.345),.054,.19)
box(head,'303a1e',(0,-.265,.373),(.29,.025,.025))
poly(head,[[-.095,.13,.28],[.095,.13,.28],[-.14,-.14,.39],[.14,-.14,.39],[0,-.13,.56],[0,.09,.4]],[(0,2,4,5),(5,4,3,1),(0,5,1),(2,3,4),(0,1,3,2)],'88a738')
# Cowl layers, skirt, belt and cross-body harness.
for y,w in [(.42,.38),(.33,.34),(.24,.27)]:
 poly(torso,[[-w,y,.25],[w,y,.25],[0,y-.2,.3],[-w,y+.05,-.19],[w,y+.05,-.19]],[(0,2,1),(0,3,4,1),(3,0,2),(1,4,2)],'493628')
ell(hips,cloth,(0,-.025,0),(.37,.22,.25))
for i in range(8):
 a=i*math.pi/4;box(hips,'403a28',(math.sin(a)*.27,-.11,math.cos(a)*.19),(.16,.28,.09))
box(hips,leather,(0,.025,.015),(.72,.13,.49));box(hips,steel,(0,.025,.28),(.19,.16,.045),metal=1);box(hips,'3d2b1f',(0,.025,.306),(.115,.095,.012));box(hips,steel,(.045,.025,.318),(.09,.022,.025),metal=1)
box(torso,trim,(0,.12,.258),(.105,.63,.035),-.6);box(torso,leather,(0,.12,-.23),(.1,.62,.035),.6)
box(hips,leather,(-.32,-.035,.23),(.2,.27,.14));box(hips,trim,(-.32,.065,.26),(.22,.11,.16));box(hips,'b39769',(-.32,-.035,.32),(.05,.17,.027));box(hips,steel,(-.32,-.04,.34),(.075,.06,.02),metal=1)
for side,label in [(-1,'L'),(1,'R')]:
 arm=node('Arm'+label,(side*.4,.4,0),torso);elbow=node('Elbow'+label,(0,-.29,0),arm);hand=node('Hand'+label,(0,-.27,.01),elbow)
 ell(arm,skin,(0,-.16,0),(.135,.23,.135));ell(arm,cloth,(0,-.065,0),(.21,.15,.19))
 ell(arm,trim,(side*.035,.005,0),(.235,.16,.255),8,4);ell(arm,leather,(side*.055,-.075,0),(.24,.115,.26),8,3)
 stud(arm,(side*.085,-.015,.241))
 ell(elbow,light,(0,-.105,0),(.12,.185,.12));ell(elbow,leather,(0,-.17,0),(.145,.13,.14),8,4)
 for y in [-.1,-.23]:cuff(elbow,trim,(0,y,.02),.15,.14,.055)
 stud(elbow,(0,-.2,.153))
 ell(hand,skin,(0,-.07,0),(.135,.14,.105));ell(hand,light,(-side*.11,-.065,.065),(.055,.083,.055),6,4)
 for f in range(3):ell(hand,skin,(-.07+f*.07,-.16,.025),(.04,.068,.059),6,3)
 leg=node('Leg'+label,(side*.19,-.03,0),hips);knee=node('Knee'+label,(0,-.33,0),leg)
 ell(leg,'24271f',(0,-.16,0),(.145,.24,.15));ell(knee,leather,(0,-.23,.015),(.15,.2,.155));cuff(knee,trim,(0,-.13,.01),.175,.175,.14)
 ell(knee,leather,(0,-.39,.11),(.19,.135,.28),8,4);box(knee,'24241d',(0,-.45,.09),(.36,.08,.47));box(knee,trim,(0,-.33,.2),(.33,.06,.15))
 if label=='R':
  weapon=node('Dagger',(0,-.08,.055),hand);D['nodes'][weapon]['rotation']=[math.sin(.55),0,0,math.cos(.55)]
  box(weapon,'382a20',(0,-.01,.03),(.07,.09,.23));box(weapon,steel,(0,0,-.1),(.11,.1,.065),metal=1)
  for z in [0,.055,.11]:box(weapon,leather,(0,0,z),(.085,.095,.019))
  box(weapon,trim,(0,0,.16),(.27,.095,.055))
  poly(weapon,[[-.075,0,.2],[.075,0,.2],[0,.035,.27],[0,0,.69],[0,-.028,.27]],[(0,2,3),(2,1,3),(0,4,2),(2,4,1),(4,3,1),(0,3,4)],steel,1)
def acc(values,size):
 while len(buf)%4:buf.append(0)
 offset=len(buf);buf.extend(struct.pack('<'+'f'*len(values),*values));view=len(D['bufferViews']);D['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':len(values)*4});i=len(D['accessors']);D['accessors'].append({'bufferView':view,'componentType':5126,'count':len(values)//size,'type':{1:'SCALAR',3:'VEC3',4:'VEC4'}[size],'min':[min(values[j::size]) for j in range(size)],'max':[max(values[j::size]) for j in range(size)]});return i
for n in range(len(D['nodes'])):
 primitives=[]
 for (joint,metal),(p,no,c) in batches.items():
  if joint==n:primitives.append({'attributes':{'POSITION':acc(p,3),'NORMAL':acc(no,3),'COLOR_0':acc(c,3)},'material':metal})
 if primitives:D['nodes'][n]['mesh']=len(D['meshes']);D['meshes'].append({'name':D['nodes'][n]['name']+' geometry','primitives':primitives})
# All clips contain the same joint channels, allowing clean cross-fades and respawns.
animated=['Rig','Hips','Torso','Neck','Head','ArmL','ArmR','ElbowL','ElbowR','LegL','LegR','KneeL','KneeR']
def quat(x,y,z):
 a,b,c=[v/2 for v in (x,y,z)];return [math.sin(a)*math.cos(b)*math.cos(c)+math.cos(a)*math.sin(b)*math.sin(c),math.cos(a)*math.sin(b)*math.cos(c)-math.sin(a)*math.cos(b)*math.sin(c),math.cos(a)*math.cos(b)*math.sin(c)+math.sin(a)*math.sin(b)*math.cos(c),math.cos(a)*math.cos(b)*math.cos(c)-math.sin(a)*math.sin(b)*math.sin(c)]
for name,duration in [('Idle',2.4),('Walk',.85),('Run',.55),('Attack',.9),('Damage',.3),('Stagger',.55),('Death',1.1)]:
 times=[duration*i/24 for i in range(25)];clip={'name':name,'samplers':[],'channels':[]};ti=acc(times,1)
 def track(n,path,values,size):
  si=len(clip['samplers']);clip['samplers'].append({'input':ti,'output':acc(values,size),'interpolation':'LINEAR'});clip['channels'].append({'sampler':si,'target':{'node':n,'path':path}})
 for joint in animated:
  n=next(i for i,v in enumerate(D['nodes']) if v['name']==joint);values=[];positions=[]
  for t in times:
   u=t/duration;x=y=z=0;s=math.sin(u*math.tau);side=-1 if joint.endswith('L') else 1
   if name in ('Idle','Walk','Run'):
    motion=0 if name=='Idle' else .55 if name=='Walk' else .8
    if joint.startswith('Leg'):x=s*motion*side
    if joint.startswith('Knee'):x=max(0,-s*side)*motion*1.2
    if joint.startswith('Arm'):x=-s*motion*.65*side;z=-side*.09
    if joint.startswith('Elbow'):x=-.15-abs(s)*motion*.3
    if joint=='Torso':x=.06+( .13 if name=='Run' else 0);y=s*motion*.1
    if joint=='Head':y=s*.04
   elif name=='Attack':
    # Contact at .58 matches the existing AI's hit frame: windup, cut, recover.
    envelope=math.sin(math.pi*u);swing=-1+2*min(1,max(0,(u-.3)/.3));recovery=min(1,(1-u)/.22)
    if joint=='ArmR':x=-.8*envelope;y=swing*1.45*envelope;z=-.5*envelope
    if joint=='ElbowR':x=-.45*envelope
    if joint=='Torso':y=swing*.45*envelope;x=.17*envelope
    if joint=='ArmL':x=-.3*envelope;z=.15*envelope
   elif name in ('Damage','Stagger'):
    recoil=math.sin(math.pi*u)
    if joint=='Torso':x=-.35*recoil;z=.13*recoil
    if joint=='Head':x=-.2*recoil
    if joint.startswith('Knee'):x=.28*recoil
    if joint.startswith('Arm'):z=-side*.22*recoil
   else:
    fall=min(1,u/.8);fall=fall*fall*(3-2*fall)
    if joint=='Rig':x=-1.48*fall;z=.16*fall
    if joint.startswith('Arm'):x=-.3*fall;z=-side*.35*fall
    if joint.startswith('Knee'):x=.42*fall
    if joint=='Head':y=.2*fall
   values.extend(quat(x,y,z))
   if joint=='Rig':positions.extend([0,(-.04*min(1,u/.8) if name=='Death' else .012*math.sin(u*math.tau) if name=='Idle' else abs(s)*.025 if name in ('Walk','Run') else 0),0])
  track(n,'rotation',values,4)
  if joint=='Rig':track(n,'translation',positions,3)
 D['animations'].append(clip)
D['buffers']=[{'byteLength':len(buf),'uri':'data:application/octet-stream;base64,'+base64.b64encode(buf).decode()}]
path=pathlib.Path(__file__).resolve().parents[1]/'assets/goblin-scout.gltf';path.write_text(json.dumps(D,separators=(',',':'))+'\n');print(f'{path}: {sum(len(p)//9 for p,_,_ in batches.values())} triangles; {len(batches)} joint/material batches; {path.stat().st_size} bytes')
