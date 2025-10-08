import Image from 'next/image'

interface LogoReverseProps {
  className?: string
  width?: number
  height?: number
}

export default function LogoReverse({ className = '', width = 168, height = 32 }: LogoReverseProps) {
  return (
    <Image
      src="/logo-reverse.svg"
      alt="AYX Logo"
      width={width}
      height={height}
      className={`max-h-8 w-auto ${className}`}
      priority
    />
  )
}