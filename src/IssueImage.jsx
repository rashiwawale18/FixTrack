import { useState, useEffect, useRef } from 'react'
import { storage, BUCKET_ID } from './appwrite.js'

/** Parse Appwrite storage file id from a preview/view URL saved on the issue. */
export function extractStorageFileIdFromUrl(url) {
  if (!url || typeof url !== 'string') return null
  const m = url.match(/\/files\/([^/]+)\/(preview|view)/)
  return m ? m[1] : null
}

function previewHref(fileId) {
  if (!fileId) return ''
  const u = storage.getFilePreview(BUCKET_ID, fileId, 1200, 1200)
  return u instanceof URL ? u.href : String(u)
}

/**
 * Renders issue attachment images. Plain <img src> often fails for Appwrite (cookies not sent
 * cross-origin). On error we retry with fetch(..., { credentials: 'include' }) and a blob URL.
 */
export default function IssueImage({ issue, style, className }) {
  const fileId = issue?.imageFileId || extractStorageFileIdFromUrl(issue?.imageUrl)
  const [src, setSrc] = useState(() => issue?.imageUrl || (fileId ? previewHref(fileId) : ''))
  const triedRef = useRef(false)

  useEffect(() => {
    triedRef.current = false
    const next = issue?.imageUrl || (fileId ? previewHref(fileId) : '')
    setSrc(next)
  }, [issue?.$id, issue?.imageUrl, fileId])

  useEffect(() => {
    return () => {
      if (src && src.startsWith('blob:')) URL.revokeObjectURL(src)
    }
  }, [src])

  async function handleError() {
    if (triedRef.current || !fileId) return
    triedRef.current = true
    try {
      const res = await fetch(previewHref(fileId), { credentials: 'include', mode: 'cors' })
      if (!res.ok) return
      const blob = await res.blob()
      setSrc(prev => {
        if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev)
        return URL.createObjectURL(blob)
      })
    } catch {
      /* keep broken state */
    }
  }

  if (!issue?.imageUrl && !fileId) return null

  return (
    <img
      src={src}
      alt="Issue attachment"
      style={style}
      className={className}
      onError={handleError}
    />
  )
}
