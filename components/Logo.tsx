import Image from 'next/image'

interface LogoProps {
  /** Width of the logo in px. Height scales proportionally (logo is roughly square). */
  width?: number
  /** Extra Tailwind / CSS class names */
  className?: string
}

/**
 * XPLORA brand logo.
 * Place your logo image at /public/logo.png (or .svg).
 */
export default function Logo({ width = 120, className = '' }: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="XPLORA - Explore. Plan. Experience."
      width={width}
      height={width} // logo is roughly square
      priority
      className={`object-contain ${className}`}
    />
  )
}
