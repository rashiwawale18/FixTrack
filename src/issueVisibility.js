/**
 * Which issues appear on an assistant dashboard:
 * - Rejected: hidden
 * - Assigned to this assistant (by name): visible regardless of issue category (admin can assign cross-team)
 * - Assigned to someone else: hidden
 * - Unassigned: only if issue category matches the assistant's category, and status is still in the open pool
 */
export function issueVisibleToAssistant(issue, me) {
  if (!me || issue.status === 'Rejected') return false
  const assignee = (issue.assignedTo || '').trim()
  if (assignee && assignee === me.name.trim()) return true
  if (assignee) return false
  if (issue.category !== me.category) return false
  return ['Pending Review', 'Accepted'].includes(issue.status)
}
