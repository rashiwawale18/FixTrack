import { useState } from 'react'
import { trackIssues } from './appwrite.js'

const DEPARTMENTS = ['CS','IT','AIDS','AIML','EXTC','CS-IOT','ECS']
const CATEGORIES  = ['Electrical','Plumbing','Mechanical','Electronics','Cleaning']
const PRIORITIES  = ['Low','Medium','High']
const ROLL_REGEX  = /^[0-9][0-9]{2}[A-Z][0-9]{4}$/

function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="lbl">{label}</label>
      {children}
      {error && <span style={{ color:'#a01818', fontSize:'0.71rem', fontWeight:700 }}>{error}</span>}
    </div>
  )
}

function StatusBadge({ status }) {
  const m = { 'Pending Review':'badge-pending','Accepted':'badge-accepted','Assigned':'badge-assigned','In Progress':'badge-inprogress','Resolved':'badge-resolved','Rejected':'badge-rejected' }
  return <span className={`badge ${m[status]||'badge-pending'}`}>{status}</span>
}
function PriorityBadge({ priority }) {
  return <span className={`badge priority-${priority?.toLowerCase()}`}>{priority}</span>
}

const FEATURES = [
  { icon:'⚡', title:'Instant Reporting',    desc:'Submit any infrastructure issue in seconds — no login required.' },
  { icon:'📍', title:'Live Status Tracking', desc:'Track your submitted issues anytime using your Roll No or Faculty ID.' },
  { icon:'👷', title:'Expert Assistants',    desc:'Dedicated category-wise teams handle every reported issue promptly.' },
  { icon:'🔔', title:'Priority System',      desc:'High, medium and low priority ensures critical issues get fixed first.' },
]

