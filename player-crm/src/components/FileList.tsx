'use client'

import { UploadedFile } from '@/lib/types'
import { FileText, Trash2, Upload } from 'lucide-react'

// avoid shadowing the DOM FileList type with our own component name
type FileList_ = globalThis.FileList

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function FileList({
  files,
  onChange,
  label = 'Datei hochladen',
}: {
  files: UploadedFile[]
  onChange: (files: UploadedFile[]) => void
  label?: string
}) {
  async function handleUpload(fileList: FileList_ | null) {
    if (!fileList) return
    const uploaded: UploadedFile[] = []
    for (const file of Array.from(fileList)) {
      const dataUrl = await fileToDataUrl(file)
      uploaded.push({ id: crypto.randomUUID(), name: file.name, dataUrl })
    }
    onChange([...files, ...uploaded])
  }

  function removeFile(id: string) {
    onChange(files.filter((f) => f.id !== id))
  }

  return (
    <div>
      {files.length > 0 && (
        <ul className="mb-2 space-y-1">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs"
            >
              <FileText className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <a
                href={f.dataUrl}
                download={f.name}
                className="flex-1 truncate text-slate-600 hover:text-brand-700 hover:underline"
              >
                {f.name}
              </a>
              <button onClick={() => removeFile(f.id)}>
                <Trash2 className="h-3.5 w-3.5 text-slate-400 hover:text-red-500" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <label className="flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
        <Upload className="h-3.5 w-3.5" />
        {label}
        <input
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </label>
    </div>
  )
}
