'use client';

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

  const handleLogout = () => {
    api.logout();
    router.push('/');
  };

  return (
    <nav className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <span className="font-bold text-xl">VDV Inventory</span>
            <div className="flex space-x-4">
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
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-300 hover:text-white text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