export default function UserPanel({ addIssue }) {
  const [form, setForm] = useState({ name:'', role:'Student', rollOrId:'', department:'', title:'', location:'', category:'', priority:'Medium', description:'', imageFile:null })
  const [errors, setErrors]             = useState({})
  const [submitted, setSubmitted]       = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [trackId, setTrackId]           = useState('')
  const [trackResults, setTrackResults] = useState(null)
  const [trackLoading, setTrackLoading] = useState(false)

  function set(f, v) { setForm(p => ({...p,[f]:v})); setErrors(e => ({...e,[f]:''})) }

  function validate() {
    const e = {}
    if (!form.name.trim())     e.name     = 'Name is required'
    if (!form.rollOrId.trim()) e.rollOrId = form.role==='Student' ? 'Roll number is required' : 'Faculty ID is required'
    if (form.role==='Student' && !ROLL_REGEX.test(form.rollOrId)) e.rollOrId = 'Invalid format. Example: 124A8122'
    if (!form.department)      e.department = 'Select a department'
    if (!form.title.trim())    e.title      = 'Issue title is required'
    if (!form.location.trim()) e.location   = 'Location is required'
    if (!form.category)        e.category   = 'Select a category'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSubmitLoading(true)
    try {
      await addIssue({ ...form })
      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        setForm({ name:'', role:'Student', rollOrId:'', department:'', title:'', location:'', category:'', priority:'Medium', description:'', imageFile:null })
      }, 3500)
    } catch (err) {
      alert('Failed to submit issue. Please try again.')
    } finally {
      setSubmitLoading(false)
    }
  }

  async function handleTrack() {
    if (!trackId.trim()) return
    setTrackLoading(true)
    try {
      const results = await trackIssues(trackId.trim())
      setTrackResults(results)
    } catch {
      setTrackResults([])
    } finally {
      setTrackLoading(false)
    }
  }

  return (
    <div>
      {/* ── HERO ── */}
      <section className="hero-strip py-14 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-widest mb-5"
            style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'#bfdbfe' }}>
            🏫 Engineering Department Portal
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white mb-4 leading-tight">
            Report. Track. <span style={{ color:'#7fb8ff' }}>Resolve.</span>
          </h1>
          <p className="text-base sm:text-lg mb-8 font-semibold leading-relaxed max-w-xl mx-auto" style={{ color:'#bfdbfe' }}>
            FixTrack helps students and faculty report infrastructure issues across all engineering departments — fast and hassle-free.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => document.getElementById('report-section')?.scrollIntoView({behavior:'smooth'})}
              className="px-8 py-3 rounded-xl font-black text-base transition-all duration-200 hover:-translate-y-1"
              style={{ background:'#fff', color:'var(--navy)', boxShadow:'0 4px 18px rgba(0,0,0,0.2)' }}>
              + Report an Issue
            </button>
            <button onClick={() => document.getElementById('track-section')?.scrollIntoView({behavior:'smooth'})}
              className="px-8 py-3 rounded-xl font-black text-base transition-all duration-200"
              style={{ background:'rgba(255,255,255,0.13)', color:'#fff', border:'2px solid rgba(255,255,255,0.28)' }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.22)'}
              onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.13)'}>
              Track My Issues
            </button>
          </div>
        </div>
      </section>

      {/* ── FEATURE CARDS ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 -mt-7 mb-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {FEATURES.map((f,i) => (
            <div key={f.title} className="feature-card fade-up" style={{ animationDelay:`${i*0.07}s` }}>
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="font-black text-sm mb-1" style={{ color:'var(--navy)' }}>{f.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color:'var(--muted)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-10">
        <div className="card-flat p-5 sm:p-6">
          <h2 className="text-base font-black mb-4" style={{ color:'var(--navy)' }}>How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step:'01', title:'Fill the Form',  desc:'Enter your details, describe the issue and select category & priority.' },
              { step:'02', title:'Admin Reviews',  desc:'Admin accepts the issue and assigns the right category assistant.' },
              { step:'03', title:'Issue Resolved', desc:'Track real-time status: Accepted → In Progress → Resolved.' },
            ].map(s => (
              <div key={s.step} className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                  style={{ background:'var(--navy)' }}>{s.step}</div>
                <div>
                  <p className="font-black text-sm mb-0.5" style={{ color:'var(--navy)' }}>{s.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color:'var(--muted)' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REPORT FORM ── */}
      <section id="report-section" className="max-w-5xl mx-auto px-4 sm:px-6 mb-10">
        <div className="card-flat overflow-hidden">
          <div className="px-5 sm:px-7 py-4 flex items-center gap-3" style={{ background:'var(--navy)' }}>
            <span className="text-xl">📝</span>
            <div>
              <h2 className="font-black text-white text-base">Report an Issue</h2>
              <p className="text-xs" style={{ color:'#bfdbfe' }}>Fill in the details below — no login required</p>
            </div>
          </div>
          <div className="p-5 sm:p-7">
            {submitted ? (
              <div className="alert-success flex items-center gap-3 fade-in">
                <span className="text-xl">✅</span>
                <div>
                  <p className="font-black">Issue submitted successfully!</p>
                  <p className="text-xs mt-0.5">Admin will review it shortly. Track it below using your ID.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Name" error={errors.name}>
                    <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Your name" className="inp" />
                  </Field>
                  <Field label="Role">
                    <select value={form.role} onChange={e=>{set('role',e.target.value);set('rollOrId','')}} className="inp">
                      <option value="Student">Student</option>
                      <option value="Teacher">Teacher</option>
                    </select>
                  </Field>
                </div>

                <Field label={form.role==='Student'?'Roll Number':'Faculty ID'} error={errors.rollOrId}>
                  <input value={form.rollOrId}
                    onChange={e=>set('rollOrId', form.role==='Student' ? e.target.value.toUpperCase() : e.target.value)}
                    placeholder={form.role==='Student'?'e.g. 124A8122':'e.g. FAC-201'} className="inp" />
                </Field>

                <Field label="Engineering Department" error={errors.department}>
                  <select value={form.department} onChange={e=>set('department',e.target.value)} className="inp">
                    <option value="">Select department...</option>
                    {DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Issue Title" error={errors.title}>
                    <input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Brief title of the issue" className="inp" />
                  </Field>
                  <Field label="Location" error={errors.location}>
                    <input value={form.location} onChange={e=>set('location',e.target.value)} placeholder="e.g. Lab 3, Block B" className="inp" />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Category" error={errors.category}>
                    <select value={form.category} onChange={e=>set('category',e.target.value)} className="inp">
                      <option value="">Select...</option>
                      {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Priority">
                    <select value={form.priority} onChange={e=>set('priority',e.target.value)} className="inp">
                      {PRIORITIES.map(p=><option key={p} value={p}>{p}</option>)}
                    </select>
                  </Field>
                </div>

                <Field label="Description (Optional)">
                  <textarea value={form.description} onChange={e=>set('description',e.target.value)}
                    rows={3} placeholder="Any extra details..." className="inp resize-none" />
                </Field>

                <Field label="Image (Optional)">
                  <input type="file" accept="image/*"
                    onChange={e=>set('imageFile', e.target.files[0])}
                    className="text-sm cursor-pointer" style={{ color:'var(--muted)' }} />
                </Field>

                <button type="submit" disabled={submitLoading}
                  className="btn-primary w-full sm:w-auto sm:self-start px-10 py-3 text-base mt-1"
                  style={{ opacity: submitLoading ? 0.7 : 1, cursor: submitLoading ? 'not-allowed' : 'pointer' }}>
                  {submitLoading ? 'Submitting...' : 'Submit Issue →'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── TRACK SECTION ── */}
      <section id="track-section" className="max-w-5xl mx-auto px-4 sm:px-6 mb-16">
        <div className="card-flat overflow-hidden">
          <div className="px-5 sm:px-7 py-4 flex items-center gap-3" style={{ background:'var(--navy)' }}>
            <span className="text-xl">🔍</span>
            <div>
              <h2 className="font-black text-white text-base">Track Your Issues</h2>
              <p className="text-xs" style={{ color:'#bfdbfe' }}>Enter your Roll Number or Faculty ID — no login needed</p>
            </div>
          </div>
          <div className="p-5 sm:p-7">
            <div className="flex gap-3 mb-5">
              <input value={trackId} onChange={e=>setTrackId(e.target.value.toUpperCase())}
                placeholder="e.g. 124A8122 or FAC-201" className="inp flex-1"
                onKeyDown={e=>e.key==='Enter'&&handleTrack()} />
              <button onClick={handleTrack} disabled={trackLoading}
                className="btn-primary px-6 whitespace-nowrap"
                style={{ opacity: trackLoading ? 0.7 : 1 }}>
                {trackLoading ? '...' : 'Track'}
              </button>
            </div>

            {trackResults !== null && (
              <div className="fade-in">
                {trackResults.length === 0
                  ? <div className="text-center py-8 text-sm" style={{ color:'var(--muted)' }}>
                      <div className="text-3xl mb-2">🔎</div>
                      No issues found for this ID.
                    </div>
                  : <div className="flex flex-col gap-3">
                      {trackResults.map(issue => (
                        <div key={issue.$id} className="card p-4">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                            <div>
                              <span className="mono text-xs" style={{ color:'var(--muted)' }}>{issue.$id.slice(0,8)}</span>
                              <p className="font-black text-sm mt-0.5" style={{ color:'var(--navy)' }}>{issue.title}</p>
                              <p className="text-xs mt-0.5" style={{ color:'var(--muted)' }}>{issue.location} · {issue.department} Dept.</p>
                            </div>
                            <StatusBadge status={issue.status} />
                          </div>
                          <div className="flex items-center gap-3 flex-wrap pt-2" style={{ borderTop:'1px solid var(--border)' }}>
                            <span className="text-xs" style={{ color:'var(--muted)' }}>Category: <strong style={{ color:'var(--text)' }}>{issue.category}</strong></span>
                            <PriorityBadge priority={issue.priority} />
                            {issue.assignedTo && <span className="text-xs" style={{ color:'var(--muted)' }}>Assigned: <strong style={{ color:'var(--text)' }}>{issue.assignedTo}</strong></span>}
                          </div>
                        </div>
                      ))}
                    </div>
                }
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
