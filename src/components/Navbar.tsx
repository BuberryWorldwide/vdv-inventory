'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/machines', label: 'Machines' },
  { href: '/dashboard/maintenance', label: 'Maintenance' },
  { href: '/dashboard/stores', label: 'Stores' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    api.logout();
    router.push('/');
  };

  return (
    <nav className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 md:h-16">
          <span className="font-bold text-lg md:text-xl">VDV</span>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded text-sm font-medium ${
                  pathname === item.href
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="text-gray-300 hover:text-white text-sm ml-4"
            >
              Logout
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded hover:bg-gray-700"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-3 rounded text-base font-medium ${
                  pathname === item.href
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="block w-full text-left px-3 py-3 text-gray-300 hover:bg-gray-700 rounded text-base"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
