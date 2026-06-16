'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

// Componente interno que maneja el layout real
function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isLoginPage = pathname === '/login';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {!isLoginPage && (
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
      )}
      <div className={`flex-1 flex flex-col min-w-0 ${isLoginPage ? 'ml-0' : 'lg:ml-64'} overflow-hidden`}>
        {!isLoginPage && (
          <Header onMenuClick={() => setSidebarOpen(true)} />
        )}
        <main className={`flex-1 overflow-y-auto ${isLoginPage ? 'p-0' : 'p-4 lg:p-8'}`}>
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// El export principal que RootLayout usará
export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="h-screen bg-slate-50" />;
  }

  return <LayoutContent>{children}</LayoutContent>;
}
