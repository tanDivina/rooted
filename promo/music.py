import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
SR=44100; DUR=58; N=SR*DUR; t=np.arange(N)/SR
out=np.zeros((N,2))
def note(f): return 440*2**((f-69)/12)
def env(n,a,r):
    e=np.ones(n); a=int(a*SR); r=int(r*SR)
    e[:a]=np.linspace(0,1,a); e[-r:]*=np.linspace(1,0,r); return e
def add(sig,start,pan=0.5):
    s=int(start*SR); e=min(N,s+len(sig)); sig=sig[:e-s]
    out[s:e,0]+=sig*(1-pan); out[s:e,1]+=sig*pan
# pad: chord per 4s bar, detuned saw-ish via few harmonics, lowpassed
chords=[[57,64,69,72],[53,60,65,69],[48,55,64,67],[55,62,67,71]]  # Am F C G
sos=butter(2,1400,fs=SR,output='sos')
for bar in range(int(DUR/4)+1):
    ch=chords[bar%4]; L=5.0; n=int(L*SR); tt=np.arange(n)/SR; sig=np.zeros(n)
    for m in ch:
        for d in (-0.12,0.12):
            f=note(m+d/1)
            for h in range(1,6): sig+=np.sin(2*np.pi*f*h*tt+h)/(h**1.6)
    sig=sosfilt(sos,sig)*env(n,1.6,2.0)*0.018
    lvl=0.55 if bar*4<16 else 1.0
    if 33<=bar*4<42: lvl=0.8
    add(sig*lvl,bar*4,0.4+0.2*(bar%2))
# sub pulse heartbeat from 11s to 51s
for k in np.arange(11,51,1.0):
    n=int(.35*SR); tt=np.arange(n)/SR
    s=np.sin(2*np.pi*55*tt)*np.exp(-tt*12)*0.10
    add(s,k); 
    if k>=16: add(np.sin(2*np.pi*55*tt)*np.exp(-tt*14)*0.06,k+0.25)
# alert pings (like app chime 880->440)
def ping(at,f0=880,f1=440,v=0.12):
    n=int(.8*SR); tt=np.arange(n)/SR; f=f0*(f1/f0)**np.clip(tt/.5,0,1)
    ph=2*np.pi*np.cumsum(f)/SR; add(np.sin(ph)*np.exp(-tt*5)*v,at)
for at in (16.1,20.35,24.6,28.85): ping(at)
for at,f in ((34.0,660),(36.0,784),(38.0,988)): ping(at,f,f,0.10)
# soft riser into logo and outro
for at,L in ((6.7,1.1),(50.4,1.1)):
    n=int(L*SR); noise=np.random.randn(n); tt=np.arange(n)/SR
    sos2=butter(2,[800,6000],btype='band',fs=SR,output='sos')
    add(sosfilt(sos2,noise)*(tt/L)**2*0.05,at)
# outro chord bloom
n=int(6.5*SR); tt=np.arange(n)/SR; sig=np.zeros(n)
for m in (45,57,64,69,72,76):
    sig+=np.sin(2*np.pi*note(m)*tt)*0.5+np.sin(2*np.pi*note(m)*2*tt)*0.1
add(sig*env(n,.4,3.5)*0.03,51.5)
# global fade
out[-int(1.5*SR):]*=np.linspace(1,0,int(1.5*SR))[:,None]
out[:int(.3*SR)]*=np.linspace(0,1,int(.3*SR))[:,None]
out/=np.abs(out).max()/0.85
wavfile.write("music.wav",SR,(out*32767).astype(np.int16))
