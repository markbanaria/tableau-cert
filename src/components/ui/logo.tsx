import Image from 'next/image'

interface LogoProps {
  className?: string
  width?: number
  height?: number
}

export default function Logo({ className = '', width = 168, height = 40 }: LogoProps) {
  return (
    <Image
      src="/logo.svg"
      alt="AYX Logo"
      width={width}
      height={height}
      className={className}
      priority
      style={{ maxHeight: '24px', width: 'auto', marginLeft: '8px' }}
    />
  )
}