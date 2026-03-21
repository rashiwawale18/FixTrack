import { useState } from 'react'
import { adminLogin, adminLogout } from './appwrite.js'

const STATUSES   = ['Pending Review','Accepted','Assigned','In Progress','Resolved','Rejected']
const CATEGORIES = ['All','Electrical','Plumbing','Mechanical','Electronics','Cleaning']
const PRIORITIES = ['All','Low','Medium','High']

const LC = { bg:'#0a101c', card:'#121a2b', inp:'#1a263d', border:'#2a3a56', dark:'#e6ecff', muted:'#9aaaca', btn:'#3f63b8' }
const DC = { bg:'#0a101c', surf:'#121a2b', surf2:'#1a263d', border:'#2a3a56', text:'#e6ecff', muted:'#9aaaca' }

function SBadge({ status }) {
  const m = { 'Pending Review':'badge-pending','Accepted':'badge-accepted','Assigned':'badge-assigned','In Progress':'badge-inprogress','Resolved':'badge-resolved','Rejected':'badge-rejected' }
  const live = status === 'Pending Review' || status === 'In Progress'
  return <span className={`badge ${m[status]||'badge-pending'} ${live ? 'badge-live' : ''}`}>{status}</span>
}
function PBadge({ priority }) {
  return <span className={`badge priority-${priority?.toLowerCase()}`}>{priority}</span>
}

