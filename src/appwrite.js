import { Client, Account, Databases, Storage, ID, Query } from 'appwrite'

const ENDPOINT   = import.meta.env.VITE_APPWRITE_ENDPOINT
const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID
const DB_ID      = import.meta.env.VITE_APPWRITE_DB_ID
const ISSUES_COL = 'issues'
const ASST_COL   = 'assistants'
const BUCKET_ID  = import.meta.env.VITE_APPWRITE_BUCKET_ID

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID)

export const account   = new Account(client)
export const databases = new Databases(client)
export const storage   = new Storage(client)

// ── Clear any existing session before login ───────────────────────────────────
// Prevents "session limit exceeded" error on repeated logins
async function clearSession() {
  try { await account.deleteSession('current') } catch { /* no session — fine */ }
}

// ── ISSUES ────────────────────────────────────────────────────────────────────

export async function getAllIssues() {
  const res = await databases.listDocuments(DB_ID, ISSUES_COL, [
    Query.orderDesc('$createdAt'), Query.limit(500),
  ])
  return res.documents
}

export async function submitIssue({ name, role, rollOrId, department, title, location, category, priority, description, imageFile }) {
  let imageUrl = ''
  if (imageFile) {
    const uploaded = await storage.createFile(BUCKET_ID, ID.unique(), imageFile)
    imageUrl = storage.getFilePreview(BUCKET_ID, uploaded.$id).toString()
  }
  return await databases.createDocument(DB_ID, ISSUES_COL, ID.unique(), {
    name, role, rollOrId, department, title, location,
    category, priority, description: description || '',
    imageUrl, status: 'Pending Review', assignedTo: '',
  })
}

export async function trackIssues(rollOrId) {
  const res = await databases.listDocuments(DB_ID, ISSUES_COL, [
    Query.equal('rollOrId', rollOrId.trim()),
  ])
  return res.documents
}

export async function updateIssueDoc(docId, changes) {
  return await databases.updateDocument(DB_ID, ISSUES_COL, docId, changes)
}

export async function deleteIssueDoc(docId) {
  return await databases.deleteDocument(DB_ID, ISSUES_COL, docId)
}

// ── ASSISTANTS ────────────────────────────────────────────────────────────────

export async function getAllAssistants() {
  const res = await databases.listDocuments(DB_ID, ASST_COL, [
    Query.orderDesc('$createdAt'),
  ])
  return res.documents
}

export async function signupAssistant({ name, employeeId, category, email, password }) {
  await clearSession()
  const authUser = await account.create(ID.unique(), email, password, name)
  return await databases.createDocument(DB_ID, ASST_COL, ID.unique(), {
    name, employeeId, category, email,
    status: 'Pending',
    authId: authUser.$id,
  })
}

export async function loginAssistant(email, password) {
  await clearSession()   // always wipe old session first
  await account.createEmailPasswordSession(email, password)
  const user = await account.get()
  const res  = await databases.listDocuments(DB_ID, ASST_COL, [
    Query.equal('authId', user.$id),
  ])
  if (!res.documents.length) {
    await clearSession()
    throw new Error('Assistant profile not found.')
  }
  const asst = res.documents[0]
  if (asst.status !== 'Approved') {
    await clearSession()
    throw new Error('Your account is pending admin approval.')
  }
  return asst
}

export async function logoutAssistant() {
  await clearSession()
}

export async function getLoggedInAssistant() {
  try {
    const user = await account.get()
    const res  = await databases.listDocuments(DB_ID, ASST_COL, [
      Query.equal('authId', user.$id),
    ])
    return res.documents[0] || null
  } catch {
    return null
  }
}

export async function approveAssistantDoc(docId) {
  return await databases.updateDocument(DB_ID, ASST_COL, docId, { status: 'Approved' })
}

export async function removeAssistantDoc(docId) {
  return await databases.deleteDocument(DB_ID, ASST_COL, docId)
}

// ── ADMIN AUTH ────────────────────────────────────────────────────────────────

export async function adminLogin(email, password) {
  await clearSession()   // always wipe old session first
  await account.createEmailPasswordSession(email, password)
  return await account.get()
}

export async function adminLogout() {
  await clearSession()
}
