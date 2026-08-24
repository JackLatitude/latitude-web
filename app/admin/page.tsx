'use client'
import { useState } from 'react'

// Local-development tool. /api/gallery 404s in production (the deployed
// filesystem is read-only), so uploads land in the working tree and then need
// committing — the gallery manifest is rebuilt from public/gallery/ at build.
export default function AdminUpload() {
  const [dragging, setDragging] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  const upload = async (files: FileList | File[]) => {
    setUploading(true)
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      try {
        const res = await fetch('/api/gallery', { method: 'POST', body: fd })
        const data = await res.json().catch(() => ({}))
        setLog(l => [
          res.ok ? `✓ ${file.name}` : `✗ ${file.name} — ${data.error || res.status}`,
          ...l,
        ])
      } catch {
        setLog(l => [`✗ ${file.name} — network error`, ...l])
      }
    }
    setUploading(false)
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <h1
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: '#ED2643',
            margin: '0 0 2rem',
          }}
        >
          Gallery Upload
        </h1>

        <p
          style={{
            fontSize: '0.7rem',
            lineHeight: 1.6,
            color: '#888',
            margin: '0 0 1.5rem',
          }}
        >
          Local only. Uploads are written to public/gallery/ in your working
          tree — commit them to publish.
        </p>

        <label
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => {
            e.preventDefault()
            setDragging(false)
            if (e.dataTransfer.files.length) upload(e.dataTransfer.files)
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '160px',
            border: `1px dashed ${dragging ? '#ED2643' : '#2A2A2A'}`,
            borderRadius: '4px',
            color: uploading ? '#555' : '#888',
            fontSize: '0.7rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            cursor: uploading ? 'wait' : 'pointer',
            transition: 'border-color 0.15s ease',
            marginBottom: '1.5rem',
          }}
        >
          {uploading ? 'Uploading…' : 'Drop photos or click to browse'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={uploading}
            style={{ display: 'none' }}
            onChange={e => e.target.files?.length && upload(e.target.files)}
          />
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {log.map((line, i) => (
            <p
              key={i}
              style={{
                margin: 0,
                fontSize: '0.75rem',
                color: line.startsWith('✓') ? '#22C55E' : '#ED2643',
              }}
            >
              {line}
            </p>
          ))}
        </div>
      </div>
    </main>
  )
}
