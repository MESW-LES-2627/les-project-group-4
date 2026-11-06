import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import type { ReactNode } from 'react'

import { AppHeader } from '@/components/layout/AppHeader'

import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'FurniMi - Create a room',
  description: 'Plan your room before you buy.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <div className="flex min-h-screen flex-col bg-background">
          <AppHeader />
          {children}
        </div>
      </body>
    </html>
  )
}
