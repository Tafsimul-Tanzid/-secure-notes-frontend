'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = user.role === 'admin';

  const navLink = (href, label) => (
    <Link href={href} className={`nav-link ${pathname === href ? 'active' : ''}`}>
      {label}
    </Link>
  );

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link href="/notes" className="brand">
          <span className="logo">SN</span> Secure Notes
        </Link>
        <nav className="nav">
          {navLink('/notes', 'Notes')}
          {isAdmin && navLink('/users', 'Users')}
        </nav>
        <div className="user-menu">
          <span className="avatar">{user.name.trim().charAt(0).toUpperCase()}</span>
          <span className="user-name">{user.name}</span>
          <span className={isAdmin ? 'badge badge-admin' : 'badge'}>{user.role}</span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              logout();
              router.replace('/login');
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
