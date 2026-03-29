import { useState, useRef, useEffect } from "react";

// ── Constants ─────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "road",        np: "सडक क्षति",    en: "Road Damage",   icon: "🛣️", color: "#c0621a", bg: "#fff3e0" },
  { id: "water",       np: "पानी आपूर्ति", en: "Water Supply",  icon: "💧", color: "#1565c0", bg: "#e3f2fd" },
  { id: "electricity", np: "बिजुली",        en: "Electricity",   icon: "⚡", color: "#f57f17", bg: "#fffde7" },
  { id: "sanitation",  np: "सरसफाई",        en: "Sanitation",    icon: "🧹", color: "#2e7d32", bg: "#e8f5e9" },
];

const STATUS_CONFIG = {
  pending:    { np: "विचाराधीन",  en: "Pending",     color: "#c62828", bg: "#ffebee", strip: "#e53935", step: 0 },
  inprogress: { np: "प्रक्रियामा", en: "In Progress", color: "#e65100", bg: "#fff3e0", strip: "#f57c00", step: 1 },
  resolved:   { np: "समाधान भयो", en: "Resolved",    color: "#1b5e20", bg: "#e8f5e9", strip: "#2e7d32", step: 2 },
};

const PRIORITY_CONFIG = {
  high:   { np: "उच्च",  en: "High",   color: "#c62828", dot: "#e53935" },
  medium: { np: "मध्यम", en: "Medium", color: "#e65100", dot: "#f57c00" },
  low:    { np: "न्यून",  en: "Low",    color: "#1b5e20", dot: "#2e7d32" },
};

const WORKERS = [
  { id: "w1", name: "Ram Prasad Sharma",   role: "Road Engineer",       avatar: "RP", dept: "Infrastructure" },
  { id: "w2", name: "Sita Kumari Thapa",   role: "Water Supply Officer", avatar: "SK", dept: "Water & Sanitation" },
  { id: "w3", name: "Hari Bahadur Karki",  role: "Electrician",          avatar: "HB", dept: "Electricity" },
  { id: "w4", name: "Gita Devi Shrestha",  role: "Sanitation Inspector", avatar: "GD", dept: "Water & Sanitation" },
  { id: "w5", name: "Bir Singh Tamang",    role: "Field Supervisor",     avatar: "BS", dept: "Infrastructure" },
];

// Seed with resolvedAt for completed issues (to compute response time)
const SEED_ISSUES = [
  { id: 1, title: "ठूलो खाल्डो सडकमा",         description: "वडा ३ को मुख्य सडकमा ठूलो खाल्डो छ, सवारी साधन गुज्रन गाह्रो छ।", category: "road",        status: "pending",    location: { name: "वडा ३, मुख्य सडक",  lat: 27.700, lng: 85.300 }, createdAt: "2025-03-20", reporter: "राम बहादुर",  votes: 12, age: 9,  assignedTo: null,  resolvedAt: null, note: "" },
  { id: 2, title: "पानी ३ दिनदेखि आएको छैन",    description: "हाम्रो टोलमा ३ दिनदेखि पानी आएको छैन। धेरै परिवार प्रभावित।",     category: "water",       status: "inprogress", location: { name: "वडा ५, पुरानो बजार", lat: 27.720, lng: 85.320 }, createdAt: "2025-03-22", reporter: "सीता देवी",   votes: 28, age: 7,  assignedTo: "w2",  resolvedAt: null, note: "Pipe replacement ordered." },
  { id: 3, title: "बिजुलीको तार झुण्डिएको",      description: "बिजुलीको तार तलसम्म झुण्डिएको छ, खतरनाक अवस्थामा छ।",            category: "electricity", status: "resolved",   location: { name: "वडा १, स्कुल नजिक", lat: 27.690, lng: 85.280 }, createdAt: "2025-03-18", reporter: "हरि प्रसाद",  votes: 35, age: 11, assignedTo: "w3",  resolvedAt: "2025-03-22", note: "Repaired same day." },
  { id: 4, title: "फोहोर व्यवस्थापन समस्या",    description: "मुख्य बजारमा फोहोर थुप्रिएको छ, दुर्गन्ध आउँछ।",                category: "sanitation",  status: "pending",    location: { name: "वडा २, बजार",       lat: 27.705, lng: 85.305 }, createdAt: "2025-03-25", reporter: "कमला थापा",  votes: 8,  age: 4,  assignedTo: null,  resolvedAt: null, note: "" },
  { id: 5, title: "पुलमा दरार देखियो",            description: "नदीमाथिको पुलमा दरार देखिएको छ, तत्काल मर्मत आवश्यक।",           category: "road",        status: "inprogress", location: { name: "वडा ७, नदी पुल",     lat: 27.715, lng: 85.320 }, createdAt: "2025-03-24", reporter: "बिर बहादुर", votes: 41, age: 5,  assignedTo: "w5",  resolvedAt: null, note: "Assessment done, repair scheduled." },
  { id: 6, title: "ढल भरिएको",                  description: "वडा ४ को ढल भरिएर सडकमा फोहोर पानी बग्दैछ।",                   category: "sanitation",  status: "resolved",   location: { name: "वडा ४, पूर्वी टोल", lat: 27.695, lng: 85.295 }, createdAt: "2025-03-22", reporter: "गीता श्रेष्ठ", votes: 19, age: 3,  assignedTo: "w4",  resolvedAt: "2025-03-27", note: "Drain cleared and disinfected." },
];

function calcPriority(issue) {
  const voteScore = Math.min(issue.votes * 2, 60);
  const ageScore  = Math.min(issue.age * 3, 30);
  const penalty   = issue.status === "resolved" ? -100 : issue.status === "inprogress" ? -20 : 0;
  return voteScore + ageScore + penalty;
}
function getPriorityLevel(score) {
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}
function daysBetween(a, b) {
  return Math.round(Math.abs(new Date(b) - new Date(a)) / 86400000);
}