export default function AdminPanel({ issues, assistants, updateIssue, deleteIssue, approveAssistant, removeAssistant }) {
  const [loggedIn, setLoggedIn] = useState(false)
  const [email, setEmail]       = useState('')
  const [pass, setPass]         = useState('')
  const [showP, setShowP]       = useState(false)
  const [err, setErr]           = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [tab, setTab]           = useState('issues')
  const [fCat, setFCat]         = useState('All')
  const [fPri, setFPri]         = useState('All')
  const [fStat, setFStat]       = useState('All')
  const [fAst, setFAst]         = useState('All')
  const [assignModal, setAssignModal] = useState(null)
  const [assignName, setAssignName]   = useState('')
  const [viewModal, setViewModal]     = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const approved     = assistants.filter(a => a.status === 'Approved')
  const filtered     = issues.filter(i =>
    (fCat  === 'All' || i.category === fCat) &&
    (fPri  === 'All' || i.priority === fPri) &&
    (fStat === 'All' || i.status   === fStat)
  )
  const filteredAst  = fAst === 'All' ? assistants : assistants.filter(a => a.status === fAst)

  async function doLogin(e) {
    e.preventDefault()
    setLoginLoading(true)
    setErr('')
    try {
      await adminLogin(email.trim(), pass)
      setLoggedIn(true)
    } catch (error) {
      setErr('Invalid email or password.')
    } finally {
      setLoginLoading(false)
    }
  }

  async function doLogout() {
    await adminLogout()
    setLoggedIn(false)
    setEmail('')
    setPass('')
  }

  function doAssign() {
    if (!assignName) return
    updateIssue(assignModal, { status:'Assigned', assignedTo:assignName })
    setAssignModal(null); setAssignName('')
  }

  function handleIssueStatClick(type, val) {
    if (type==='status')   { setFStat(val); setFCat('All'); setFPri('All') }
    if (type==='priority') { setFPri(val);  setFCat('All'); setFStat('All') }
    if (type==='all')      { setFStat('All'); setFCat('All'); setFPri('All') }
    setTimeout(()=>document.getElementById('issues-table')?.scrollIntoView({behavior:'smooth',block:'start'}), 100)
  }

  function handleAstStatClick(val) {
    setFAst(val)
    setTimeout(()=>document.getElementById('asst-table')?.scrollIntoView({behavior:'smooth',block:'start'}), 100)
  }

  const issueStats = [
    { label:'Total Issues',  value:issues.length,                                        icon:'📊', cls:'stat-blue',   type:'all',      val:'All'            },
    { label:'Pending',       value:issues.filter(i=>i.status==='Pending Review').length,  icon:'⏳', cls:'stat-violet', type:'status',   val:'Pending Review' },
    { label:'High Priority', value:issues.filter(i=>i.priority==='High').length,          icon:'🔴', cls:'stat-red',    type:'priority', val:'High'           },
    { label:'In Progress',   value:issues.filter(i=>i.status==='In Progress').length,     icon:'🔧', cls:'stat-amber',  type:'status',   val:'In Progress'    },
    { label:'Resolved',      value:issues.filter(i=>i.status==='Resolved').length,        icon:'✅', cls:'stat-green',  type:'status',   val:'Resolved'       },
  ]

  const astStats = [
    { label:'Total',    value:assistants.length,                                   cls:'stat-teal',  val:'All'      },
    { label:'Approved', value:assistants.filter(a=>a.status==='Approved').length,  cls:'stat-green', val:'Approved' },
    { label:'Pending',  value:assistants.filter(a=>a.status==='Pending').length,   cls:'stat-amber', val:'Pending'  },
  ]

  // ═══════════ LOGIN ═══════════
  if (!loggedIn) return (
    <div style={{ minHeight:'calc(100vh - 4rem)', background:LC.bg, display:'flex', alignItems:'center', justifyContent:'center', padding:'64px 16px' }}>
      <div style={{ width:'100%', maxWidth:'380px' }}>
        <div style={{ background:LC.card, border:`1px solid ${LC.border}`, borderRadius:'16px', padding:'24px', marginBottom:'14px', textAlign:'center', boxShadow:'0 2px 14px rgba(0,0,0,0.08)' }}>
          <div style={{ width:'50px', height:'50px', borderRadius:'16px', background:LC.btn, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', margin:'0 auto 12px' }}>🔐</div>
          <h1 style={{ fontSize:'1.3rem', fontWeight:900, color:LC.dark, margin:0 }}>Admin Login</h1>
          <p style={{ fontSize:'0.875rem', color:LC.muted, marginTop:'4px' }}>Restricted — authorised personnel only.</p>
        </div>
        <div style={{ background:LC.card, border:`1px solid ${LC.border}`, borderRadius:'16px', padding:'24px', boxShadow:'0 2px 14px rgba(0,0,0,0.08)' }}>
          <form onSubmit={doLogin} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <div>
              <label style={{ fontSize:'0.71rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.07em', color:LC.muted, marginBottom:'6px', display:'block' }}>Admin Email</label>
              <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setErr('')}} placeholder="Enter your email"
                style={{ background:LC.inp, border:`1.5px solid ${LC.border}`, borderRadius:'10px', padding:'10px 14px', fontSize:'0.875rem', color:LC.dark, width:'100%', fontFamily:'Nunito,sans-serif' }} required />
            </div>
            <div>
              <label style={{ fontSize:'0.71rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.07em', color:LC.muted, marginBottom:'6px', display:'block' }}>Password</label>
              <div style={{ position:'relative' }}>
                <input type={showP?'text':'password'} value={pass} onChange={e=>{setPass(e.target.value);setErr('')}} placeholder="Enter password"
                  style={{ background:LC.inp, border:`1.5px solid ${LC.border}`, borderRadius:'10px', padding:'10px 14px', paddingRight:'44px', fontSize:'0.875rem', color:LC.dark, width:'100%', fontFamily:'Nunito,sans-serif' }} required />
                <button type="button" onClick={()=>setShowP(p=>!p)} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:'1rem' }}>
                  {showP?'🙈':'👁'}
                </button>
              </div>
            </div>
            {err && <div style={{ background:'#ffe0e0', border:'1.5px solid #f0a0a0', borderRadius:'10px', padding:'10px 14px', color:'#900808', fontSize:'0.78rem', fontWeight:700 }}>{err}</div>}
            <button type="submit" disabled={loginLoading}
              style={{ background:loginLoading?'#526080':LC.btn, color:'#fff', fontWeight:800, fontSize:'0.9rem', padding:'12px', borderRadius:'10px', border:'none', cursor:loginLoading?'not-allowed':'pointer', boxShadow:'0 3px 12px rgba(0,0,0,0.22)', transition:'background 0.2s' }}>
              {loginLoading ? 'Signing in...' : 'Sign In to Dashboard'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )

  // ═══════════ DASHBOARD ═══════════
  return (
    <div style={{ display:'flex', minHeight:'calc(100vh - 4rem)', background:DC.bg, position:'relative' }}>

      {sidebarOpen && (
        <div onClick={()=>setSidebarOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:40 }} />
      )}

      {/* Navy Sidebar */}
      <aside className="admin-sidebar panel-enter" style={{ width:'200px', flexShrink:0, display:'flex', flexDirection:'column', padding:'20px 10px', position:'fixed', top:'64px', left:0, height:'calc(100vh - 64px)', zIndex:50, overflowY:'auto', transition:'transform 0.25s ease' }}
        ref={el => {
          if (!el) return
          const apply = () => { el.style.transform = window.innerWidth >= 1024 ? 'translateX(0)' : (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') }
          apply(); window.addEventListener('resize', apply)
        }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 6px', marginBottom:'14px' }}>
          <p style={{ fontSize:'0.68rem', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.1em', color:'#90b8f0' }}>Admin Panel</p>
          <button onClick={()=>setSidebarOpen(false)} className="lg:hidden" style={{ background:'none', border:'none', color:'#90b8f0', cursor:'pointer', fontSize:'1rem' }}>✕</button>
        </div>
        {[{key:'issues',icon:'📋',label:'Issues'},{key:'assistants',icon:'👷',label:'Assistants'}].map(n=>(
          <button key={n.key} onClick={()=>{setTab(n.key);setSidebarOpen(false)}} className={`sidebar-item ${tab===n.key?'active':''}`}>
            <span>{n.icon}</span><span>{n.label}</span>
          </button>
        ))}
        <div style={{ marginTop:'auto', paddingTop:'20px', display:'flex', flexDirection:'column', gap:'4px' }}>
          {[{label:'Total',value:issues.length},{label:'Pending',value:issues.filter(i=>i.status==='Pending Review').length},{label:'Resolved',value:issues.filter(i=>i.status==='Resolved').length}].map(s=>(
            <div key={s.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 10px', borderRadius:'8px', background:'rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize:'0.75rem', color:'#90b8f0' }}>{s.label}</span>
              <span style={{ fontSize:'0.9rem', fontWeight:900, color:'#fff' }}>{s.value}</span>
            </div>
          ))}
          <button onClick={doLogout}
            style={{ marginTop:'8px', width:'100%', padding:'8px', borderRadius:'8px', background:'rgba(220,50,50,0.15)', color:'#f87171', border:'1px solid rgba(220,50,50,0.25)', cursor:'pointer', fontWeight:800, fontSize:'0.78rem' }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(220,50,50,0.28)'}
            onMouseLeave={e=>e.currentTarget.style.background='rgba(220,50,50,0.15)'}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex:1, minWidth:0, padding:'24px 20px' }} className="lg:ml-[200px] fade-in">

        <div className="flex items-center gap-3 mb-5 lg:hidden">
          <button onClick={()=>setSidebarOpen(true)} style={{ padding:'7px 12px', borderRadius:'8px', background:DC.surf, border:`1px solid ${DC.border}`, color:DC.text, cursor:'pointer', fontWeight:800 }}>☰</button>
          <h1 style={{ fontSize:'1.1rem', fontWeight:900, color:DC.text }}>{tab==='issues'?'Issue Management':'Assistant Management'}</h1>
        </div>

        {/* ══ ISSUES TAB ══ */}
        {tab==='issues' && <>
          <div className="hidden lg:block mb-5">
            <h1 style={{ fontSize:'1.3rem', fontWeight:900, color:DC.text }}>Issue Management</h1>
            <p style={{ fontSize:'0.875rem', color:DC.muted, marginTop:'2px' }}>Click a stat card to filter. Review, assign and track all reported issues.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
            {issueStats.map(s => {
              const isActive = (s.type==='all'&&fStat==='All'&&fPri==='All') || (s.type==='status'&&fStat===s.val) || (s.type==='priority'&&fPri===s.val)
              const idx = issueStats.findIndex(x => x.label === s.label)
              return (
                <div key={s.label} onClick={()=>handleIssueStatClick(s.type,s.val)}
                  className={`stat-card ${s.cls} stagger-item`}
                  style={{ '--stagger-delay': `${idx * 60}ms`, cursor:'pointer', outline:isActive?'3px solid rgba(255,255,255,0.7)':'none', outlineOffset:'2px', transform:isActive?'translateY(-3px) scale(1.02)':'' }}
                >
                  <div className="stat-icon">{s.icon}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div className="stat-label">{s.label}</div>
                    <div className="stat-value">{s.value}</div>
                  </div>
                </div>
              )
            })}
          </div>

          <div id="issues-table" style={{ background:DC.surf, border:`1px solid ${DC.border}`, borderRadius:'12px', padding:'12px 16px', marginBottom:'14px', display:'flex', flexWrap:'wrap', alignItems:'center', gap:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
            <span style={{ fontSize:'0.72rem', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.07em', color:DC.muted }}>Filter:</span>
            {[{label:'Category',opts:CATEGORIES,val:fCat,set:setFCat},{label:'Priority',opts:PRIORITIES,val:fPri,set:setFPri},{label:'Status',opts:['All',...STATUSES],val:fStat,set:setFStat}].map(f=>(
              <div key={f.label} style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                <span style={{ fontSize:'0.78rem', fontWeight:700, color:DC.muted }}>{f.label}</span>
                <select value={f.val} onChange={e=>f.set(e.target.value)} style={{ background:DC.surf2, border:`1.5px solid ${DC.border}`, borderRadius:'8px', padding:'5px 10px', fontSize:'0.78rem', color:DC.text, fontFamily:'Nunito,sans-serif' }}>
                  {f.opts.map(o=><option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <span style={{ fontSize:'0.78rem', fontWeight:700, color:DC.muted, marginLeft:'auto' }}>{filtered.length} result{filtered.length!==1?'s':''}</span>
            {(fStat!=='All'||fPri!=='All'||fCat!=='All') && (
              <button onClick={()=>{setFStat('All');setFPri('All');setFCat('All')}} style={{ fontSize:'0.72rem', fontWeight:800, color:'#4e8ef7', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>Clear</button>
            )}
          </div>

          {/* Desktop table */}
          <div style={{ background:DC.surf, border:`1px solid ${DC.border}`, borderRadius:'14px', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.07)' }} className="hidden md:block">
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.815rem', minWidth:'780px' }}>
                <thead><tr>{['ID','Submitted By','Dept','Issue','Category','Priority','Status','Assigned','Actions'].map(h=>(
                  <th key={h} style={{ textAlign:'left', padding:'10px 14px', fontSize:'0.69rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.06em', color:DC.muted, borderBottom:`2px solid ${DC.border}`, whiteSpace:'nowrap', background:DC.surf2 }}>{h}</th>
                ))}</tr></thead>
                <tbody>
                  {filtered.length===0&&<tr><td colSpan={9} style={{ textAlign:'center', padding:'40px', color:DC.muted }}>No issues found.</td></tr>}
                  {filtered.map(issue=>(
                    <tr key={issue.$id} style={{ borderBottom:`1px solid ${DC.border}` }}
                      onMouseEnter={e=>e.currentTarget.style.background=DC.surf2}
                      onMouseLeave={e=>e.currentTarget.style.background=''}>
                      <td style={{ padding:'11px 14px' }}><span style={{ fontFamily:'DM Mono,monospace', fontSize:'0.72rem', color:DC.muted }}>{issue.$id.slice(0,8)}</span></td>
                      <td style={{ padding:'11px 14px' }}>
                        <p style={{ fontWeight:700, fontSize:'0.78rem', color:DC.text }}>{issue.name}</p>
                        <p style={{ fontSize:'0.72rem', color:DC.muted, marginTop:'2px' }}>{issue.role} · {issue.rollOrId}</p>
                      </td>
                      <td style={{ padding:'11px 14px', fontSize:'0.78rem', fontWeight:600, color:DC.muted }}>{issue.department}</td>
                      <td style={{ padding:'11px 14px', maxWidth:'150px' }}>
                        <p style={{ fontWeight:700, fontSize:'0.78rem', color:DC.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{issue.title}</p>
                        <p style={{ fontSize:'0.72rem', color:DC.muted, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{issue.location}</p>
                      </td>
                      <td style={{ padding:'11px 14px', fontSize:'0.78rem', fontWeight:600, color:DC.muted }}>{issue.category}</td>
                      <td style={{ padding:'11px 14px' }}><PBadge priority={issue.priority} /></td>
                      <td style={{ padding:'11px 14px' }}>
                        <select value={issue.status} onChange={e=>updateIssue(issue.$id,{status:e.target.value})} style={{ background:DC.surf2, border:`1.5px solid ${DC.border}`, borderRadius:'8px', padding:'5px 8px', fontSize:'0.75rem', color:DC.text, minWidth:'115px', fontFamily:'Nunito,sans-serif' }}>
                          {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td style={{ padding:'11px 14px', fontSize:'0.78rem', fontWeight:600, color:issue.assignedTo?DC.text:DC.muted, whiteSpace:'nowrap' }}>{issue.assignedTo||'—'}</td>
                      <td style={{ padding:'11px 14px' }}>
                        <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
                          <button onClick={()=>setViewModal(issue)} style={{ background:'#1a7840', color:'#fff', fontWeight:700, fontSize:'0.75rem', padding:'6px 10px', borderRadius:'8px', border:'none', cursor:'pointer' }}>👁 View</button>
                          {issue.status==='Pending Review'&&<>
                            <button onClick={()=>updateIssue(issue.$id,{status:'Accepted'})} className="btn-success">✓</button>
                            <button onClick={()=>updateIssue(issue.$id,{status:'Rejected'})} className="btn-danger">✗</button>
                          </>}
                          <button onClick={()=>{setAssignModal(issue.$id);setAssignName(issue.assignedTo||'')}} className="btn-accent">Assign</button>
                          <button onClick={()=>deleteIssue(issue.$id)} className="btn-ghost">🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div style={{ background:DC.surf, border:`1px solid ${DC.border}`, borderRadius:'14px', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.07)' }} className="md:hidden">
            {filtered.length===0&&<div style={{ textAlign:'center', padding:'40px', color:DC.muted }}>No issues found.</div>}
            {filtered.map(issue=>(
              <div key={issue.$id} style={{ padding:'14px', borderBottom:`1px solid ${DC.border}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'8px', marginBottom:'6px' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <span style={{ fontFamily:'DM Mono,monospace', fontSize:'0.69rem', color:DC.muted }}>{issue.$id.slice(0,8)}</span>
                    <p style={{ fontWeight:800, fontSize:'0.875rem', color:DC.text, marginTop:'2px' }}>{issue.title}</p>
                    <p style={{ fontSize:'0.72rem', color:DC.muted }}>{issue.location} · {issue.department}</p>
                  </div>
                  <PBadge priority={issue.priority} />
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                  <span style={{ fontSize:'0.72rem', color:DC.muted }}>{issue.name} · {issue.role}</span>
                  <SBadge status={issue.status} />
                </div>
                <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', paddingTop:'8px', borderTop:`1px solid ${DC.border}` }}>
                  <button onClick={()=>setViewModal(issue)} style={{ background:'#1a7840', color:'#fff', fontWeight:700, fontSize:'0.75rem', padding:'6px 10px', borderRadius:'8px', border:'none', cursor:'pointer' }}>👁 View</button>
                  <select value={issue.status} onChange={e=>updateIssue(issue.$id,{status:e.target.value})} style={{ background:DC.surf2, border:`1.5px solid ${DC.border}`, borderRadius:'8px', padding:'5px 8px', fontSize:'0.75rem', flex:1, minWidth:'110px', fontFamily:'Nunito,sans-serif' }}>
                    {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                  {issue.status==='Pending Review'&&<>
                    <button onClick={()=>updateIssue(issue.$id,{status:'Accepted'})} className="btn-success">Accept</button>
                    <button onClick={()=>updateIssue(issue.$id,{status:'Rejected'})} className="btn-danger">Reject</button>
                  </>}
                  <button onClick={()=>{setAssignModal(issue.$id);setAssignName(issue.assignedTo||'')}} className="btn-accent">Assign</button>
                  <button onClick={()=>deleteIssue(issue.$id)} className="btn-ghost">🗑</button>
                </div>
              </div>
            ))}
          </div>
        </>}

        {/* ══ ASSISTANTS TAB ══ */}
        {tab==='assistants' && <>
          <div className="hidden lg:block mb-5">
            <h1 style={{ fontSize:'1.3rem', fontWeight:900, color:DC.text }}>Assistant Management</h1>
            <p style={{ fontSize:'0.875rem', color:DC.muted, marginTop:'2px' }}>Click a stat card to filter. Approve signups and manage assistants.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {astStats.map(s=>{
              const isActive = fAst===s.val
              const idx = astStats.findIndex(x => x.label === s.label)
              return (
                <div key={s.label} onClick={()=>handleAstStatClick(s.val)}
                  className={`stat-card ${s.cls} stagger-item`}
                  style={{ '--stagger-delay': `${idx * 70}ms`, cursor:'pointer', outline:isActive?'3px solid rgba(255,255,255,0.7)':'none', outlineOffset:'2px', transform:isActive?'translateY(-3px) scale(1.02)':'' }}>
                  <div className="stat-icon">👷</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div className="stat-label">{s.label}</div>
                    <div className="stat-value">{s.value}</div>
                  </div>
                </div>
              )
            })}
          </div>
          {fAst!=='All' && (
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}>
              <span style={{ fontSize:'0.78rem', color:DC.muted }}>Showing: <strong style={{ color:DC.text }}>{fAst}</strong></span>
              <button onClick={()=>setFAst('All')} style={{ fontSize:'0.72rem', fontWeight:800, color:'#4e8ef7', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>Show all</button>
            </div>
          )}
          <div id="asst-table" style={{ background:DC.surf, border:`1px solid ${DC.border}`, borderRadius:'14px', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.07)' }} className="hidden sm:block">
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.815rem' }}>
              <thead><tr>{['Name','Employee ID','Category','Email','Status','Actions'].map(h=>(
                <th key={h} style={{ textAlign:'left', padding:'10px 14px', fontSize:'0.69rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.06em', color:DC.muted, borderBottom:`2px solid ${DC.border}`, background:DC.surf2 }}>{h}</th>
              ))}</tr></thead>
              <tbody>
                {filteredAst.length===0&&<tr><td colSpan={6} style={{ textAlign:'center', padding:'30px', color:DC.muted }}>No assistants found.</td></tr>}
                {filteredAst.map(a=>(
                  <tr key={a.$id} style={{ borderBottom:`1px solid ${DC.border}` }}
                    onMouseEnter={e=>e.currentTarget.style.background=DC.surf2}
                    onMouseLeave={e=>e.currentTarget.style.background=''}>
                    <td style={{ padding:'11px 14px', fontWeight:700, color:DC.text }}>{a.name}</td>
                    <td style={{ padding:'11px 14px' }}><span style={{ fontFamily:'DM Mono,monospace', fontSize:'0.72rem', color:DC.muted }}>{a.employeeId}</span></td>
                    <td style={{ padding:'11px 14px', fontSize:'0.78rem', fontWeight:600, color:DC.muted }}>{a.category}</td>
                    <td style={{ padding:'11px 14px', fontSize:'0.78rem', color:DC.muted }}>{a.email}</td>
                    <td style={{ padding:'11px 14px' }}><span className={`badge ${a.status==='Approved'?'badge-resolved':'badge-inprogress'}`}>{a.status}</span></td>
                    <td style={{ padding:'11px 14px' }}>
                      <div style={{ display:'flex', gap:'6px' }}>
                        {a.status==='Pending'&&<button onClick={()=>approveAssistant(a.$id)} className="btn-success">Approve</button>}
                        <button onClick={()=>removeAssistant(a.$id)} className="btn-danger">Remove</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background:DC.surf, border:`1px solid ${DC.border}`, borderRadius:'14px', overflow:'hidden' }} className="sm:hidden">
            {filteredAst.map(a=>(
              <div key={a.$id} style={{ padding:'14px', borderBottom:`1px solid ${DC.border}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                  <div>
                    <p style={{ fontWeight:800, color:DC.text }}>{a.name}</p>
                    <p style={{ fontSize:'0.75rem', color:DC.muted }}>{a.category} · {a.employeeId}</p>
                  </div>
                  <span className={`badge ${a.status==='Approved'?'badge-resolved':'badge-inprogress'}`}>{a.status}</span>
                </div>
                <div style={{ display:'flex', gap:'6px', marginTop:'8px' }}>
                  {a.status==='Pending'&&<button onClick={()=>approveAssistant(a.$id)} className="btn-success">Approve</button>}
                  <button onClick={()=>removeAssistant(a.$id)} className="btn-danger">Remove</button>
                </div>
              </div>
            ))}
          </div>
        </>}
      </div>

      {/* Assign Modal */}
      {assignModal && (
        <div className="modal-backdrop" onClick={e=>e.target===e.currentTarget&&setAssignModal(null)}>
          <div className="modal fade-up">
            <h3 style={{ fontSize:'1.1rem', fontWeight:900, color:DC.text, marginBottom:'4px' }}>Assign Assistant</h3>
            <p style={{ fontSize:'0.75rem', color:DC.muted, marginBottom:'16px' }}>Assigning to issue in the system.</p>
            <label className="lbl">Choose Assistant</label>
            <select value={assignName} onChange={e=>setAssignName(e.target.value)} className="inp mb-4">
              <option value="">Select an assistant...</option>
              {approved.map(a=><option key={a.$id} value={a.name}>{a.name} ({a.category})</option>)}
            </select>
            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={doAssign} className="btn-primary" style={{ flex:1, padding:'10px' }}>Assign</button>
              <button onClick={()=>setAssignModal(null)} className="btn-secondary" style={{ flex:1, padding:'10px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewModal && (
        <div className="modal-backdrop" onClick={e=>e.target===e.currentTarget&&setViewModal(null)}>
          <div className="fade-up" style={{ background:DC.surf, border:`1px solid ${DC.border}`, borderRadius:'20px', width:'100%', maxWidth:'560px', overflow:'hidden', boxShadow:'0 24px 64px rgba(0,0,0,0.22)' }}>
            <div style={{ background:'linear-gradient(135deg,#1a2f5e,#2e4fa0)', padding:'18px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <span style={{ fontSize:'1.2rem' }}>📋</span>
                <div>
                  <p style={{ color:'#fff', fontWeight:900, fontSize:'1rem', margin:0 }}>Issue Details</p>
                  <p style={{ color:'#90b8f0', fontSize:'0.72rem', margin:0, fontFamily:'DM Mono,monospace' }}>{viewModal.$id?.slice(0,8)}</p>
                </div>
              </div>
              <button onClick={()=>setViewModal(null)} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'8px', color:'#fff', cursor:'pointer', fontSize:'1.1rem', width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            </div>
            <div style={{ padding:'24px' }}>
              <div style={{ display:'flex', gap:'20px', marginBottom:'20px' }}>
                <div style={{ width:'120px', height:'120px', flexShrink:0, borderRadius:'12px', background:DC.surf2, border:`1px solid ${DC.border}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                  {viewModal.imageUrl ? <img src={viewModal.imageUrl} alt="issue" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <><span style={{ fontSize:'2rem', marginBottom:'4px' }}>🖼️</span><span style={{ fontSize:'0.69rem', color:DC.muted, fontWeight:600 }}>No image</span></>}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <h2 style={{ fontSize:'1.1rem', fontWeight:900, color:DC.text, margin:'0 0 8px' }}>{viewModal.title}</h2>
                  <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'10px' }}>
                    <SBadge status={viewModal.status} />
                    <PBadge priority={viewModal.priority} />
                    <span style={{ fontSize:'0.69rem', padding:'3px 10px', borderRadius:'20px', background:'#e8eeff', color:'#2040a0', border:'1.5px solid #a0c0f0', fontWeight:800 }}>{viewModal.category}</span>
                  </div>
                  <p style={{ fontSize:'0.78rem', color:DC.muted, margin:0 }}>📍 {viewModal.location}</p>
                  <p style={{ fontSize:'0.78rem', color:DC.muted, margin:'4px 0 0' }}>🏛️ {viewModal.department} Dept.</p>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'16px' }}>
                {[{label:'Reported By',value:`${viewModal.name} (${viewModal.role})`},{label:'Roll / Faculty ID',value:viewModal.rollOrId},{label:'Submitted On',value:viewModal.$createdAt?.slice(0,10)},{label:'Assigned To',value:viewModal.assignedTo||'Not assigned yet'}].map(d=>(
                  <div key={d.label} style={{ background:DC.surf2, border:`1px solid ${DC.border}`, borderRadius:'10px', padding:'10px 14px' }}>
                    <p style={{ fontSize:'0.65rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.07em', color:DC.muted, margin:'0 0 3px' }}>{d.label}</p>
                    <p style={{ fontSize:'0.82rem', fontWeight:700, color:DC.text, margin:0 }}>{d.value}</p>
                  </div>
                ))}
              </div>
              {viewModal.description && (
                <div style={{ background:DC.surf2, border:`1px solid ${DC.border}`, borderRadius:'10px', padding:'12px 14px', marginBottom:'16px' }}>
                  <p style={{ fontSize:'0.65rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.07em', color:DC.muted, margin:'0 0 4px' }}>Description</p>
                  <p style={{ fontSize:'0.875rem', color:DC.text, margin:0, lineHeight:1.5 }}>{viewModal.description}</p>
                </div>
              )}
              <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                <select value={viewModal.status}
                  onChange={e=>{ updateIssue(viewModal.$id,{status:e.target.value}); setViewModal(v=>({...v,status:e.target.value})) }}
                  style={{ background:DC.surf2, border:`1.5px solid ${DC.border}`, borderRadius:'8px', padding:'7px 12px', fontSize:'0.78rem', color:DC.text, fontFamily:'Nunito,sans-serif', flex:1, minWidth:'130px' }}>
                  {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
                {viewModal.status==='Pending Review'&&<>
                  <button onClick={()=>{ updateIssue(viewModal.$id,{status:'Accepted'}); setViewModal(v=>({...v,status:'Accepted'})) }} className="btn-success">✓ Accept</button>
                  <button onClick={()=>{ updateIssue(viewModal.$id,{status:'Rejected'}); setViewModal(v=>({...v,status:'Rejected'})) }} className="btn-danger">✗ Reject</button>
                </>}
                <button onClick={()=>{ setAssignModal(viewModal.$id); setAssignName(viewModal.assignedTo||''); setViewModal(null) }} className="btn-accent">Assign</button>
                <button onClick={()=>setViewModal(null)} className="btn-ghost">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
