import React, { useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const currentTheme = document.documentElement.getAttribute("data-theme");
    if (!currentTheme) {
      document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex justify-center px-4">
        <div className="w-full max-w-4xl py-8">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
