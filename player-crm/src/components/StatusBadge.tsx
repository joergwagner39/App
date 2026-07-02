type Color = 'green' | 'yellow' | 'red'

const styles: Record<Color, string> = {
  green: 'bg-green-100 text-green-700 border-green-300',
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  red: 'bg-red-100 text-red-700 border-red-300',
}

const dotStyles: Record<Color, string> = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
}

export default function StatusBadge({
  color,
  label,
}: {
  color: Color
  label: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${styles[color]}`}
    >
      <span className={`h-2 w-2 rounded-full ${dotStyles[color]}`} />
      {label}
    </span>
  )
}
