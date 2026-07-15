'use client'
import { useState } from 'react'

export default function AdminUpload() {
  const [key, setKey] = useState('')
  const [dragging, setDragging] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  const upload = async (files: FileList | File[]) => {
    setUploading(true)
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      try {
        const res = await fetch('/api/gallery', {
          method: 'POST',
          headers: { 'x-gallery-key': key },
          body: fd,
        })
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

        <input
          type="password"
          placeholder="Upload key"
          value={key}
          onChange={e => setKey(e.target.value)}
          style={{
            width: '100%',
            background: '#111111',
            border: '1px solid #2A2A2A',
            borderRadius: '2px',
            color: '#fff',
            fontSize: '0.85rem',
            padding: '0.875rem 1rem',
            fontFamily: 'inherit',
            outline: 'none',
            marginBottom: '1rem',
          }}
        />

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
