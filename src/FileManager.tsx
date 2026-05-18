import { useState, useEffect, useRef, useCallback } from 'react'

interface FileEntry {
  name: string
  size: number
  modified: number
  isDir: boolean
  isLink: boolean
  permissions: string
}

interface FileManagerProps {
  backendUrl: string
  host: string
  port: number
  username: string
  password: string
  privateKey: string
  authMode: 'password' | 'key'
  onClose: () => void
}

const CHUNK_SIZE = 512 * 1024 // 512KB

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatDate(ts: number): string {
  if (!ts) return '—'
  const d = new Date(ts * 1000)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function getFileIcon(name: string, isDir: boolean, isLink: boolean): string {
  if (isDir) return '\u{1F4C1}'
  if (isLink) return '\u{1F517}'
  const ext = name.split('.').pop()?.toLowerCase() || ''
  const icons: Record<string, string> = {
    jpg: '\u{1F5BC}\u{FE0F}', jpeg: '\u{1F5BC}\u{FE0F}', png: '\u{1F5BC}\u{FE0F}', gif: '\u{1F5BC}\u{FE0F}', svg: '\u{1F5BC}\u{FE0F}', webp: '\u{1F5BC}\u{FE0F}',
    mp4: '\u{1F3AC}', mkv: '\u{1F3AC}', avi: '\u{1F3AC}', mov: '\u{1F3AC}',
    mp3: '\u{1F3B5}', wav: '\u{1F3B5}', flac: '\u{1F3B5}', ogg: '\u{1F3B5}',
    zip: '\u{1F4E6}', tar: '\u{1F4E6}', gz: '\u{1F4E6}', bz2: '\u{1F4E6}', xz: '\u{1F4E6}', '7z': '\u{1F4E6}', rar: '\u{1F4E6}',
    pdf: '\u{1F4D5}', doc: '\u{1F4D5}', docx: '\u{1F4D5}',
    sh: '\u{1F4DC}', bash: '\u{1F4DC}', py: '\u{1F4DC}', js: '\u{1F4DC}', ts: '\u{1F4DC}', json: '\u{1F4DC}', yml: '\u{1F4DC}', yaml: '\u{1F4DC}',
    conf: '\u{2699}\u{FE0F}', cfg: '\u{2699}\u{FE0F}', ini: '\u{2699}\u{FE0F}', env: '\u{2699}\u{FE0F}',
    log: '\u{1F4CB}', txt: '\u{1F4CB}', md: '\u{1F4CB}',
    key: '\u{1F511}', pem: '\u{1F511}', crt: '\u{1F4DC}', cert: '\u{1F4DC}',
  }
  return icons[ext] || '\u{1F4C4}'
}

let reqCounter = 0
function nextReqId(): string {
  return 'req-' + (++reqCounter)
}

export default function FileManager({ backendUrl, host, port, username, password, privateKey, authMode, onClose }: FileManagerProps) {
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(true)
  const [error, setError] = useState('')
  const [currentPath, setCurrentPath] = useState('/')
  const [files, setFiles] = useState<FileEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [transferProgress, setTransferProgress] = useState<{ name: string; progress: number; type: 'upload' | 'download' } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<FileEntry | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const pendingRef = useRef<Map<string, (data: Record<string, unknown>) => void>>(new Map())
  const downloadChunksRef = useRef<Map<string, Uint8Array[]>>(new Map())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sendRequest = useCallback((msg: Record<string, unknown>): Promise<Record<string, unknown>> => {
    return new Promise((resolve, reject) => {
      const id = nextReqId()
      const ws = wsRef.current
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        reject(new Error('Not connected'))
        return
      }
      pendingRef.current.set(id, resolve)
      ws.send(JSON.stringify({ ...msg, id }))
      setTimeout(() => {
        if (pendingRef.current.has(id)) {
          pendingRef.current.delete(id)
          reject(new Error('Request timeout'))
        }
      }, 30000)
    })
  }, [])

  const listDir = useCallback(async (path: string) => {
    setLoading(true)
    setSelectedFiles(new Set())
    try {
      const result = await sendRequest({ action: 'list', path })
      setFiles(result.data as FileEntry[])
      setCurrentPath(path)
    } catch (e) {
      setError('Failed to list directory: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setLoading(false)
    }
  }, [sendRequest])

  // Connect on mount
  useEffect(() => {
    const wsUrl = backendUrl.replace(/^http/, 'ws').replace(/\/$/, '') + '/ws/sftp'
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({
        host,
        port,
        username,
        password: authMode === 'password' ? password : '',
        privateKey: authMode === 'key' ? privateKey : '',
      }))
    }

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type === 'connected') {
        setConnected(true)
        setConnecting(false)
      } else if (msg.type === 'status') {
        // connecting status
      } else if (msg.type === 'error' && !msg.id) {
        setError(msg.data)
        setConnecting(false)
      } else if (msg.type === 'error' && msg.id) {
        const handler = pendingRef.current.get(msg.id)
        if (handler) {
          pendingRef.current.delete(msg.id)
          // Call with error indicator
          handler({ _error: true, data: msg.data })
        }
      } else if (msg.type === 'result') {
        if (msg.action === 'download_chunk') {
          const reqId = msg.id as string
          if (!downloadChunksRef.current.has(reqId)) {
            downloadChunksRef.current.set(reqId, [])
          }
          const decoded = Uint8Array.from(atob(msg.data as string), c => c.charCodeAt(0))
          downloadChunksRef.current.get(reqId)!.push(decoded)
          const progress = Math.round(((msg.chunk as number) + 1) / (msg.totalChunks as number) * 100)
          setTransferProgress(prev => prev ? { ...prev, progress } : null)
        } else if (msg.action === 'download_complete') {
          const reqId = msg.id as string
          const chunks = downloadChunksRef.current.get(reqId) || []
          downloadChunksRef.current.delete(reqId)
          const handler = pendingRef.current.get(reqId)
          if (handler) {
            pendingRef.current.delete(reqId)
            const totalLen = chunks.reduce((acc, c) => acc + c.length, 0)
            const combined = new Uint8Array(totalLen)
            let offset = 0
            for (const chunk of chunks) {
              combined.set(chunk, offset)
              offset += chunk.length
            }
            handler({ data: combined, path: msg.path })
          }
        } else if (msg.action === 'upload_progress') {
          const progress = Math.round(((msg.chunk as number) + 1) / (msg.totalChunks as number) * 100)
          setTransferProgress(prev => prev ? { ...prev, progress } : null)
        } else if (msg.action === 'upload_complete') {
          const handler = pendingRef.current.get(msg.id)
          if (handler) {
            pendingRef.current.delete(msg.id)
            handler(msg)
          }
        } else {
          const handler = pendingRef.current.get(msg.id)
          if (handler) {
            pendingRef.current.delete(msg.id)
            handler(msg)
          }
        }
      }
    }

    ws.onerror = () => {
      setError('Connection failed. Check backend URL.')
      setConnecting(false)
    }

    ws.onclose = () => {
      setConnected(false)
      setConnecting(false)
    }

    return () => {
      ws.close()
    }
  }, [backendUrl, host, port, username, password, privateKey, authMode])

  // List root dir when connected
  useEffect(() => {
    if (connected) {
      listDir('/')
    }
  }, [connected, listDir])

  const navigateTo = (path: string) => {
    listDir(path)
  }

  const navigateUp = () => {
    if (currentPath === '/') return
    const parts = currentPath.split('/').filter(Boolean)
    parts.pop()
    navigateTo('/' + parts.join('/') || '/')
  }

  const handleFileClick = (file: FileEntry) => {
    if (file.isDir) {
      const newPath = currentPath === '/' ? '/' + file.name : currentPath + '/' + file.name
      navigateTo(newPath)
    }
  }

  const toggleSelect = (name: string) => {
    setSelectedFiles(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const handleDownload = async (file: FileEntry) => {
    const filePath = currentPath === '/' ? '/' + file.name : currentPath + '/' + file.name
    setTransferProgress({ name: file.name, progress: 0, type: 'download' })
    try {
      const result = await sendRequest({ action: 'download', path: filePath })
      if ((result as Record<string, unknown>)._error) {
        setError('Download failed: ' + (result as Record<string, unknown>).data)
        return
      }
      const data = result.data as Uint8Array
      const blob = new Blob([data])
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      setError('Download failed: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setTransferProgress(null)
    }
  }

  const handleUploadFiles = async (fileList: FileList) => {
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      setTransferProgress({ name: file.name, progress: 0, type: 'upload' })
      const targetPath = currentPath === '/' ? '/' + file.name : currentPath + '/' + file.name
      try {
        const arrayBuf = await file.arrayBuffer()
        const bytes = new Uint8Array(arrayBuf)
        const totalChunks = Math.max(1, Math.ceil(bytes.length / CHUNK_SIZE))
        const reqId = nextReqId()

        for (let c = 0; c < totalChunks; c++) {
          const start = c * CHUNK_SIZE
          const end = Math.min(start + CHUNK_SIZE, bytes.length)
          const chunk = bytes.slice(start, end)
          let binary = ''
          for (let j = 0; j < chunk.length; j++) {
            binary += String.fromCharCode(chunk[j])
          }
          const encoded = btoa(binary)

          const isLast = c + 1 >= totalChunks
          const ws = wsRef.current
          if (!ws || ws.readyState !== WebSocket.OPEN) throw new Error('Disconnected')

          if (isLast) {
            // Wait for upload_complete
            await new Promise<void>((resolve, reject) => {
              pendingRef.current.set(reqId, () => resolve())
              ws.send(JSON.stringify({
                action: 'upload_chunk',
                id: reqId,
                path: targetPath,
                data: encoded,
                chunk: c,
                totalChunks,
              }))
              setTimeout(() => {
                if (pendingRef.current.has(reqId)) {
                  pendingRef.current.delete(reqId)
                  reject(new Error('Upload timeout'))
                }
              }, 60000)
            })
          } else {
            ws.send(JSON.stringify({
              action: 'upload_chunk',
              id: reqId,
              path: targetPath,
              data: encoded,
              chunk: c,
              totalChunks,
            }))
            setTransferProgress({ name: file.name, progress: Math.round((c + 1) / totalChunks * 100), type: 'upload' })
          }
        }
      } catch (e) {
        setError('Upload failed: ' + (e instanceof Error ? e.message : String(e)))
      }
    }
    setTransferProgress(null)
    listDir(currentPath)
  }

  const handleDelete = async (file: FileEntry) => {
    const filePath = currentPath === '/' ? '/' + file.name : currentPath + '/' + file.name
    try {
      await sendRequest({ action: 'delete', path: filePath, isDir: file.isDir })
      setConfirmDelete(null)
      listDir(currentPath)
    } catch (e) {
      setError('Delete failed: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  const handleRename = async (oldName: string) => {
    if (!renameValue || renameValue === oldName) {
      setRenaming(null)
      return
    }
    const oldPath = currentPath === '/' ? '/' + oldName : currentPath + '/' + oldName
    const newPath = currentPath === '/' ? '/' + renameValue : currentPath + '/' + renameValue
    try {
      await sendRequest({ action: 'rename', oldPath, newPath })
      setRenaming(null)
      listDir(currentPath)
    } catch (e) {
      setError('Rename failed: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName) return
    const dirPath = currentPath === '/' ? '/' + newFolderName : currentPath + '/' + newFolderName
    try {
      await sendRequest({ action: 'mkdir', path: dirPath })
      setShowNewFolder(false)
      setNewFolderName('')
      listDir(currentPath)
    } catch (e) {
      setError('Create folder failed: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files)
    }
  }

  const breadcrumbs = currentPath === '/' ? ['/'] : ['/', ...currentPath.split('/').filter(Boolean)]

  if (connecting) {
    return (
      <div className="fixed inset-0 z-[60] bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mb-4 mx-auto" />
          <p className="text-slate-400 text-sm">Connecting to File Manager...</p>
        </div>
      </div>
    )
  }

  if (!connected && error) {
    return (
      <div className="fixed inset-0 z-[60] bg-slate-950 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm hover:bg-slate-700">Close</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950 flex flex-col"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}>

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/95 border-b border-slate-800/40 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse flex-shrink-0" />
          <span className="text-xs font-mono text-slate-400 truncate">
            {username}@{host} &mdash; File Manager
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => listDir(currentPath)} className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-medium transition-colors" title="Refresh">
            Refresh
          </button>
          <button onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors ml-1" title="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-3 py-2 bg-slate-900/70 border-b border-slate-800/30 flex items-center gap-2 flex-wrap">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto">
          {breadcrumbs.map((part, i) => (
            <button key={i}
              onClick={() => {
                if (i === 0) navigateTo('/')
                else navigateTo('/' + breadcrumbs.slice(1, i + 1).join('/'))
              }}
              className="text-xs text-slate-400 hover:text-cyan-400 transition-colors whitespace-nowrap flex-shrink-0">
              {i === 0 ? '\u{1F4C1} /' : part}
              {i < breadcrumbs.length - 1 && <span className="text-slate-600 mx-0.5">/</span>}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={navigateUp} disabled={currentPath === '/'}
            className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-medium transition-colors disabled:opacity-30">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
          </button>
          <button onClick={() => setShowNewFolder(true)}
            className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-medium transition-colors" title="New Folder">
            + Folder
          </button>
          <button onClick={() => fileInputRef.current?.click()}
            className="px-2 py-1 rounded-md bg-cyan-900/50 hover:bg-cyan-800/50 text-cyan-300 text-xs font-medium transition-colors" title="Upload Files">
            Upload
          </button>
          <input ref={fileInputRef} type="file" multiple className="hidden"
            onChange={(e) => { if (e.target.files) handleUploadFiles(e.target.files); e.target.value = '' }} />
        </div>
      </div>

      {/* New Folder Dialog */}
      {showNewFolder && (
        <div className="px-3 py-2 bg-slate-800/80 border-b border-slate-700/40 flex items-center gap-2">
          <input type="text" placeholder="Folder name..." value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') setShowNewFolder(false) }}
            autoFocus
            className="flex-1 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50" />
          <button onClick={handleCreateFolder} className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-400 text-xs font-medium">Create</button>
          <button onClick={() => { setShowNewFolder(false); setNewFolderName('') }} className="px-2 py-1 rounded bg-slate-700 text-slate-400 text-xs">Cancel</button>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="px-3 py-2 bg-red-950/40 border-b border-red-900/30 flex items-center justify-between">
          <p className="text-xs text-red-400">{error}</p>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-300 ml-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Transfer progress */}
      {transferProgress && (
        <div className="px-3 py-2 bg-slate-800/80 border-b border-slate-700/40">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-400">{transferProgress.type === 'upload' ? 'Uploading' : 'Downloading'}: {transferProgress.name}</span>
            <span className="text-xs text-cyan-400 font-mono">{transferProgress.progress}%</span>
          </div>
          <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-300" style={{ width: `${transferProgress.progress}%` }} />
          </div>
        </div>
      )}

      {/* Drag overlay */}
      {dragOver && (
        <div className="absolute inset-0 z-10 bg-cyan-500/10 border-2 border-dashed border-cyan-400/50 flex items-center justify-center pointer-events-none">
          <p className="text-cyan-400 text-lg font-bold">Drop files here to upload</p>
        </div>
      )}

      {/* File list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <span className="text-3xl mb-2">{'\u{1F4C2}'}</span>
            <p className="text-sm">Empty directory</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 uppercase border-b border-slate-800/40">
                <th className="text-left px-3 py-2 font-medium">Name</th>
                <th className="text-right px-3 py-2 font-medium hidden sm:table-cell">Size</th>
                <th className="text-right px-3 py-2 font-medium hidden md:table-cell">Modified</th>
                <th className="text-right px-3 py-2 font-medium hidden lg:table-cell">Perms</th>
                <th className="text-right px-3 py-2 font-medium w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.name}
                  className={`border-b border-slate-800/20 hover:bg-slate-800/30 transition-colors ${selectedFiles.has(file.name) ? 'bg-cyan-950/20' : ''}`}>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <input type="checkbox" checked={selectedFiles.has(file.name)}
                        onChange={() => toggleSelect(file.name)}
                        className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-0 flex-shrink-0 cursor-pointer" />
                      {renaming === file.name ? (
                        <input type="text" value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleRename(file.name); if (e.key === 'Escape') setRenaming(null) }}
                          onBlur={() => handleRename(file.name)}
                          autoFocus
                          className="flex-1 px-1 py-0.5 rounded bg-slate-800 border border-cyan-500/50 text-sm text-slate-200 focus:outline-none min-w-0" />
                      ) : (
                        <button onClick={() => handleFileClick(file)}
                          className={`flex items-center gap-1.5 min-w-0 ${file.isDir ? 'text-cyan-400 hover:text-cyan-300' : 'text-slate-300 hover:text-slate-100'} transition-colors`}>
                          <span className="flex-shrink-0">{getFileIcon(file.name, file.isDir, file.isLink)}</span>
                          <span className="truncate">{file.name}</span>
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right text-slate-500 text-xs whitespace-nowrap hidden sm:table-cell">
                    {file.isDir ? '—' : formatSize(file.size)}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-500 text-xs whitespace-nowrap hidden md:table-cell">
                    {formatDate(file.modified)}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-600 text-xs font-mono hidden lg:table-cell">
                    {file.permissions}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      {!file.isDir && (
                        <button onClick={() => handleDownload(file)} title="Download"
                          className="p-1 rounded text-slate-500 hover:text-cyan-400 hover:bg-slate-800 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </button>
                      )}
                      <button onClick={() => { setRenaming(file.name); setRenameValue(file.name) }} title="Rename"
                        className="p-1 rounded text-slate-500 hover:text-amber-400 hover:bg-slate-800 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => setConfirmDelete(file)} title="Delete"
                        className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 bg-slate-900/95 border-t border-slate-800/40 flex items-center justify-between text-xs text-slate-500">
        <span>{files.length} items</span>
        <span>{currentPath}</span>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-slate-900 border border-slate-700/60 rounded-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Delete {confirmDelete.isDir ? 'Folder' : 'File'}?</h3>
            <p className="text-sm text-slate-400 mb-4">
              Are you sure you want to delete <strong className="text-slate-200">{confirmDelete.name}</strong>?
              {confirmDelete.isDir && ' This will delete all contents inside it.'}
            </p>
            <div className="flex gap-2">
              <button onClick={() => handleDelete(confirmDelete)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold text-sm hover:shadow-lg transition-all">
                Delete
              </button>
              <button onClick={() => setConfirmDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-400 text-sm font-semibold hover:bg-slate-700 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
