'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, CheckCircle, AlertCircle, X, FileText, Loader2 } from 'lucide-react'
import type { GarminActivityData, GarminDailyData } from '@/types'

interface FitUploadProps {
  onDataLoaded: (activities: GarminActivityData[], daily: GarminDailyData[]) => void
}

interface UploadState {
  status: 'idle' | 'uploading' | 'success' | 'error'
  message?: string
  fileCount?: number
}

export default function FitUpload({ onDataLoaded }: FitUploadProps) {
  const [state, setState] = useState<UploadState>({ status: 'idle' })
  const [dragOver, setDragOver] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback((files: File[]) => {
    const fitFiles = files.filter((f) => f.name.toLowerCase().endsWith('.fit'))
    if (!fitFiles.length) {
      setState({ status: 'error', message: 'Nur .fit Dateien werden unterstützt' })
      return
    }
    setSelectedFiles(fitFiles)
    setState({ status: 'idle' })
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(Array.from(e.dataTransfer.files))
  }, [handleFiles])

  async function upload() {
    if (!selectedFiles.length) return

    setState({ status: 'uploading' })

    try {
      const formData = new FormData()
      selectedFiles.forEach((f) => formData.append('files', f))

      const res = await fetch('/api/fit-upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? 'Upload fehlgeschlagen')

      onDataLoaded(data.activities, data.daily)
      setState({ status: 'success', fileCount: data.fileCount, message: `${data.activities.length} Aktivitäten geladen` })
    } catch (e) {
      setState({ status: 'error', message: e instanceof Error ? e.message : 'Unbekannter Fehler' })
    }
  }

  function reset() {
    setSelectedFiles([])
    setState({ status: 'idle' })
  }

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium text-white">Garmin FIT-Dateien importieren</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Aus der Garmin Connect App exportieren → hier hochladen
          </p>
        </div>
        {selectedFiles.length > 0 && (
          <button onClick={reset} className="text-gray-500 hover:text-gray-300">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* How-to hint */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4 text-xs text-blue-300">
        <strong>So exportierst du in der Garmin Connect App:</strong><br />
        Aktivität öffnen → ··· Menü → <em>Aktivität exportieren</em> → <em>.fit</em> wählen
      </div>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-blue-400 bg-blue-500/10'
            : selectedFiles.length
            ? 'border-blue-500/50 bg-blue-500/5'
            : 'border-gray-700 hover:border-gray-500 hover:bg-gray-800/30'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".fit"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(Array.from(e.target.files ?? []))}
        />

        {selectedFiles.length > 0 ? (
          <div>
            <FileText className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-sm text-white font-medium">
              {selectedFiles.length} {selectedFiles.length === 1 ? 'Datei' : 'Dateien'} ausgewählt
            </p>
            <ul className="mt-2 space-y-0.5">
              {selectedFiles.slice(0, 5).map((f) => (
                <li key={f.name} className="text-xs text-gray-400">{f.name}</li>
              ))}
              {selectedFiles.length > 5 && (
                <li className="text-xs text-gray-500">+{selectedFiles.length - 5} weitere…</li>
              )}
            </ul>
          </div>
        ) : (
          <div>
            <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <p className="text-sm text-gray-300">FIT-Dateien hier ablegen</p>
            <p className="text-xs text-gray-500 mt-1">oder tippen zum Auswählen</p>
          </div>
        )}
      </div>

      {/* Status */}
      {state.status === 'success' && (
        <div className="flex items-center gap-2 mt-3 text-emerald-400 text-sm">
          <CheckCircle className="w-4 h-4" />
          {state.message}
        </div>
      )}
      {state.status === 'error' && (
        <div className="flex items-center gap-2 mt-3 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {state.message}
        </div>
      )}

      {/* Upload button */}
      {selectedFiles.length > 0 && state.status !== 'success' && (
        <button
          onClick={upload}
          disabled={state.status === 'uploading'}
          className="mt-3 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          {state.status === 'uploading' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Wird verarbeitet…
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              {selectedFiles.length} {selectedFiles.length === 1 ? 'Datei' : 'Dateien'} importieren
            </>
          )}
        </button>
      )}
    </div>
  )
}
