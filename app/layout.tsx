import './globals.css'
import { Fraunces, Inter } from 'next/font/google'

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', axes: ['SOFT', 'opsz'] })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata = {
  title: 'Rooted · Stay rooted at home',
  description:
    'You can’t transplant an old tree. Rooted turns a Ring camera into a quiet guardian so older adults can keep living at home.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="min-h-screen font-sans text-bark antialiased">{children}</body>
    </html>
  )
}
