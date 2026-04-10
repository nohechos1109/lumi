'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function DynamicLogo({ homeHref }: { homeHref: string }) {
  const pathname = usePathname()
  const isCollection = pathname.startsWith('/cobranza') || pathname.startsWith('/ventas')
  const isPayments  = pathname.startsWith('/pagos')

  const src = isPayments ? '/lumi-logo-payments.svg' : isCollection ? '/lumi-logo-collection.svg' : '/lumi-logo.svg'
  const alt = isPayments ? 'LUMI PAYMENTS'           : isCollection ? 'LUMI COLLECTION'           : 'LUMI QUOTES'

  return (
    <Link href={homeHref} className="flex items-center shrink-0">
      <Image
        src={src}
        alt={alt}
        width={150}
        height={46}
        className="object-contain"
        priority
      />
    </Link>
  )
}
