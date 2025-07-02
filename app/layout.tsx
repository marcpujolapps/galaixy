import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Galaixy',
  description: 'Galaixy',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
