import http from 'http'
import { Client, Databases, ID, Query } from 'node-appwrite'

// ─── Appwrite Setup ──────────────────────────────────────────────────────────
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY)

const DB_ID      = process.env.APPWRITE_DB_ID
const ISSUES_COL = 'issues'
const ASST_COL   = 'assistants'

// ─── Validation ──────────────────────────────────────────────────────────────
const ROLL_REGEX       = /^[0-9][0-9]{2}[A-Z][0-9]{4}$/
const VALID_CATEGORIES = ['Electrical', 'Plumbing', 'Mechanical', 'Electronics', 'Cleaning']
const VALID_PRIORITIES = ['Low', 'Medium', 'High']
const VALID_STATUSES   = ['Pending Review', 'Accepted', 'Assigned', 'In Progress', 'Resolved', 'Rejected']

function validateIssue(body) {
  const { name, role, rollOrId, department, title, location, category, priority } = body
  if (!name || !role || !rollOrId || !department || !title || !location || !category || !priority)
    return 'All required fields must be filled.'
  if (role === 'Student' && !ROLL_REGEX.test(rollOrId))
    return 'Invalid roll number. Expected format: e.g. 124A8122'
  if (!VALID_CATEGORIES.includes(category))
    return 'Invalid category selected.'
  if (!VALID_PRIORITIES.includes(priority))
    return 'Invalid priority selected.'
  return null
}

// ─── Helper: read request body ───────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => data += chunk)
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')) }
      catch { reject(new Error('Invalid JSON')) }
    })
  })
}

// ─── Helper: send JSON response ──────────────────────────────────────────────
function send(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end(JSON.stringify(data))
}

// ─── Router ──────────────────────────────────────────────────────────────────
async function router(req, res) {
  const url    = req.url
  const method = req.method

  // Handle CORS preflight
  if (method === 'OPTIONS') return send(res, 204, {})

  // ── POST /api/issues — Submit new issue ──────────────────────────────────
  if (method === 'POST' && url === '/api/issues') {
    const body = await readBody(req)
    const error = validateIssue(body)
    if (error) return send(res, 400, { success: false, message: error })

    const doc = await db.createDocument(DB_ID, ISSUES_COL, ID.unique(), {
      name:       body.name,
      role:       body.role,
      rollOrId:   body.rollOrId,
      department: body.department,
      title:      body.title,
      location:   body.location,
      category:   body.category,
      priority:   body.priority,
      description: body.description || '',
      status:     'Pending Review',
      assignedTo: '',
    })
    return send(res, 201, { success: true, issue: doc })
  }

  // ── GET /api/issues — Get all issues (admin) ─────────────────────────────
  if (method === 'GET' && url === '/api/issues') {
    const result = await db.listDocuments(DB_ID, ISSUES_COL, [Query.orderDesc('$createdAt')])
    return send(res, 200, { success: true, issues: result.documents })
  }

  // ── GET /api/issues/track?id=124A8122 — Track by roll/faculty ID ─────────
  if (method === 'GET' && url.startsWith('/api/issues/track')) {
    const trackId = new URL(url, 'http://localhost').searchParams.get('id')
    if (!trackId) return send(res, 400, { success: false, message: 'ID is required.' })

    const result = await db.listDocuments(DB_ID, ISSUES_COL, [
      Query.equal('rollOrId', trackId)
    ])
    return send(res, 200, { success: true, issues: result.documents })
  }

  // ── PATCH /api/issues/:id — Update status / assign assistant (admin) ──────
  if (method === 'PATCH' && url.startsWith('/api/issues/')) {
    const id   = url.split('/')[3]
    const body = await readBody(req)

    if (body.status && !VALID_STATUSES.includes(body.status))
      return send(res, 400, { success: false, message: 'Invalid status.' })

    const updates = {}
    if (body.status)     updates.status     = body.status
    if (body.assignedTo !== undefined) updates.assignedTo = body.assignedTo

    const doc = await db.updateDocument(DB_ID, ISSUES_COL, id, updates)
    return send(res, 200, { success: true, issue: doc })
  }

  // ── DELETE /api/issues/:id — Delete issue (admin) ────────────────────────
  if (method === 'DELETE' && url.startsWith('/api/issues/')) {
    const id = url.split('/')[3]
    await db.deleteDocument(DB_ID, ISSUES_COL, id)
    return send(res, 200, { success: true, message: 'Issue deleted.' })
  }

  // ── POST /api/assistants — Assistant signup ───────────────────────────────
  if (method === 'POST' && url === '/api/assistants') {
    const body = await readBody(req)
    const { name, employeeId, category, email } = body

    if (!name || !employeeId || !category || !email)
      return send(res, 400, { success: false, message: 'All fields are required.' })
    if (!VALID_CATEGORIES.includes(category))
      return send(res, 400, { success: false, message: 'Invalid category.' })

    const doc = await db.createDocument(DB_ID, ASST_COL, ID.unique(), {
      name, employeeId, category, email, status: 'Pending'
    })
    return send(res, 201, { success: true, assistant: doc })
  }

  // ── GET /api/assistants — Get all assistants (admin) ─────────────────────
  if (method === 'GET' && url === '/api/assistants') {
    const result = await db.listDocuments(DB_ID, ASST_COL)
    return send(res, 200, { success: true, assistants: result.documents })
  }

  // ── POST /api/assistants/login — Assistant login ──────────────────────────
  if (method === 'POST' && url === '/api/assistants/login') {
    const { employeeId, category } = await readBody(req)
    if (!employeeId || !category)
      return send(res, 400, { success: false, message: 'Employee ID and category required.' })

    const result = await db.listDocuments(DB_ID, ASST_COL, [
      Query.equal('employeeId', employeeId),
      Query.equal('category', category),
      Query.equal('status', 'Approved'),
    ])
    if (result.documents.length === 0)
      return send(res, 401, { success: false, message: 'No approved assistant found.' })

    return send(res, 200, { success: true, assistant: result.documents[0] })
  }

  // ── PATCH /api/assistants/:id — Approve or remove assistant (admin) ───────
  if (method === 'PATCH' && url.startsWith('/api/assistants/')) {
    const id   = url.split('/')[3]
    const body = await readBody(req)
    const doc  = await db.updateDocument(DB_ID, ASST_COL, id, { status: body.status })
    return send(res, 200, { success: true, assistant: doc })
  }

  // ── DELETE /api/assistants/:id — Remove assistant (admin) ────────────────
  if (method === 'DELETE' && url.startsWith('/api/assistants/')) {
    const id = url.split('/')[3]
    await db.deleteDocument(DB_ID, ASST_COL, id)
    return send(res, 200, { success: true, message: 'Assistant removed.' })
  }

  // ── 404 fallback ──────────────────────────────────────────────────────────
  return send(res, 404, { success: false, message: 'Route not found.' })
}

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = 3000
http.createServer(async (req, res) => {
  try {
    await router(req, res)
  } catch (err) {
    console.error('Server error:', err.message)
    send(res, 500, { success: false, message: 'Internal server error.' })
  }
}).listen(PORT, () => {
  console.log(`FixTrack backend running on http://localhost:${PORT}`)
})
