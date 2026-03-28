import { useState, useEffect } from 'react'
import UserPanel from './UserPanel.jsx'
import AdminPanel from './AdminPanel.jsx'
import AssistantPanel from './AssistantPanel.jsx'
import {
  getAllIssues, getAllAssistants,
  submitIssue, updateIssueDoc, deleteIssueDoc,
  approveAssistantDoc, removeAssistantDoc,
  adminLogout, logoutAssistant,
} from './appwrite.js'

// Clear ALL sessions whenever tab switches or page loads
async function clearAllSessions() {
  await Promise.allSettled([adminLogout(), logoutAssistant()])
}

function NavBar({ active, onTabChange }) {
  return (
    <nav className="topnav fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-sm"
          style={{ background:'linear-gradient(135deg,#4e8ef7,#1d4ed8)' }}>F</div>
        <div>
          <span className="font-black text-white text-base tracking-tight">FixTrack</span>
          <span className="hidden sm:inline text-xs text-blue-300 ml-2 font-semibold">Issue Reporting & Resolution Portal</span>
        </div>
      </div>
      <div className="flex gap-1 rounded-xl p-1" style={{ background:'rgba(255,255,255,0.1)' }}>
        {['User','Admin','Assistant'].map(tab => (
          <button key={tab} onClick={() => onTabChange(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-200
              ${active===tab ? 'bg-white text-blue-900 shadow' : 'text-blue-200 hover:text-white hover:bg-white/10'}`}>
            {tab}
          </button>
        ))}
      </div>
    </nav>
  )
}

export default function App() {
  const [active, setActive]         = useState('User')
  const [issues, setIssues]         = useState([])
  const [assistants, setAssistants] = useState([])
  const [loading, setLoading]       = useState(true)
  const [loadError, setLoadError]   = useState('')

  // On page load — clear any stale sessions
  useEffect(() => {
    clearAllSessions()
  }, [])

  // Load data from Appwrite on mount
  useEffect(() => {
    async function load() {
      try {
        const [iss, ast] = await Promise.all([getAllIssues(), getAllAssistants()])
        setIssues(iss)
        setAssistants(ast)
      } catch (e) {
        console.error('Appwrite load error:', e)
        setLoadError('Could not connect to database. Check your appwrite.js credentials.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Tab switch — always clear sessions so each panel starts fresh
  async function handleTabChange(tab) {
    if (tab !== active) {
      await clearAllSessions()
      setActive(tab)
    }
  }

  // Issue actions
  async function addIssue(data) {
    const doc = await submitIssue(data)
    setIssues(p => [doc, ...p])
  }

  async function handleUpdateIssue(id, changes) {
    // Reset to the shared team queue: no specific assignee while waiting for pickup
    const payload =
      changes.status === 'Pending Review' ? { ...changes, assignedTo: '' } : changes
    const updated = await updateIssueDoc(id, payload)
    setIssues(p => p.map(i => (i.$id === id ? updated : i)))
  }

  async function handleDeleteIssue(id) {
    await deleteIssueDoc(id)
    setIssues(p => p.filter(i => i.$id !== id))
  }

  // Assistant actions
  async function handleApproveAssistant(id) {
    const updated = await approveAssistantDoc(id)
    setAssistants(p => p.map(a => (a.$id === id ? updated : a)))
  }

  async function handleRemoveAssistant(id) {
    await removeAssistantDoc(id)
    setAssistants(p => p.filter(a => a.$id !== id))
  }

  function handleAddAssistant(doc) {
    setAssistants(p => [...p, doc])
  }

  const props = {
    issues,
    assistants,
    addIssue,
    updateIssue:      handleUpdateIssue,
    deleteIssue:      handleDeleteIssue,
    addAssistant:     handleAddAssistant,
    approveAssistant: handleApproveAssistant,
    removeAssistant:  handleRemoveAssistant,
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'14px' }}>
      <div style={{ width:'42px', height:'42px', borderRadius:'50%', border:'4px solid #2a3a56', borderTop:'4px solid #7ea2ff', animation:'spin 0.7s linear infinite' }} />
      <p style={{ color:'var(--muted)', fontSize:'0.875rem', fontWeight:700 }}>Loading FixTrack...</p>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  )

  if (loadError) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
      <div style={{ background:'var(--surface)', border:'1px solid #7f3c50', borderRadius:'16px', padding:'32px', maxWidth:'440px', textAlign:'center' }}>
        <div style={{ fontSize:'2.5rem', marginBottom:'12px' }}>⚠️</div>
        <h2 style={{ fontWeight:900, color:'var(--text)', marginBottom:'8px' }}>Connection Error</h2>
        <p style={{ color:'var(--muted)', fontSize:'0.875rem', lineHeight:1.6 }}>{loadError}</p>
      </div>
    </div>
  )

  return (
    <div style={{ background:'var(--bg)', minHeight:'100vh' }}>
      <NavBar active={active} onTabChange={handleTabChange} />
      <div className="pt-16">
        {active==='User'      && <div className="tab-panel-enter"><UserPanel      {...props} /></div>}
        {active==='Admin'     && <div className="tab-panel-enter"><AdminPanel     {...props} /></div>}
        {active==='Assistant' && <div className="tab-panel-enter"><AssistantPanel {...props} /></div>}
      </div>
    </div>
  )
}
