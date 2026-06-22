'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { ReportsDB } from '@/lib/db';

const navItems = [
  { section: 'DAILY' },
  { href: '/', icon: '🏠', label: 'Dashboard' },
  { href: '/entry', icon: '📝', label: 'New Entry' },
  { href: '/daily', icon: '📊', label: 'Daily View' },
  { href: '/carryover', icon: '🔄', label: 'Carry-Over' },
  { section: 'BROWSE' },
  { href: '/calendar', icon: '📅', label: 'Calendar' },
  { href: '/search', icon: '🔍', label: 'Search' },
  { href: '/issues', icon: '⚠️', label: 'Issues', hasBadge: true },
  { section: 'MANAGE' },
  { href: '/projects', icon: '📦', label: 'Projects' },
  { href: '/members', icon: '👥', label: 'Members' },
  { href: '/export', icon: '📤', label: 'Export' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [issueBadge, setIssueBadge] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);


  useEffect(() => {
    async function loadBadge() {
      try {
        const issues = await ReportsDB.detectRecurringIssues();
        const resolved = JSON.parse(localStorage.getItem('resolvedIssues') || '[]');
        setIssueBadge(issues.filter(i => !resolved.includes(i.keyword)).length);
      } catch (e) {
        // DB not ready yet
      }
    }
    loadBadge();
  }, [pathname]);

  if (pathname === '/login') {
    return null;
  }

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="btn btn-ghost btn-icon mobile-hamburger"
        style={{ position: 'fixed', top: 12, left: 12, zIndex: 200 }}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        ☰
      </button>

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link href="/" className="sidebar-logo" style={{ textDecoration: 'none' }}>
            <div className="sidebar-logo-icon">📋</div>
            <div>
              <h1>StandupTracker</h1>
              <span>Team Reports</span>
            </div>
          </Link>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, idx) => {
            if (item.section === 'MANAGE' && session?.user?.role !== 'ADMIN') {
              return null;
            }
            if ((item.href === '/projects' || item.href === '/members' || item.href === '/export') && session?.user?.role !== 'ADMIN') {
              return null;
            }

            if (item.section) {
              return <div key={idx} className="sidebar-section-label">{item.section}</div>;
            }

            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
                {item.hasBadge && issueBadge > 0 && (
                  <span className="nav-badge">{issueBadge}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {session ? (
          <div style={{ padding: 'var(--sp-md)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', paddingLeft: '4px' }}>
              Logged in as <strong>{session.user.name}</strong>
            </div>
            <button
              className="btn btn-ghost"
              style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger)' }}
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <span className="nav-icon">🚪</span> Sign Out
            </button>
          </div>
        ) : (
          <div style={{ padding: 'var(--sp-md)' }}>
            <Link href="/login" className="btn btn-lime" style={{ width: '100%', justifyContent: 'center' }}>
              Sign In
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
