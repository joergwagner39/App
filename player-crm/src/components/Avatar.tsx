'use client'

import { User } from 'lucide-react'
import { useState } from 'react'

export default function Avatar({
  photoUrl,
  alt,
  className,
  iconClassName,
}: {
  photoUrl?: string
  alt: string
  className: string
  iconClassName: string
}) {
  const [error, setError] = useState(false)

  if (!photoUrl || error) {
    return (
      <div className={className}>
        <User className={iconClassName} />
      </div>
    )
  }

  return (
    <div className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photoUrl}
        alt={alt}
        className="h-full w-full object-cover"
        referrerPolicy="no-referrer"
        onError={() => setError(true)}
      />
    </div>
  )
}
