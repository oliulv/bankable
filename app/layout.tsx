import "./globals.css"
import { Inter } from "next/font/google"
import type React from "react"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Bankable",
  description: "Take Control of Tomorrow, Today",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex justify-center items-center min-h-screen bg-gray-100`}>
        <div className="w-[390px] h-[750px] overflow-hidden shadow-xl">{children}</div>
      </body>
    </html>
  )
}



import './globals.css'