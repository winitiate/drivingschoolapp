// src/layouts/PublicLayout.tsx

import React from "react"
import Header from "../components/Layout/Header"
import Footer from "../components/Layout/Footer"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4">{children}</main>
      <Footer />
    </div>
  )
}
