'use client';

import { Bell, Search, UserCircle, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
    const userInfo = localStorage.getItem('user_info');
    if (userInfo) {
      try {
        setUser(JSON.parse(userInfo));
      } catch (e) {
        console.error("Error parsing user info in Header", e);
      }
    }
  }, [pathname]);

  if (!isMounted || pathname === '/login') return null;

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20">
      <div className="flex items-center gap-4 flex-1">
        {/* Botón de Menú Móvil */}
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>

        <div className="flex items-center gap-4 bg-slate-100 px-4 py-2 rounded-lg w-full max-w-[400px]">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3 lg:gap-6 ml-4">
        <button className="relative text-slate-500 hover:text-primary transition-colors p-2">
          <Bell size={22} />
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white font-bold">
            3
          </span>
        </button>
        <div className="flex items-center gap-3 border-l pl-4 lg:pl-6 border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-700 truncate max-w-[120px]">
              {user?.email ? (user.email.split('@')[0]) : 'Gestor'}
            </p>
            <p className="text-[10px] text-slate-500">ID: {user?.gestor || '---'}</p>
          </div>
          <UserCircle size={32} className="text-slate-400 shrink-0" />
        </div>
      </div>
    </header>
  );
}
