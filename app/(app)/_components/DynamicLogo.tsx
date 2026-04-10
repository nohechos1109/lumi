'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function DynamicLogo({ homeHref }: { homeHref: string }) {
  const pathname = usePathname()
  const isCollection = pathname.startsWith('/ventas')

  return (
    <Link href={homeHref} className="flex items-center shrink-0">
      <Image
        src={isCollection ? '/lumi-logo-collection.svg' : '/lumi-logo.svg'}
        alt={isCollection ? 'LUMI COLLECTION' : 'LUMI QUOTES'}
        width={150}
        height={46}
        className="object-contain"
        priority
      />
    </Link>
  )
}
