import { useState, useEffect } from 'react'
import { signupAssistant, loginAssistant, logoutAssistant, getLoggedInAssistant } from './appwrite.js'

const CATEGORIES = ['Electrical','Plumbing','Mechanical','Electronics','Cleaning']
const STATUSES   = ['Pending Review','Accepted','Assigned','In Progress','Resolved']

const LC = { bg:'#ede8f8', card:'#e0d8f5', inp:'#d4ccee', border:'#b0a0d8', dark:'#1a1040', muted:'#4a4080', btn:'#251e54' }
const DC = { bg:'#f2f4f8', surf:'#ffffff', surf2:'#f0f2f8', border:'#d4daea', text:'#18243a', muted:'#526080' }

function SBadge({ status }) {
  const m = { 'Pending Review':'badge-pending','Accepted':'badge-accepted','Assigned':'badge-assigned','In Progress':'badge-inprogress','Resolved':'badge-resolved','Rejected':'badge-rejected' }
  return <span className={`badge ${m[status]||'badge-pending'}`}>{status}</span>
}
function PBadge({ priority }) {
  return <span className={`badge priority-${priority?.toLowerCase()}`}>{priority}</span>
}

export default function AssistantPanel({ issues, assistants, addAssistant, updateIssue }) {
  const [view, setView]   = useState('login')
  const [me, setMe]       = useState(null)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPass, setLoginPass]   = useState('')
  const [showLP, setShowLP]         = useState(false)
  const [loginErr, setLoginErr]     = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [signup, setSignup] = useState({ name:'', employeeId:'', category:'', email:'', password:'' })
  const [showSP, setShowSP] = useState(false)
  const [signupDone, setSignupDone] = useState(false)
  const [signupErr, setSignupErr]   = useState('')
  const [signupLoading, setSignupLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [filterStat, setFilterStat]   = useState('All')
  const [viewModal, setViewModal]     = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    async function restore() {
      const asst = await getLoggedInAssistant()
      if (asst) { setMe(asst); setView('dashboard') }
      setCheckingSession(false)
    }
    restore()
  }, [])

  async function handleLogin(e) {
    e.preventDefault()
    setLoginLoading(true); setLoginErr('')
    try {
      const asst = await loginAssistant(loginEmail.trim(), loginPass)
      setMe(asst); setView('dashboard')
    } catch (error) {
      setLoginErr(error.message || 'Login failed. Try again.')
    } finally {
      setLoginLoading(false)
    }
  }

  async function handleSignup(e) {
    e.preventDefault()
    const { name, employeeId, category, email, password } = signup
    if (!name||!employeeId||!category||!email||!password) { setSignupErr('All fields are required.'); return }
    setSignupLoading(true); setSignupErr('')
    try {
      const doc = await signupAssistant(signup)
      addAssistant(doc)
      setSignupDone(true)
      setTimeout(()=>{ setSignupDone(false); setView('login'); setSignup({name:'',employeeId:'',category:'',email:'',password:''}) }, 3000)
    } catch (error) {
      setSignupErr(error.message || 'Signup failed. This email may already be registered.')
    } finally {
      setSignupLoading(false)
    }
  }

  async function handleLogout() {
    await logoutAssistant()
    setMe(null); setView('login')
    setLoginEmail(''); setLoginPass('')
  }

  // ─── Issue visibility logic ───────────────────────────────────────────────
  // Assistants see ALL issues in their category (except Rejected)
  // They can self-accept any Pending Review issue in their dept
  // Admin can also assign to them regardless
  const myIssues   = me ? issues.filter(i => i.category === me.category && i.status !== 'Rejected') : []

  // Available = Pending Review issues in their category (not yet accepted by anyone)
  const available  = myIssues.filter(i => i.status === 'Pending Review').length
  const inProgress = myIssues.filter(i => i.status === 'In Progress').length
  const resolved   = myIssues.filter(i => i.status === 'Resolved').length
  const pending    = myIssues.filter(i => ['Pending Review','Accepted','Assigned'].includes(i.status)).length

  const filteredIssues = filterStat === 'All' ? myIssues : myIssues.filter(i => i.status === filterStat)

  function handleStatClick(val) {
    setFilterStat(val)
    setTimeout(()=>document.getElementById('asst-table')?.scrollIntoView({behavior:'smooth',block:'start'}), 100)
  }

  const inp = { background:LC.inp, border:`1.5px solid ${LC.border}`, borderRadius:'10px', padding:'10px 14px', fontSize:'0.875rem', color:LC.dark, width:'100%', fontFamily:'Nunito,sans-serif' }
  const lbl = { fontSize:'0.71rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.07em', color:LC.muted, marginBottom:'6px', display:'block' }

  if (checkingSession) return (
    <div style={{ minHeight:'calc(100vh - 4rem)', background:LC.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:'36px', height:'36px', borderRadius:'50%', border:'4px solid #d4ccee', borderTop:`4px solid ${LC.btn}`, animation:'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  )

  // ═══════════ LOGIN ═══════════
  if (view==='login') return (
    <div style={{ minHeight:'calc(100vh - 4rem)', background:LC.bg, display:'flex', alignItems:'center', justifyContent:'center', padding:'64px 16px' }}>
      <div style={{ width:'100%', maxWidth:'380px' }}>
        <div style={{ background:LC.card, border:`1px solid ${LC.border}`, borderRadius:'16px', padding:'24px', marginBottom:'14px', textAlign:'center', boxShadow:'0 2px 14px rgba(0,0,0,0.08)' }}>
          <div style={{ width:'50px', height:'50px', borderRadius:'16px', background:LC.btn, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', margin:'0 auto 12px' }}>👷</div>
          <h1 style={{ fontSize:'1.3rem', fontWeight:900, color:LC.dark, margin:0 }}>Assistant Login</h1>
          <p style={{ fontSize:'0.875rem', color:LC.muted, marginTop:'4px' }}>Sign in to manage your assigned issues.</p>
        </div>
        <div style={{ background:LC.card, border:`1px solid ${LC.border}`, borderRadius:'16px', padding:'24px', boxShadow:'0 2px 14px rgba(0,0,0,0.08)' }}>
          <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <div><label style={lbl}>Email Address</label>
              <input type="email" value={loginEmail} onChange={e=>{setLoginEmail(e.target.value);setLoginErr('')}} placeholder="your@email.com" style={inp} required />
            </div>
            <div>
              <label style={lbl}>Password</label>
              <div style={{ position:'relative' }}>
                <input type={showLP?'text':'password'} value={loginPass} onChange={e=>{setLoginPass(e.target.value);setLoginErr('')}} placeholder="Enter password" style={{ ...inp, paddingRight:'44px' }} required />
                <button type="button" onClick={()=>setShowLP(p=>!p)} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:'1rem' }}>{showLP?'🙈':'👁'}</button>
              </div>
            </div>
            {loginErr && <div style={{ background:'#ffe0e0', border:'1.5px solid #f0a0a0', borderRadius:'10px', padding:'10px 14px', color:'#900808', fontSize:'0.78rem', fontWeight:700 }}>{loginErr}</div>}
            <button type="submit" disabled={loginLoading}
              style={{ background:loginLoading?'#526080':LC.btn, color:'#fff', fontWeight:800, fontSize:'0.9rem', padding:'12px', borderRadius:'10px', border:'none', cursor:loginLoading?'not-allowed':'pointer', boxShadow:'0 3px 12px rgba(0,0,0,0.22)' }}>
              {loginLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <div style={{ height:'1px', background:LC.border, margin:'16px 0' }} />
          <p style={{ textAlign:'center', fontSize:'0.875rem', color:LC.muted }}>
            New here?{' '}<button onClick={()=>setView('signup')} style={{ background:'none', border:'none', cursor:'pointer', fontWeight:800, color:'#6858d8', fontSize:'0.875rem' }}>Apply as Assistant</button>
          </p>
        </div>
      </div>
    </div>
  )

  // ═══════════ SIGNUP ═══════════
  if (view==='signup') return (
    <div style={{ minHeight:'calc(100vh - 4rem)', background:LC.bg, display:'flex', alignItems:'center', justifyContent:'center', padding:'64px 16px' }}>
      <div style={{ width:'100%', maxWidth:'380px' }}>
        <div style={{ background:LC.card, border:`1px solid ${LC.border}`, borderRadius:'16px', padding:'20px', marginBottom:'14px', textAlign:'center', boxShadow:'0 2px 14px rgba(0,0,0,0.08)' }}>
          <h1 style={{ fontSize:'1.3rem', fontWeight:900, color:LC.dark }}>Apply as Assistant</h1>
          <p style={{ fontSize:'0.875rem', color:LC.muted, marginTop:'4px' }}>Your application will be reviewed by admin.</p>
        </div>
        {signupDone
          ? <div style={{ background:'#d8f5e8', border:'1.5px solid #88d8a8', borderRadius:'14px', padding:'32px 24px', textAlign:'center' }}>
              <div style={{ fontSize:'2.5rem', marginBottom:'8px' }}>✅</div>
              <p style={{ fontWeight:900, color:'#0e6030' }}>Application submitted!</p>
              <p style={{ fontSize:'0.8rem', color:'#1a7840', marginTop:'4px' }}>Wait for admin approval before logging in.</p>
            </div>
          : <div style={{ background:LC.card, border:`1px solid ${LC.border}`, borderRadius:'16px', padding:'24px', boxShadow:'0 2px 14px rgba(0,0,0,0.08)' }}>
              <form onSubmit={handleSignup} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                {[{label:'Full Name',field:'name',placeholder:'Your full name',type:'text'},{label:'Employee ID',field:'employeeId',placeholder:'e.g. EMP-105',type:'text'},{label:'Email',field:'email',placeholder:'your@email.com',type:'email'}].map(f=>(
                  <div key={f.field}><label style={lbl}>{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} value={signup[f.field]} onChange={e=>setSignup(s=>({...s,[f.field]:e.target.value}))} style={inp} required />
                  </div>
                ))}
                <div><label style={lbl}>Category</label>
                  <select value={signup.category} onChange={e=>setSignup(s=>({...s,category:e.target.value}))} style={inp} required>
                    <option value="">Select category...</option>
                    {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Password</label>
                  <div style={{ position:'relative' }}>
                    <input type={showSP?'text':'password'} placeholder="Create a password (min 8 chars)" value={signup.password} onChange={e=>setSignup(s=>({...s,password:e.target.value}))} style={{ ...inp, paddingRight:'44px' }} required />
                    <button type="button" onClick={()=>setShowSP(p=>!p)} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:'1rem' }}>{showSP?'🙈':'👁'}</button>
                  </div>
                </div>
                {signupErr && <div style={{ background:'#ffe0e0', border:'1.5px solid #f0a0a0', borderRadius:'10px', padding:'10px 14px', color:'#900808', fontSize:'0.78rem', fontWeight:700 }}>{signupErr}</div>}
                <button type="submit" disabled={signupLoading}
                  style={{ background:signupLoading?'#526080':LC.btn, color:'#fff', fontWeight:800, fontSize:'0.9rem', padding:'12px', borderRadius:'10px', border:'none', cursor:signupLoading?'not-allowed':'pointer' }}>
                  {signupLoading ? 'Submitting...' : 'Submit Application'}
                </button>
              </form>
              <div style={{ height:'1px', background:LC.border, margin:'16px 0' }} />
              <p style={{ textAlign:'center', fontSize:'0.875rem', color:LC.muted }}>
                Already registered?{' '}<button onClick={()=>setView('login')} style={{ background:'none', border:'none', cursor:'pointer', fontWeight:800, color:'#6858d8', fontSize:'0.875rem' }}>Sign In</button>
              </p>
            </div>
        }
      </div>
    </div>
  )

  // ═══════════ DASHBOARD ═══════════
  const dashStats = [
    { label:'Available',      value:available,        cls:'stat-teal',   val:'Pending Review' },
    { label:'Total Issues',   value:myIssues.length,  cls:'stat-indigo', val:'All'            },
    { label:'Pending',        value:pending,          cls:'stat-rose',   val:'Pending Review' },
    { label:'In Progress',    value:inProgress,       cls:'stat-amber',  val:'In Progress'    },
    { label:'Resolved',       value:resolved,         cls:'stat-green',  val:'Resolved'       },
  ]

  return (
    <div style={{ display:'flex', minHeight:'calc(100vh - 4rem)', background:DC.bg, position:'relative' }}>
      {sidebarOpen && <div onClick={()=>setSidebarOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:40 }} />}

      {/* Indigo Sidebar */}
      <aside className="asst-sidebar" style={{ width:'200px', flexShrink:0, display:'flex', flexDirection:'column', padding:'20px 10px', position:'fixed', top:'64px', left:0, height:'calc(100vh - 64px)', zIndex:50, overflowY:'auto', transition:'transform 0.25s ease' }}
        ref={el => {
          if (!el) return
          const apply = () => { el.style.transform = window.innerWidth >= 1024 ? 'translateX(0)' : (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') }
          apply(); window.addEventListener('resize', apply)
        }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 6px', marginBottom:'14px' }}>
          <p style={{ fontSize:'0.68rem', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.1em', color:'#a0a0e8' }}>My Dashboard</p>
          <button onClick={()=>setSidebarOpen(false)} className="lg:hidden" style={{ background:'none', border:'none', color:'#a0a0e8', cursor:'pointer', fontSize:'1rem' }}>✕</button>
        </div>
        <div style={{ borderRadius:'10px', padding:'12px', marginBottom:'12px', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)' }}>
          <p style={{ fontWeight:900, color:'#fff', fontSize:'0.9rem' }}>{me.name}</p>
          <p style={{ fontSize:'0.72rem', color:'#c0b8ff', marginTop:'2px' }}>{me.category} Team</p>
          <p style={{ fontFamily:'DM Mono,monospace', fontSize:'0.68rem', color:'#a0a0e8', marginTop:'2px' }}>{me.employeeId}</p>
        </div>
        {[{label:'Available',value:available},{label:'Total',value:myIssues.length},{label:'Pending',value:pending},{label:'In Progress',value:inProgress},{label:'Resolved',value:resolved}].map(s=>(
          <div key={s.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 10px', borderRadius:'8px', marginBottom:'3px', background:'rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize:'0.75rem', color:'#a0a0e8' }}>{s.label}</span>
            <span style={{ fontSize:'0.9rem', fontWeight:900, color:'#fff' }}>{s.value}</span>
          </div>
        ))}
        <div style={{ marginTop:'auto', paddingTop:'16px' }}>
          <button onClick={handleLogout}
            style={{ width:'100%', padding:'8px', borderRadius:'8px', background:'rgba(220,50,50,0.15)', color:'#f87171', border:'1px solid rgba(220,50,50,0.25)', cursor:'pointer', fontWeight:800, fontSize:'0.78rem' }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(220,50,50,0.28)'}
            onMouseLeave={e=>e.currentTarget.style.background='rgba(220,50,50,0.15)'}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex:1, minWidth:0, padding:'24px 20px' }} className="lg:ml-[200px]">
        <div className="flex items-center gap-3 mb-5 lg:hidden">
          <button onClick={()=>setSidebarOpen(true)} style={{ padding:'7px 12px', borderRadius:'8px', background:DC.surf, border:`1px solid ${DC.border}`, color:DC.text, cursor:'pointer', fontWeight:800 }}>☰</button>
          <h1 style={{ fontSize:'1.1rem', fontWeight:900, color:DC.text }}>{me.category} Issues</h1>
        </div>
        <div className="hidden lg:block mb-5">
          <h1 style={{ fontSize:'1.3rem', fontWeight:900, color:DC.text }}>{me.category} Issues</h1>
          <p style={{ fontSize:'0.875rem', color:DC.muted, marginTop:'2px' }}>
            All {me.category.toLowerCase()} issues — click <strong>Available</strong> to see new issues you can accept.
          </p>
        </div>

        {/* 5 Clickable stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
          {dashStats.map(s=>(
            <div key={s.label} onClick={()=>handleStatClick(s.val)}
              className={`stat-card ${s.cls}`}
              style={{ cursor:'pointer', outline:filterStat===s.val?'3px solid rgba(255,255,255,0.7)':'none', outlineOffset:'2px', transform:filterStat===s.val?'translateY(-3px) scale(1.02)':'' }}>
              <div className="stat-icon">{s.label==='Available'?'🔓':s.label==='Total Issues'?'📌':s.label==='Pending'?'⏳':s.label==='In Progress'?'🔧':'✅'}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {filterStat!=='All' && (
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}>
            <span style={{ fontSize:'0.78rem', color:DC.muted }}>Showing: <strong style={{ color:DC.text }}>{filterStat}</strong></span>
            <button onClick={()=>setFilterStat('All')} style={{ fontSize:'0.72rem', fontWeight:800, color:'#4e8ef7', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>Show all</button>
          </div>
        )}

        <div id="asst-table">
          {filteredIssues.length===0
            ? <div style={{ background:DC.surf, border:`1px solid ${DC.border}`, borderRadius:'14px', padding:'48px', textAlign:'center' }}>
                <div style={{ fontSize:'2.5rem', marginBottom:'8px' }}>{filterStat==='Pending Review'?'🎉':'📭'}</div>
                <p style={{ fontWeight:900, color:DC.text }}>
                  {filterStat==='Pending Review' ? 'No new issues right now!' : filterStat==='All' ? 'No issues in your category yet.' : `No issues with status: ${filterStat}`}
                </p>
                {filterStat!=='All' && <button onClick={()=>setFilterStat('All')} style={{ background:'none', border:'none', color:'#4e8ef7', cursor:'pointer', fontWeight:700, fontSize:'0.875rem', marginTop:'6px' }}>Show all →</button>}
              </div>
            : <>
                {/* Desktop table */}
                <div style={{ background:DC.surf, border:`1px solid ${DC.border}`, borderRadius:'14px', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.07)' }} className="hidden md:block">
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.815rem', minWidth:'640px' }}>
                      <thead><tr>{['Issue ID','Problem','Location','Reporter','Priority','Status','Actions'].map(h=>(
                        <th key={h} style={{ textAlign:'left', padding:'10px 14px', fontSize:'0.69rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.06em', color:DC.muted, borderBottom:`2px solid ${DC.border}`, whiteSpace:'nowrap', background:DC.surf2 }}>{h}</th>
                      ))}</tr></thead>
                      <tbody>
                        {filteredIssues.map(issue=>(
                          <tr key={issue.$id} style={{ borderBottom:`1px solid ${DC.border}` }}
                            onMouseEnter={e=>e.currentTarget.style.background=DC.surf2}
                            onMouseLeave={e=>e.currentTarget.style.background=''}>
                            <td style={{ padding:'11px 14px' }}><span style={{ fontFamily:'DM Mono,monospace', fontSize:'0.72rem', color:DC.muted }}>{issue.$id?.slice(0,8)}</span></td>
                            <td style={{ padding:'11px 14px' }}>
                              <p style={{ fontWeight:700, fontSize:'0.78rem', color:DC.text }}>{issue.title}</p>
                              {issue.description&&<p style={{ fontSize:'0.69rem', color:DC.muted, maxWidth:'140px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{issue.description}</p>}
                            </td>
                            <td style={{ padding:'11px 14px', fontSize:'0.78rem', fontWeight:600, color:DC.muted }}>{issue.location}</td>
                            <td style={{ padding:'11px 14px' }}>
                              <p style={{ fontWeight:700, fontSize:'0.78rem', color:DC.text }}>{issue.name}</p>
                              <p style={{ fontSize:'0.69rem', color:DC.muted }}>{issue.department}</p>
                            </td>
                            <td style={{ padding:'11px 14px' }}><PBadge priority={issue.priority} /></td>
                            <td style={{ padding:'11px 14px' }}><SBadge status={issue.status} /></td>
                            <td style={{ padding:'11px 14px' }}>
                              <div style={{ display:'flex', gap:'5px', flexWrap:'wrap', alignItems:'center' }}>
                                {/* View */}
                                <button onClick={()=>setViewModal(issue)} style={{ background:'#1a7840', color:'#fff', fontWeight:700, fontSize:'0.75rem', padding:'6px 10px', borderRadius:'8px', border:'none', cursor:'pointer' }}>👁 View</button>
                                {/* Self-accept: assistant picks up a Pending Review issue */}
                                {issue.status==='Pending Review' && (
                                  <button onClick={()=>updateIssue(issue.$id,{status:'Accepted', assignedTo:me.name})} className="btn-accent">✓ Accept</button>
                                )}
                                {/* Start working */}
                                {(issue.status==='Accepted'||issue.status==='Assigned') && (
                                  <button onClick={()=>updateIssue(issue.$id,{status:'In Progress'})} className="btn-success">▶ Start</button>
                                )}
                                {/* Mark resolved */}
                                {issue.status==='In Progress' && (
                                  <button onClick={()=>updateIssue(issue.$id,{status:'Resolved'})} className="btn-success">✓ Done</button>
                                )}
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
                  {filteredIssues.map(issue=>(
                    <div key={issue.$id} style={{ padding:'14px', borderBottom:`1px solid ${DC.border}` }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'8px', marginBottom:'6px' }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <span style={{ fontFamily:'DM Mono,monospace', fontSize:'0.69rem', color:DC.muted }}>{issue.$id?.slice(0,8)}</span>
                          <p style={{ fontWeight:800, fontSize:'0.875rem', color:DC.text, marginTop:'2px' }}>{issue.title}</p>
                          <p style={{ fontSize:'0.72rem', color:DC.muted }}>{issue.location}</p>
                        </div>
                        <PBadge priority={issue.priority} />
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                        <span style={{ fontSize:'0.72rem', color:DC.muted }}>{issue.name} · {issue.department}</span>
                        <SBadge status={issue.status} />
                      </div>
                      <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', paddingTop:'8px', borderTop:`1px solid ${DC.border}` }}>
                        <button onClick={()=>setViewModal(issue)} style={{ background:'#1a7840', color:'#fff', fontWeight:700, fontSize:'0.75rem', padding:'6px 10px', borderRadius:'8px', border:'none', cursor:'pointer' }}>👁 View</button>
                        {issue.status==='Pending Review' && (
                          <button onClick={()=>updateIssue(issue.$id,{status:'Accepted', assignedTo:me.name})} className="btn-accent">✓ Accept</button>
                        )}
                        {(issue.status==='Accepted'||issue.status==='Assigned') && (
                          <button onClick={()=>updateIssue(issue.$id,{status:'In Progress'})} className="btn-success">▶ Start</button>
                        )}
                        {issue.status==='In Progress' && (
                          <button onClick={()=>updateIssue(issue.$id,{status:'Resolved'})} className="btn-success">✓ Done</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
          }
        </div>
      </div>

      {/* View Modal */}
      {viewModal && (
        <div className="modal-backdrop" onClick={e=>e.target===e.currentTarget&&setViewModal(null)}>
          <div className="fade-up" style={{ background:DC.surf, border:`1px solid ${DC.border}`, borderRadius:'20px', width:'100%', maxWidth:'540px', overflow:'hidden', boxShadow:'0 24px 64px rgba(0,0,0,0.22)' }}>
            <div style={{ background:'linear-gradient(135deg,#251e54,#4838a0)', padding:'18px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <span style={{ fontSize:'1.2rem' }}>📋</span>
                <div>
                  <p style={{ color:'#fff', fontWeight:900, fontSize:'1rem', margin:0 }}>Issue Details</p>
                  <p style={{ color:'#c0b8ff', fontSize:'0.72rem', margin:0, fontFamily:'DM Mono,monospace' }}>{viewModal.$id?.slice(0,8)}</p>
                </div>
              </div>
              <button onClick={()=>setViewModal(null)} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'8px', color:'#fff', cursor:'pointer', fontSize:'1.1rem', width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            </div>
            <div style={{ padding:'24px' }}>
              <div style={{ display:'flex', gap:'18px', marginBottom:'18px' }}>
                <div style={{ width:'110px', height:'110px', flexShrink:0, borderRadius:'12px', background:DC.surf2, border:`1px solid ${DC.border}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                  {viewModal.imageUrl ? <img src={viewModal.imageUrl} alt="issue" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <><span style={{ fontSize:'1.8rem', marginBottom:'4px' }}>🖼️</span><span style={{ fontSize:'0.68rem', color:DC.muted, fontWeight:600 }}>No image</span></>}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <h2 style={{ fontSize:'1.05rem', fontWeight:900, color:DC.text, margin:'0 0 8px' }}>{viewModal.title}</h2>
                  <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'8px' }}>
                    <SBadge status={viewModal.status} />
                    <PBadge priority={viewModal.priority} />
                    <span style={{ fontSize:'0.69rem', padding:'3px 10px', borderRadius:'20px', background:'#ece0ff', color:'#4820a0', border:'1.5px solid #c0a0f0', fontWeight:800 }}>{viewModal.category}</span>
                  </div>
                  <p style={{ fontSize:'0.78rem', color:DC.muted, margin:0 }}>📍 {viewModal.location}</p>
                  <p style={{ fontSize:'0.78rem', color:DC.muted, margin:'4px 0 0' }}>🏛️ {viewModal.department} Dept.</p>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'14px' }}>
                {[{label:'Reported By',value:`${viewModal.name} (${viewModal.role})`},{label:'Roll / Faculty ID',value:viewModal.rollOrId},{label:'Submitted On',value:viewModal.$createdAt?.slice(0,10)},{label:'Assigned To',value:viewModal.assignedTo||'Not assigned yet'}].map(d=>(
                  <div key={d.label} style={{ background:DC.surf2, border:`1px solid ${DC.border}`, borderRadius:'10px', padding:'10px 14px' }}>
                    <p style={{ fontSize:'0.65rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.07em', color:DC.muted, margin:'0 0 3px' }}>{d.label}</p>
                    <p style={{ fontSize:'0.82rem', fontWeight:700, color:DC.text, margin:0 }}>{d.value}</p>
                  </div>
                ))}
              </div>
              {viewModal.description && (
                <div style={{ background:DC.surf2, border:`1px solid ${DC.border}`, borderRadius:'10px', padding:'12px 14px', marginBottom:'14px' }}>
                  <p style={{ fontSize:'0.65rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.07em', color:DC.muted, margin:'0 0 4px' }}>Description</p>
                  <p style={{ fontSize:'0.875rem', color:DC.text, margin:0, lineHeight:1.5 }}>{viewModal.description}</p>
                </div>
              )}
              <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                {viewModal.status==='Pending Review' && (
                  <button onClick={()=>{ updateIssue(viewModal.$id,{status:'Accepted',assignedTo:me.name}); setViewModal(v=>({...v,status:'Accepted',assignedTo:me.name})) }} className="btn-accent">✓ Accept Issue</button>
                )}
                {(viewModal.status==='Accepted'||viewModal.status==='Assigned') && (
                  <button onClick={()=>{ updateIssue(viewModal.$id,{status:'In Progress'}); setViewModal(v=>({...v,status:'In Progress'})) }} className="btn-success">▶ Start Task</button>
                )}
                {viewModal.status==='In Progress' && (
                  <button onClick={()=>{ updateIssue(viewModal.$id,{status:'Resolved'}); setViewModal(v=>({...v,status:'Resolved'})) }} className="btn-success">✓ Mark Resolved</button>
                )}
                <button onClick={()=>setViewModal(null)} className="btn-ghost">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