// ── Global CSS ────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --P:#0d3b6e;--P2:#1565c0;--A:#d84315;
  --surface:#f0f4fa;--card:#ffffff;--border:#dce4f0;
  --text:#111827;--muted:#6b7a99;
  --shadow:0 1px 6px rgba(13,59,110,0.09);
  --shadow-md:0 4px 18px rgba(13,59,110,0.13);
}
body{font-family:'DM Sans',sans-serif;background:var(--surface);color:var(--text);min-height:100vh;}
.np{font-family:'Noto Sans Devanagari','DM Sans',sans-serif;}
button{font-family:'DM Sans',sans-serif;cursor:pointer;border:none;outline:none;}
input,textarea,select{font-family:'DM Sans',sans-serif;outline:none;}
@keyframes up{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.45;}}
.up{animation:up .3s ease both;}
::-webkit-scrollbar{width:4px;height:4px;}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:99px;}
`;

// ── Shared micro-components ──────────────────────────────────────────

function SyncDot({ state }) {
  const c = { local:{ color:"#f59e0b",label:"Saved locally",p:true }, syncing:{ color:"#3b82f6",label:"Syncing…",p:true }, synced:{ color:"#22c55e",label:"Synced",p:false } }[state] || { color:"#22c55e",label:"Synced",p:false };
  return (
    <div style={{ display:"flex",alignItems:"center",gap:6,fontSize:12,color:c.color,fontWeight:600 }}>
      <span style={{ display:"inline-block",width:8,height:8,borderRadius:"50%",background:c.color,flexShrink:0,animation:c.p?"pulse 1.4s ease infinite":"none" }} />
      {c.label}
    </div>
  );
}

function CatIcon({ cat, size=38 }) {
  const c = CATEGORIES.find(x=>x.id===cat);
  return <div style={{ width:size,height:size,borderRadius:size*0.28,background:c?.bg||"#f4f4f4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.46,flexShrink:0 }}>{c?.icon||"📌"}</div>;
}

function StatusBadge({ status, size="normal" }) {
  const s = STATUS_CONFIG[status]||STATUS_CONFIG.pending;
  return <span className="np" style={{ background:s.bg,color:s.color,border:`1px solid ${s.color}30`,borderRadius:99,padding:size==="sm"?"3px 9px":"5px 12px",fontSize:size==="sm"?11:13,fontWeight:700,whiteSpace:"nowrap" }}>{s.np}</span>;
}

function PriorityBadge({ score }) {
  const p = PRIORITY_CONFIG[getPriorityLevel(score)];
  return <span style={{ display:"flex",alignItems:"center",gap:4,fontSize:12,color:p.color,fontWeight:600 }}><span style={{ width:7,height:7,borderRadius:"50%",background:p.dot,display:"inline-block" }}/>{p.en}</span>;
}

function WorkerAvatar({ workerId, size=28 }) {
  const w = WORKERS.find(x=>x.id===workerId);
  if (!w) return null;
  return (
    <div title={w.name} style={{ width:size,height:size,borderRadius:"50%",background:"#dbeafe",color:"#1d4ed8",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.35,fontWeight:700,flexShrink:0,border:"1.5px solid #bfdbfe" }}>
      {w.avatar}
    </div>
  );
}

function StatusStepper({ status }) {
  const steps = ["Pending","In Progress","Resolved"];
  const step  = STATUS_CONFIG[status]?.step ?? 0;
  return (
    <div style={{ display:"flex",alignItems:"center",gap:0,marginTop:10 }}>
      {steps.map((s,i)=>(
        <div key={i} style={{ display:"flex",alignItems:"center",flex:i<steps.length-1?1:0 }}>
          <div style={{ display:"flex",flexDirection:"column",alignItems:"center" }}>
            <div style={{ width:20,height:20,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:i<=step?"var(--P2)":"var(--border)",color:"#fff",fontSize:10,fontWeight:700,flexShrink:0 }}>{i<step?"✓":i+1}</div>
            <div style={{ fontSize:10,color:i<=step?"var(--P2)":"var(--muted)",marginTop:3,whiteSpace:"nowrap" }}>{s}</div>
          </div>
          {i<steps.length-1&&<div style={{ flex:1,height:2,background:i<step?"var(--P2)":"var(--border)",marginBottom:14,marginLeft:4,marginRight:4,transition:"background .3s" }}/>}
        </div>
      ))}
    </div>
  );
}

// ── Map (canvas) ─────────────────────────────────────────────────────

function MapView({ issues }) {
  const canvasRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [hovered, setHovered] = useState(null);
  const BOUNDS = { minLat:27.68,maxLat:27.73,minLng:85.27,maxLng:85.34 };
  const W=480, H=260;

  function toXY(lat,lng){
    return { x:((lng-BOUNDS.minLng)/(BOUNDS.maxLng-BOUNDS.minLng))*(W-60)+30, y:H-(((lat-BOUNDS.minLat)/(BOUNDS.maxLat-BOUNDS.minLat))*(H-60)+30) };
  }
  function getClusters(iss){
    const placed=[];
    iss.forEach(issue=>{
      const pos=toXY(issue.location.lat,issue.location.lng);
      const cluster=placed.find(c=>Math.hypot(c.x-pos.x,c.y-pos.y)<28);
      if(cluster){cluster.issues.push(issue);}
      else placed.push({x:pos.x,y:pos.y,issues:[issue]});
    });
    return placed;
  }
  const clusters = getClusters(issues.filter(i=>i.status!=="resolved"));
  const resolved = issues.filter(i=>i.status==="resolved");

  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas)return;
    const ctx=canvas.getContext("2d");
    const dpr=window.devicePixelRatio||1;
    canvas.width=W*dpr; canvas.height=H*dpr;
    canvas.style.width=W+"px"; canvas.style.height=H+"px";
    ctx.scale(dpr,dpr);
    ctx.fillStyle="#e8f4f8"; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle="#c8dce6"; ctx.lineWidth=0.5;
    for(let i=0;i<5;i++){const x=30+i*(W-60)/4;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let i=0;i<4;i++){const y=30+i*(H-60)/3;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    ctx.strokeStyle="#d0c8a8"; ctx.lineWidth=3; ctx.lineCap="round";
    ctx.beginPath();ctx.moveTo(30,H/2);ctx.lineTo(W-30,H/2-20);ctx.stroke();
    ctx.beginPath();ctx.moveTo(W/2,20);ctx.lineTo(W/2-10,H-20);ctx.stroke();
    resolved.forEach(issue=>{
      const pos=toXY(issue.location.lat,issue.location.lng);
      ctx.fillStyle="#b0bec5"; ctx.beginPath();ctx.arc(pos.x,pos.y,6,0,Math.PI*2);ctx.fill();
    });
    clusters.forEach(cluster=>{
      const r=cluster.issues.length>1?18:11;
      const topIssue=cluster.issues[0];
      const sc=STATUS_CONFIG[topIssue?.status]?.strip||"#e53935";
      if(cluster.issues.length>1){ctx.strokeStyle=sc+"50";ctx.lineWidth=4;ctx.beginPath();ctx.arc(cluster.x,cluster.y,r+6,0,Math.PI*2);ctx.stroke();}
      ctx.fillStyle=hovered===cluster?sc:sc+"cc";
      ctx.beginPath();ctx.arc(cluster.x,cluster.y,r,0,Math.PI*2);ctx.fill();
      if(cluster.issues.length>1){ctx.fillStyle="#fff";ctx.font="bold 11px DM Sans,sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(cluster.issues.length,cluster.x,cluster.y);}
    });
    ctx.fillStyle="rgba(255,255,255,0.88)";
    ctx.fillRect(8,H-56,130,50);
    [["#e53935","Pending"],["#f57c00","In Progress"],["#b0bec5","Resolved"]].forEach(([color,label],i)=>{
      ctx.fillStyle=color;ctx.beginPath();ctx.arc(22,H-44+i*16,5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#374151";ctx.font="11px DM Sans,sans-serif";ctx.textAlign="left";ctx.textBaseline="middle";
      ctx.fillText(label,32,H-44+i*16);
    });
  },[issues,hovered]);

  function handleMouseMove(e){
    const rect=canvasRef.current.getBoundingClientRect();
    const mx=e.clientX-rect.left, my=e.clientY-rect.top;
    const hit=clusters.find(c=>Math.hypot(c.x-mx,c.y-my)<(c.issues.length>1?18:11));
    setHovered(hit||null);
    setTooltip(hit?{x:mx,y:my,cluster:hit}:null);
  }

  return (
    <div style={{ position:"relative",borderRadius:12,overflow:"hidden",border:"1px solid var(--border)" }}>
      <canvas ref={canvasRef} style={{ display:"block",maxWidth:"100%",cursor:hovered?"pointer":"default" }} onMouseMove={handleMouseMove} onMouseLeave={()=>{setHovered(null);setTooltip(null);}}/>
      {tooltip&&(
        <div style={{ position:"absolute",left:tooltip.x+12,top:tooltip.y-10,zIndex:10,background:"#fff",border:"1px solid var(--border)",borderRadius:9,padding:"8px 12px",boxShadow:"0 4px 16px rgba(0,0,0,0.12)",maxWidth:180,pointerEvents:"none" }}>
          {tooltip.cluster.issues.length>1
            ?<>{<div style={{ fontWeight:700,fontSize:13,marginBottom:4 }}>{tooltip.cluster.issues.length} Issues</div>}{tooltip.cluster.issues.map(i=><div key={i.id} className="np" style={{ fontSize:11,color:"var(--muted)",marginBottom:2 }}>• {i.title}</div>)}</>
            :<><div className="np" style={{ fontWeight:700,fontSize:13 }}>{tooltip.cluster.issues[0].title}</div><div style={{ fontSize:11,color:"var(--muted)",marginTop:4 }}>{tooltip.cluster.issues[0].location.name}</div></>}
        </div>
      )}
    </div>
  );
}

// ── ReportForm (unchanged from v2) ────────────────────────────────────

function ReportForm({ onSubmit, onBack }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ title:"",description:"",category:"",location:"",priority:"medium" });
  const [done, setDone] = useState(false);
  const [syncState, setSyncState] = useState("local");
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  const handleSubmit=()=>{
    const issue={...form,id:Date.now(),status:"pending",votes:0,age:0,createdAt:new Date().toISOString().split("T")[0],reporter:"नागरिक",location:{name:form.location,lat:27.70+Math.random()*0.03,lng:85.29+Math.random()*0.04},assignedTo:null,resolvedAt:null,note:""};
    onSubmit(issue); setDone(true);
    setTimeout(()=>setSyncState("syncing"),800);
    setTimeout(()=>setSyncState("synced"),2600);
  };

  if(done) return(
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:18,padding:"40px 20px",textAlign:"center" }} className="up">
      <div style={{ width:72,height:72,borderRadius:"50%",background:"#e8f5e9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36 }}>✅</div>
      <div><h2 className="np" style={{ fontSize:22,fontWeight:700,color:"var(--P)",marginBottom:6 }}>रिपोर्ट पेश भयो!</h2><p style={{ color:"var(--muted)",fontSize:14 }}>Report submitted. Status updates via SMS.</p></div>
      <SyncDot state={syncState}/>
      <div style={{ display:"flex",gap:10 }}>
        <button onClick={onBack} style={{ background:"var(--P)",color:"#fff",padding:"11px 22px",borderRadius:10,fontWeight:600,fontSize:14 }}>← गृह पृष्ठ</button>
        <button onClick={()=>{setDone(false);setStep(1);setForm({title:"",description:"",category:"",location:"",priority:"medium"});setSyncState("local");}} style={{ border:"1.5px solid var(--border)",padding:"11px 22px",borderRadius:10,fontWeight:600,fontSize:14,background:"none" }}>+ नयाँ रिपोर्ट</button>
      </div>
    </div>
  );

  return(
    <div style={{ maxWidth:500,margin:"0 auto",padding:"0 4px" }}>
      <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:22 }}>
        <button onClick={onBack} style={{ background:"none",color:"var(--muted)",fontSize:20,padding:0 }}>←</button>
        <div style={{ flex:1 }}>
          <div style={{ height:5,background:"var(--border)",borderRadius:99,overflow:"hidden" }}><div style={{ height:"100%",width:`${(step/3)*100}%`,background:"var(--P2)",borderRadius:99,transition:"width .4s ease" }}/></div>
          <div style={{ fontSize:12,color:"var(--muted)",marginTop:5 }}>{step===1?"समस्याको प्रकार":step===2?"विवरण":"स्थान र पेश"} — Step {step}/3</div>
        </div>
      </div>
      {step===1&&(
        <div className="up">
          <h3 className="np" style={{ fontSize:18,fontWeight:700,marginBottom:6 }}>समस्याको प्रकार छान्नुहोस्</h3>
          <p style={{ color:"var(--muted)",fontSize:13,marginBottom:18 }}>Select the type of problem / समस्या छान्नुहोस्</p>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
            {CATEGORIES.map(cat=>(
              <button key={cat.id} onClick={()=>{set("category",cat.id);setStep(2);}} style={{ background:form.category===cat.id?cat.bg:"var(--card)",border:`2px solid ${form.category===cat.id?cat.color:"var(--border)"}`,borderRadius:14,padding:"22px 16px",display:"flex",flexDirection:"column",alignItems:"center",gap:10,transition:"all .2s",boxShadow:"var(--shadow)" }}>
                <span style={{ fontSize:38 }}>{cat.icon}</span>
                <div style={{ textAlign:"center" }}><div className="np" style={{ fontWeight:700,fontSize:15,color:form.category===cat.id?cat.color:"var(--text)" }}>{cat.np}</div><div style={{ fontSize:11,color:"var(--muted)",marginTop:2 }}>{cat.en}</div></div>
              </button>
            ))}
          </div>
        </div>
      )}
      {step===2&&(
        <div className="up" style={{ display:"flex",flexDirection:"column",gap:16 }}>
          <div><h3 className="np" style={{ fontSize:18,fontWeight:700,marginBottom:4 }}>विवरण दिनुहोस्</h3><p style={{ color:"var(--muted)",fontSize:13 }}>Describe the problem</p></div>
          {[["title","शीर्षक / Title","उदाहरण: ठूलो खाल्डो..."],["description","विवरण / Description","विस्तृत विवरण..."]].map(([k,label,ph])=>(
            <div key={k}><label style={{ display:"block",fontSize:12,fontWeight:600,color:"var(--P)",marginBottom:6 }}>{label} *</label>
              {k==="description"?<textarea value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={ph} rows={4} style={{ width:"100%",padding:"12px 14px",borderRadius:10,border:"1.5px solid var(--border)",fontSize:14,resize:"vertical" }}/>
              :<input value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={ph} style={{ width:"100%",padding:"12px 14px",borderRadius:10,border:"1.5px solid var(--border)",fontSize:14 }}/>}
            </div>
          ))}
          <div style={{ display:"flex",gap:10 }}><button onClick={()=>setStep(1)} style={{ flex:1,padding:"12px",border:"1.5px solid var(--border)",borderRadius:10,fontWeight:600,background:"none" }}>← पछाडि</button><button onClick={()=>form.title&&form.description&&setStep(3)} style={{ flex:2,padding:"12px",borderRadius:10,fontWeight:700,fontSize:15,background:form.title&&form.description?"var(--P)":"var(--border)",color:"#fff" }}>अगाडि →</button></div>
        </div>
      )}
      {step===3&&(
        <div className="up" style={{ display:"flex",flexDirection:"column",gap:16 }}>
          <div><h3 className="np" style={{ fontSize:18,fontWeight:700,marginBottom:4 }}>स्थान र पेश</h3><p style={{ color:"var(--muted)",fontSize:13 }}>Location & Submit</p></div>
          <div><label style={{ display:"block",fontSize:12,fontWeight:600,color:"var(--P)",marginBottom:6 }}>📍 स्थान / Location *</label>
            <div style={{ display:"flex",gap:8 }}><input value={form.location} onChange={e=>set("location",e.target.value)} placeholder="वडा नं. र ठाउँको नाम..." style={{ flex:1,padding:"12px 14px",borderRadius:10,border:"1.5px solid var(--border)",fontSize:14 }}/><button onClick={()=>set("location","वडा ३ (GPS)")} style={{ padding:"12px 14px",background:"var(--P2)",color:"#fff",borderRadius:10,fontWeight:600,fontSize:13 }}>📡 GPS</button></div>
          </div>
          <div style={{ border:"1.5px dashed var(--border)",borderRadius:12,padding:20,textAlign:"center",cursor:"pointer",background:"#fafbff" }}>
            <div style={{ fontSize:28,marginBottom:6 }}>📷</div><div className="np" style={{ fontWeight:600,fontSize:14 }}>फोटो थप्नुहोस्</div>
            <div style={{ fontSize:12,color:"var(--muted)",marginTop:3 }}>Add Photo — compressed automatically</div>
          </div>
          <div style={{ padding:"6px 0" }}><SyncDot state="local"/></div>
          <div style={{ display:"flex",gap:10 }}><button onClick={()=>setStep(2)} style={{ flex:1,padding:"12px",border:"1.5px solid var(--border)",borderRadius:10,fontWeight:600,background:"none" }}>← पछाडि</button><button onClick={handleSubmit} disabled={!form.location} style={{ flex:2,padding:"12px",borderRadius:10,fontWeight:700,fontSize:15,background:form.location?"var(--A)":"var(--border)",color:"#fff",transition:"all .2s" }}>🚀 पेश गर्नुहोस्</button></div>
        </div>
      )}
    </div>
  );
}

// ── CitizenHome ───────────────────────────────────────────────────────

function CitizenHome({ issues, onReport, onTrack, onMap }) {
  const sorted  = [...issues].sort((a,b)=>calcPriority(b)-calcPriority(a));
  const trending = sorted.filter(i=>i.status!=="resolved").slice(0,3);
  return(
    <div style={{ display:"flex",flexDirection:"column",gap:18 }}>
      <div style={{ background:"linear-gradient(135deg,var(--P) 0%,var(--P2) 100%)",borderRadius:18,padding:"26px 22px",color:"#fff",position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",right:-24,top:-24,fontSize:110,opacity:.08 }}>🏔️</div>
        <div style={{ fontSize:11,fontWeight:600,letterSpacing:2,opacity:.6,textTransform:"uppercase",marginBottom:6 }}>स्मार्ट गाउँ · Smart Village Nepal</div>
        <h1 className="np" style={{ fontSize:24,fontWeight:700,marginBottom:4,lineHeight:1.3 }}>समस्या रिपोर्ट गर्नुहोस्</h1>
        <p style={{ fontSize:13,opacity:.75,marginBottom:20 }}>Report issues in your village. We'll fix them fast.</p>
        <button onClick={onReport} style={{ background:"#fff",color:"var(--P)",padding:"13px 24px",borderRadius:12,fontWeight:700,fontSize:15,display:"inline-flex",flexDirection:"column",alignItems:"flex-start",boxShadow:"0 4px 16px rgba(0,0,0,0.15)" }}>
          <span>+ नयाँ रिपोर्ट / New Report</span>
          <span style={{ fontSize:11,fontWeight:400,color:"var(--muted)",marginTop:1 }}>📸 Upload photo & location</span>
        </button>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10 }}>
        {[{np:"कुल रिपोर्ट",en:"Total",val:issues.length,color:"var(--P2)"},{np:"प्रक्रियामा",en:"Active",val:issues.filter(i=>i.status==="inprogress").length,color:"#e65100"},{np:"समाधान",en:"Resolved",val:issues.filter(i=>i.status==="resolved").length,color:"#2e7d32"}].map((s,i)=>(
          <div key={i} style={{ background:"var(--card)",borderRadius:12,padding:"14px 10px",textAlign:"center",boxShadow:"var(--shadow)" }}>
            <div style={{ fontSize:22,fontWeight:700,color:s.color }}>{s.val}</div>
            <div className="np" style={{ fontSize:12,color:"var(--muted)" }}>{s.np}</div>
          </div>
        ))}
      </div>
      <div>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
          <h3 style={{ fontWeight:700,fontSize:15 }}>🗺 समस्याको नक्सा</h3>
          <button onClick={onMap} style={{ background:"none",color:"var(--P2)",fontSize:12,fontWeight:600 }}>Full Map →</button>
        </div>
        <MapView issues={issues}/>
      </div>
      <div>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
          <h3 style={{ fontWeight:700,fontSize:15 }}>🔥 सर्वाधिक समर्थित / Trending</h3>
          <button onClick={onTrack} style={{ background:"none",color:"var(--P2)",fontSize:12,fontWeight:600 }}>सबै →</button>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          {trending.map((issue,idx)=>{
            const score=calcPriority(issue);
            return(
              <div key={issue.id} style={{ background:"var(--card)",borderRadius:13,padding:"14px 14px 14px 18px",display:"flex",gap:12,position:"relative",boxShadow:"var(--shadow)" }}>
                <div style={{ position:"absolute",left:0,top:0,bottom:0,width:4,borderRadius:"13px 0 0 13px",background:STATUS_CONFIG[issue.status]?.strip||"#e53935" }}/>
                <div style={{ position:"absolute",left:8,top:8,fontSize:11,fontWeight:700,color:"var(--muted)" }}>#{idx+1}</div>
                <CatIcon cat={issue.category} size={40}/>
                <div style={{ flex:1,minWidth:0 }}>
                  <div className="np" style={{ fontWeight:700,fontSize:14,marginBottom:4 }}>{issue.title}</div>
                  <div style={{ display:"flex",gap:8,flexWrap:"wrap",alignItems:"center" }}><StatusBadge status={issue.status} size="sm"/><PriorityBadge score={score}/></div>
                  <div style={{ fontSize:12,color:"var(--muted)",marginTop:4 }}>👍 {issue.votes} supports · 📍 {issue.location?.name}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── TrackIssues ───────────────────────────────────────────────────────

function TrackIssues({ issues, onBack, onVote, votedIds }) {
  const [filterStatus,setFilterStatus]=useState("all");
  const [sort,setSort]=useState("votes");
  const filtered=[...issues].filter(i=>filterStatus==="all"||i.status===filterStatus).sort((a,b)=>sort==="votes"?b.votes-a.votes:calcPriority(b)-calcPriority(a));
  return(
    <div>
      <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:18 }}><button onClick={onBack} style={{ background:"none",color:"var(--muted)",fontSize:20 }}>←</button><h2 style={{ fontWeight:700,fontSize:18 }}>सबै रिपोर्टहरू / All Issues</h2></div>
      <div style={{ display:"flex",gap:6,marginBottom:12,overflowX:"auto",paddingBottom:2 }}>
        {[["all","सबै / All"],["pending","विचाराधीन"],["inprogress","प्रक्रियामा"],["resolved","समाधान"]].map(([k,l])=>(
          <button key={k} onClick={()=>setFilterStatus(k)} className="np" style={{ padding:"6px 14px",borderRadius:99,fontWeight:600,fontSize:12,whiteSpace:"nowrap",flexShrink:0,background:filterStatus===k?"var(--P)":"var(--card)",color:filterStatus===k?"#fff":"var(--muted)",border:`1.5px solid ${filterStatus===k?"var(--P)":"var(--border)"}` }}>{l}</button>
        ))}
      </div>
      <select value={sort} onChange={e=>setSort(e.target.value)} style={{ padding:"9px 12px",borderRadius:8,border:"1.5px solid var(--border)",fontSize:13,background:"var(--card)",width:"100%",marginBottom:14 }}>
        <option value="votes">👍 Most Supported</option><option value="priority">🧠 Smart Priority</option>
      </select>
      <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
        {filtered.map(issue=>{
          const score=calcPriority(issue);
          const isVoted=votedIds.includes(issue.id);
          return(
            <div key={issue.id} className="up" style={{ background:"var(--card)",borderRadius:13,padding:"14px 14px 14px 18px",boxShadow:"var(--shadow)",position:"relative" }}>
              <div style={{ position:"absolute",left:0,top:0,bottom:0,width:4,borderRadius:"13px 0 0 13px",background:STATUS_CONFIG[issue.status]?.strip||"#e53935" }}/>
              <div style={{ display:"flex",gap:12,marginBottom:10 }}>
                <CatIcon cat={issue.category} size={42}/>
                <div style={{ flex:1 }}>
                  <div className="np" style={{ fontWeight:700,fontSize:14,marginBottom:5 }}>{issue.title}</div>
                  <div style={{ display:"flex",gap:6,flexWrap:"wrap",alignItems:"center" }}><StatusBadge status={issue.status} size="sm"/><PriorityBadge score={score}/></div>
                </div>
                <button onClick={()=>onVote(issue.id)} style={{ display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:8,background:isVoted?"#e3f2fd":"var(--surface)",border:`1.5px solid ${isVoted?"#1565c0":"var(--border)"}`,color:isVoted?"#1565c0":"var(--muted)",fontWeight:600,fontSize:13 }}>👍 {issue.votes}</button>
              </div>
              <p className="np" style={{ fontSize:13,color:"var(--muted)",marginBottom:10,lineHeight:1.55 }}>{issue.description}</p>
              <div style={{ fontSize:12,color:"var(--muted)",marginBottom:8,display:"flex",gap:12 }}><span>📍 {issue.location?.name}</span><span>📅 {issue.createdAt}</span></div>
              <StatusStepper status={issue.status}/>
            </div>
          );
        })}
        {filtered.length===0&&<div style={{ textAlign:"center",padding:48,color:"var(--muted)" }}>No issues found.</div>}
      </div>
    </div>
  );
}

// ── MapPage ───────────────────────────────────────────────────────────

function MapPage({ issues, onBack }) {
  const [filter,setFilter]=useState("all");
  return(
    <div>
      <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:16 }}><button onClick={onBack} style={{ background:"none",color:"var(--muted)",fontSize:20 }}>←</button><h2 style={{ fontWeight:700,fontSize:18 }}>🗺 Issue Map</h2></div>
      <div style={{ display:"flex",gap:6,marginBottom:14,flexWrap:"wrap" }}>
        {[["all","All"],["pending","Pending"],["inprogress","In Progress"],["resolved","Resolved"]].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)} style={{ padding:"6px 14px",borderRadius:99,fontWeight:600,fontSize:12,background:filter===k?"var(--P)":"var(--card)",color:filter===k?"#fff":"var(--muted)",border:`1.5px solid ${filter===k?"var(--P)":"var(--border)"}` }}>{l}</button>
        ))}
      </div>
      <MapView issues={filter==="all"?issues:issues.filter(i=>i.status===filter)}/>
    </div>
  );
}

// ── ADMIN DASHBOARD (fully rebuilt) ──────────────────────────────────

function AdminDashboard({ issues, onUpdateIssue, onBack }) {
  const [search,     setSearch]     = useState("");
  const [filterCat,  setFilterCat]  = useState("all");
  const [filterStatus,setFilterStatus]=useState("all");
  const [sort,       setSort]       = useState("priority");
  const [expanded,   setExpanded]   = useState(null);   // issue id
  const [tab,        setTab]        = useState("issues"); // issues | analytics

  // ── KPI calculations ────────────────────────────────────────────────
  const resolved      = issues.filter(i=>i.status==="resolved"&&i.resolvedAt&&i.createdAt);
  const avgResolution = resolved.length
    ? Math.round(resolved.reduce((acc,i)=>acc+daysBetween(i.createdAt,i.resolvedAt),0)/resolved.length)
    : null;
  const assignedCount = issues.filter(i=>i.assignedTo).length;
  const pendingHigh   = issues.filter(i=>i.status==="pending"&&calcPriority(i)>=60).length;

  // Per-worker stats
  const workerStats = WORKERS.map(w=>{
    const assigned = issues.filter(i=>i.assignedTo===w.id);
    const done     = assigned.filter(i=>i.status==="resolved"&&i.resolvedAt);
    const avgDays  = done.length ? Math.round(done.reduce((a,i)=>a+daysBetween(i.createdAt,i.resolvedAt),0)/done.length) : null;
    return { ...w, total:assigned.length, resolved:done.length, avgDays };
  }).filter(w=>w.total>0);

  // Per-category resolution rate
  const catStats = CATEGORIES.map(c=>{
    const all  = issues.filter(i=>i.category===c.id);
    const done = all.filter(i=>i.status==="resolved");
    return { ...c, total:all.length, resolved:done.length, rate:all.length?Math.round(done.length/all.length*100):0 };
  });

  // Filtered issue list
  const filtered = issues
    .filter(i=>(filterCat==="all"||i.category===filterCat)&&(filterStatus==="all"||i.status===filterStatus)&&(i.title.toLowerCase().includes(search.toLowerCase())||i.description.toLowerCase().includes(search.toLowerCase())))
    .sort((a,b)=>sort==="priority"?calcPriority(b)-calcPriority(a):b.votes-a.votes);

  function handleAction(id, action) {
    const now = new Date().toISOString().split("T")[0];
    if(action==="inprogress") onUpdateIssue(id,{ status:"inprogress" });
    if(action==="resolve")    onUpdateIssue(id,{ status:"resolved", resolvedAt:now });
    if(action==="reopen")     onUpdateIssue(id,{ status:"pending", resolvedAt:null });
  }
  function handleAssign(id, workerId) {
    onUpdateIssue(id,{ assignedTo:workerId||null });
  }
  function handleNote(id, note) {
    onUpdateIssue(id,{ note });
  }

  return(
    <div>
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#0d2137 0%,var(--P) 100%)",borderRadius:14,padding:"18px 20px",color:"#fff",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div>
          <div style={{ fontSize:10,opacity:.55,letterSpacing:2,textTransform:"uppercase" }}>Admin Portal</div>
          <div style={{ fontSize:18,fontWeight:700 }}>🏛 Control Center</div>
        </div>
        <button onClick={onBack} style={{ background:"rgba(255,255,255,0.12)",color:"#fff",padding:"7px 14px",borderRadius:8,fontSize:12,fontWeight:600 }}>← Citizen View</button>
      </div>

      {/* Top KPI row */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14 }}>
        {[
          { label:"Total",     val:issues.length,                                         color:"var(--P)",   sub:null },
          { label:"Pending",   val:issues.filter(i=>i.status==="pending").length,          color:"#c62828",    sub:pendingHigh>0?`${pendingHigh} high priority`:null },
          { label:"Active",    val:issues.filter(i=>i.status==="inprogress").length,       color:"#e65100",    sub:`${assignedCount} assigned` },
          { label:"Avg. Fix",  val:avgResolution!=null?`${avgResolution}d`:"—",            color:"#1b5e20",    sub:"response time" },
        ].map((s,i)=>(
          <div key={i} style={{ background:"var(--card)",borderRadius:10,padding:"12px 8px",textAlign:"center",boxShadow:"var(--shadow)",position:"relative" }}>
            {i===3&&<div style={{ position:"absolute",top:6,right:6,fontSize:14 }}>⏱</div>}
            <div style={{ fontSize:i===3?18:22,fontWeight:700,color:s.color }}>{s.val}</div>
            <div style={{ fontSize:10,color:"var(--muted)",fontWeight:600 }}>{s.label}</div>
            {s.sub&&<div style={{ fontSize:10,color:"var(--muted)",marginTop:2 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex",gap:0,marginBottom:16,background:"var(--card)",borderRadius:10,padding:4,boxShadow:"var(--shadow)" }}>
        {[["issues","📋 Issues"],["analytics","📊 Analytics"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{ flex:1,padding:"9px 0",borderRadius:7,fontWeight:600,fontSize:13,background:tab===k?"var(--P)":"none",color:tab===k?"#fff":"var(--muted)",transition:"all .2s" }}>{l}</button>
        ))}
      </div>

      {/* ── ANALYTICS TAB ── */}
      {tab==="analytics"&&(
        <div className="up" style={{ display:"flex",flexDirection:"column",gap:14 }}>
          {/* Response time card */}
          <div style={{ background:"var(--card)",borderRadius:13,padding:16,boxShadow:"var(--shadow)" }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:14,display:"flex",alignItems:"center",gap:8 }}>⏱ Response Time KPIs <span style={{ fontSize:11,color:"var(--muted)",fontWeight:400 }}>— governance metrics</span></div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16 }}>
              {[
                { label:"Avg Resolution",       val:avgResolution!=null?`${avgResolution} days`:"No data", color:"#1b5e20" },
                { label:"Resolution Rate",       val:`${resolved.length}/${issues.length}`,                color:"var(--P2)" },
                { label:"Unassigned Pending",    val:issues.filter(i=>i.status==="pending"&&!i.assignedTo).length, color:"#c62828" },
              ].map((s,i)=>(
                <div key={i} style={{ background:"var(--surface)",borderRadius:9,padding:"12px 10px",textAlign:"center" }}>
                  <div style={{ fontSize:17,fontWeight:700,color:s.color }}>{s.val}</div>
                  <div style={{ fontSize:10,color:"var(--muted)",marginTop:3 }}>{s.label}</div>
                </div>
              ))}
            </div>
            {/* Resolution time per category */}
            <div style={{ fontWeight:600,fontSize:13,marginBottom:10 }}>Resolution Rate by Category</div>
            {catStats.map(c=>(
              <div key={c.id} style={{ display:"flex",alignItems:"center",gap:10,marginBottom:9 }}>
                <span style={{ fontSize:15,width:20 }}>{c.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",marginBottom:3 }}>
                    <span style={{ fontSize:12,fontWeight:600 }}>{c.en}</span>
                    <span style={{ fontSize:11,color:"var(--muted)" }}>{c.resolved}/{c.total} resolved ({c.rate}%)</span>
                  </div>
                  <div style={{ height:6,background:"#eef0f6",borderRadius:99 }}>
                    <div style={{ width:`${c.rate}%`,height:"100%",background:c.color,borderRadius:99,transition:"width 1s ease" }}/>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Worker performance */}
          <div style={{ background:"var(--card)",borderRadius:13,padding:16,boxShadow:"var(--shadow)" }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:14 }}>👷 Worker Performance</div>
            {workerStats.length===0&&<div style={{ color:"var(--muted)",fontSize:13 }}>No assignments yet.</div>}
            {workerStats.map(w=>(
              <div key={w.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid var(--border)" }}>
                <div style={{ width:36,height:36,borderRadius:"50%",background:"#dbeafe",color:"#1d4ed8",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,flexShrink:0 }}>{w.avatar}</div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontWeight:600,fontSize:13 }}>{w.name}</div>
                  <div style={{ fontSize:11,color:"var(--muted)" }}>{w.role}</div>
                </div>
                <div style={{ textAlign:"right",flexShrink:0 }}>
                  <div style={{ fontSize:13,fontWeight:700,color:"var(--P)" }}>{w.resolved}/{w.total}</div>
                  <div style={{ fontSize:10,color:"var(--muted)" }}>{w.avgDays!=null?`avg ${w.avgDays}d`:"active"}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Smart priority formula */}
          <div style={{ background:"#e8f5e9",border:"1px solid #a5d6a7",borderRadius:10,padding:"11px 14px",fontSize:12,color:"#1b5e20" }}>
            🧠 <b>Smart Priority Score</b> = Votes × 2 + Age × 3 &nbsp;|&nbsp; Auto-surfaces most urgent unresolved issues
          </div>
        </div>
      )}

      {/* ── ISSUES TAB ── */}
      {tab==="issues"&&(
        <div className="up">
          {/* Filters */}
          <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:12 }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search issues..."
              style={{ padding:"10px 14px",borderRadius:10,border:"1.5px solid var(--border)",fontSize:14 }}/>
            <div style={{ display:"flex",gap:8 }}>
              <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{ flex:1,padding:"8px 10px",borderRadius:8,border:"1.5px solid var(--border)",fontSize:12,background:"var(--card)" }}>
                <option value="all">All Categories</option>
                {CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.en}</option>)}
              </select>
              <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{ flex:1,padding:"8px 10px",borderRadius:8,border:"1.5px solid var(--border)",fontSize:12,background:"var(--card)" }}>
                <option value="all">All Status</option>
                {Object.entries(STATUS_CONFIG).map(([k,v])=><option key={k} value={k}>{v.en}</option>)}
              </select>
              <select value={sort} onChange={e=>setSort(e.target.value)} style={{ flex:1,padding:"8px 10px",borderRadius:8,border:"1.5px solid var(--border)",fontSize:12,background:"var(--card)" }}>
                <option value="priority">🧠 Smart Priority</option>
                <option value="votes">👍 Most Votes</option>
              </select>
            </div>
          </div>

          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {filtered.map(issue=>{
              const score    = calcPriority(issue);
              const isOpen   = expanded===issue.id;
              const worker   = WORKERS.find(w=>w.id===issue.assignedTo);
              const isPending    = issue.status==="pending";
              const isProgress   = issue.status==="inprogress";
              const isResolved   = issue.status==="resolved";

              return(
                <div key={issue.id} style={{ background:"var(--card)",borderRadius:13,overflow:"hidden",boxShadow:"var(--shadow)",border:`2px solid ${isOpen?"var(--P2)":"transparent"}`,transition:"border-color .2s" }}>
                  {/* Left strip */}
                  <div style={{ display:"flex",gap:0 }}>
                    <div style={{ width:4,background:STATUS_CONFIG[issue.status]?.strip||"#e53935",flexShrink:0 }}/>
                    <div style={{ flex:1,padding:"12px 14px" }}>

                      {/* Top row */}
                      <div style={{ display:"flex",gap:10,alignItems:"flex-start",cursor:"pointer" }} onClick={()=>setExpanded(isOpen?null:issue.id)}>
                        <CatIcon cat={issue.category} size={40}/>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ display:"flex",justifyContent:"space-between",gap:6,marginBottom:4 }}>
                            <div className="np" style={{ fontWeight:700,fontSize:14,lineHeight:1.3 }}>{issue.title}</div>
                            <StatusBadge status={issue.status} size="sm"/>
                          </div>
                          <div style={{ display:"flex",gap:8,fontSize:12,color:"var(--muted)",flexWrap:"wrap",alignItems:"center" }}>
                            <PriorityBadge score={score}/>
                            <span>👍 {issue.votes}</span>
                            <span style={{ color:"var(--P)",fontWeight:600 }}>Score: {score}</span>
                            {worker&&<WorkerAvatar workerId={issue.assignedTo} size={22}/>}
                          </div>
                          <div style={{ fontSize:11,color:"var(--muted)",marginTop:3 }}>
                            {issue.reporter} · {issue.location?.name} · {issue.createdAt}
                            {isResolved&&issue.resolvedAt&&<span style={{ color:"#2e7d32",marginLeft:6 }}>✓ resolved {issue.resolvedAt}</span>}
                          </div>
                        </div>
                        <div style={{ fontSize:16,color:"var(--muted)",flexShrink:0,paddingTop:2 }}>{isOpen?"▲":"▼"}</div>
                      </div>

                      {/* ── Quick Action Buttons (always visible for non-resolved) ── */}
                      {!isResolved&&(
                        <div style={{ display:"flex",gap:8,marginTop:12,flexWrap:"wrap" }}>
                          {isPending&&(
                            <button onClick={()=>handleAction(issue.id,"inprogress")} style={{
                              display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:9,
                              background:"#fff3e0",color:"#e65100",border:"1.5px solid #f57c00",
                              fontWeight:700,fontSize:13,transition:"all .15s"
                            }}>
                              🔧 Mark In Progress
                            </button>
                          )}
                          {(isPending||isProgress)&&(
                            <button onClick={()=>handleAction(issue.id,"resolve")} style={{
                              display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:9,
                              background:"#e8f5e9",color:"#1b5e20",border:"1.5px solid #2e7d32",
                              fontWeight:700,fontSize:13,transition:"all .15s"
                            }}>
                              ✅ Mark Resolved
                            </button>
                          )}
                        </div>
                      )}
                      {isResolved&&(
                        <div style={{ marginTop:10 }}>
                          <button onClick={()=>handleAction(issue.id,"reopen")} style={{ display:"flex",alignItems:"center",gap:6,padding:"7px 12px",borderRadius:8,background:"var(--surface)",color:"var(--muted)",border:"1.5px solid var(--border)",fontWeight:600,fontSize:12 }}>
                            ↩ Reopen
                          </button>
                        </div>
                      )}

                      {/* ── Expanded Panel ── */}
                      {isOpen&&(
                        <div className="up" style={{ marginTop:14,paddingTop:14,borderTop:"1px solid var(--border)" }} onClick={e=>e.stopPropagation()}>
                          <p className="np" style={{ fontSize:13,color:"var(--muted)",marginBottom:14,lineHeight:1.6 }}>{issue.description}</p>

                          {/* Assign worker */}
                          <div style={{ marginBottom:14 }}>
                            <div style={{ fontWeight:600,fontSize:12,marginBottom:8,color:"var(--P)" }}>👷 Assign to Worker / Team</div>
                            <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                              {WORKERS.map(w=>{
                                const isAssigned=issue.assignedTo===w.id;
                                return(
                                  <button key={w.id} onClick={()=>handleAssign(issue.id,isAssigned?null:w.id)} style={{
                                    display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:9,
                                    background:isAssigned?"#dbeafe":"var(--surface)",
                                    border:`1.5px solid ${isAssigned?"#93c5fd":"var(--border)"}`,
                                    color:"var(--text)",textAlign:"left",transition:"all .15s"
                                  }}>
                                    <div style={{ width:30,height:30,borderRadius:"50%",background:isAssigned?"#bfdbfe":"var(--border)",color:isAssigned?"#1d4ed8":"var(--muted)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0 }}>{w.avatar}</div>
                                    <div style={{ flex:1,minWidth:0 }}>
                                      <div style={{ fontWeight:600,fontSize:13 }}>{w.name}</div>
                                      <div style={{ fontSize:11,color:"var(--muted)" }}>{w.role} · {w.dept}</div>
                                    </div>
                                    {isAssigned&&<span style={{ fontSize:12,color:"#1d4ed8",fontWeight:700,flexShrink:0 }}>✓ Assigned</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Admin note */}
                          <div style={{ marginBottom:14 }}>
                            <div style={{ fontWeight:600,fontSize:12,marginBottom:6,color:"var(--P)" }}>📝 Admin Note</div>
                            <textarea value={issue.note||""} onChange={e=>handleNote(issue.id,e.target.value)} placeholder="Add internal note (visible to admin only)..." rows={2}
                              style={{ width:"100%",padding:"10px 12px",borderRadius:9,border:"1.5px solid var(--border)",fontSize:13,resize:"vertical" }}/>
                          </div>

                          {/* Status stepper */}
                          <StatusStepper status={issue.status}/>

                          {/* Response time for resolved */}
                          {isResolved&&issue.resolvedAt&&(
                            <div style={{ marginTop:12,background:"#e8f5e9",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#1b5e20",display:"flex",gap:6 }}>
                              ⏱ Resolved in <b>{daysBetween(issue.createdAt,issue.resolvedAt)} day(s)</b>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length===0&&<div style={{ textAlign:"center",padding:48,color:"var(--muted)" }}>No matching issues.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────

export default function App() {
  const [issues,    setIssues]    = useState(SEED_ISSUES);
  const [screen,    setScreen]    = useState("home");
  const [role,      setRole]      = useState("citizen");
  const [votedIds,  setVotedIds]  = useState([]);
  const [syncState, setSyncState] = useState("synced");

  const handleSubmit = (issue) => {
    setSyncState("local");
    setIssues(prev=>[issue,...prev]);
    setTimeout(()=>setSyncState("syncing"),600);
    setTimeout(()=>setSyncState("synced"),2200);
  };

  // Partial update — merges only provided keys
  const handleUpdateIssue = (id, patch) => {
    setIssues(prev=>prev.map(i=>i.id===id?{...i,...patch}:i));
  };

  const handleVote = (id) => {
    if(votedIds.includes(id))return;
    setVotedIds(v=>[...v,id]);
    setIssues(prev=>prev.map(i=>i.id===id?{...i,votes:i.votes+1}:i));
  };

  const isAdmin = role==="admin";

  return(
    <>
      <style>{CSS}</style>
      <div style={{ minHeight:"100vh",background:"var(--surface)",paddingBottom:80 }}>
        {/* App Bar */}
        <div style={{ position:"sticky",top:0,zIndex:100,background:"rgba(240,244,250,0.92)",backdropFilter:"blur(12px)",borderBottom:"1px solid var(--border)",padding:"10px 18px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div style={{ display:"flex",alignItems:"center",gap:9 }}>
            <span style={{ fontSize:22 }}>🏔️</span>
            <div>
              <div style={{ fontWeight:800,fontSize:14,color:"var(--P)",lineHeight:1 }}>Smart Village</div>
              <div className="np" style={{ fontSize:10,color:"var(--muted)" }}>स्मार्ट गाउँ</div>
            </div>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <SyncDot state={syncState}/>
            <button onClick={()=>{setRole(r=>r==="citizen"?"admin":"citizen");setScreen("home");}} style={{ background:isAdmin?"var(--P)":"var(--surface)",color:isAdmin?"#fff":"var(--P)",border:"1.5px solid var(--P)",padding:"6px 12px",borderRadius:8,fontWeight:600,fontSize:11 }}>
              {isAdmin?"🏛 Admin":"👤 Citizen"}
            </button>
          </div>
        </div>

        <div style={{ maxWidth:560,margin:"0 auto",padding:"18px 14px" }}>
          {isAdmin
            ? <AdminDashboard issues={issues} onUpdateIssue={handleUpdateIssue} onBack={()=>setRole("citizen")}/>
            : screen==="home"   ? <CitizenHome issues={issues} onReport={()=>setScreen("report")} onTrack={()=>setScreen("track")} onMap={()=>setScreen("map")}/>
            : screen==="report" ? <ReportForm onSubmit={handleSubmit} onBack={()=>setScreen("home")}/>
            : screen==="map"    ? <MapPage issues={issues} onBack={()=>setScreen("home")}/>
            : <TrackIssues issues={issues} onBack={()=>setScreen("home")} onVote={handleVote} votedIds={votedIds}/>
          }
        </div>

        {/* Bottom Nav (citizen only) */}
        {!isAdmin&&(
          <div style={{ position:"fixed",bottom:0,left:0,right:0,background:"var(--card)",borderTop:"1px solid var(--border)",display:"flex",padding:"8px 0 14px",boxShadow:"0 -4px 20px rgba(13,59,110,0.07)" }}>
            {[{id:"home",np:"गृह",icon:"🏠"},{id:"report",np:"रिपोर्ट",icon:"📝"},{id:"map",np:"नक्सा",icon:"🗺"},{id:"track",np:"ट्र्याक",icon:"📊"}].map(nav=>(
              <button key={nav.id} onClick={()=>setScreen(nav.id)} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",padding:"4px 0" }}>
                <span style={{ fontSize:20 }}>{nav.icon}</span>
                <span className="np" style={{ fontSize:10,fontWeight:600,color:screen===nav.id?"var(--P)":"var(--muted)" }}>{nav.np}</span>
                {screen===nav.id&&<div style={{ width:18,height:3,borderRadius:99,background:"var(--P)" }}/>}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
