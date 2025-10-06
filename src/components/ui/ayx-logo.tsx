interface AYXLogoProps {
  className?: string
}

export default function AYXLogo({ className = '' }: AYXLogoProps) {
  return (
    <div className={`flex items-center px-2 py-1 rounded-lg bg-gradient-to-br from-emerald-400 via-[#3DA17B] to-teal-600 ${className}`}>
      <span className="text-white font-extrabold text-md">AYX</span>
    </div>
  )
}
