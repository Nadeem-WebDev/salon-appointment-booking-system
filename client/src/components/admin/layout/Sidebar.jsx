import React from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut, ArrowLeft, X } from 'lucide-react';
import { Button, cx } from '../../ui/index.js';
import logo from '../../../assets/logo.svg';

function NavItem({ to, icon: Icon, label, onNavigate }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cx(
          'relative flex items-center gap-3 px-3 h-10 rounded-[var(--radius-sm)] no-underline',
          'text-sm font-medium transition-all duration-[var(--transition-fast)]',
          isActive
            ? 'bg-primary-soft text-primary'
            : 'text-content-secondary hover:text-content hover:bg-surface-elevated'
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Active indicator — a rule, not a colour change alone */}
          <span
            className={cx(
              'absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-full bg-primary transition-all',
              isActive ? 'h-5 opacity-100' : 'h-0 opacity-0'
            )}
            aria-hidden="true"
          />
          <Icon size={17} className="shrink-0" aria-hidden="true" />
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ groups, role, onLogout, onBackToSite, open, onClose }) {
  return (
    <>
      {/* Mobile scrim */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fadeIn"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-50 w-[17rem] flex flex-col',
          'glass-strong border-y-0 border-l-0 rounded-none',
          'transition-transform duration-[var(--transition-normal)]',
          'lg:translate-x-0 lg:z-30',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Admin navigation"
      >
        {/* Brand */}
        <div className="flex items-center justify-between gap-3 h-[4.5rem] px-5 border-b border-subtle shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 grid place-items-center shrink-0 rounded-[var(--radius-sm)] bg-primary-soft border border-primary/25 p-1.5">
              <img src={logo} alt="" className="h-full w-full object-contain opacity-90" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-[15px] leading-none text-content m-0 truncate">SalonBooker</p>
              <p className="text-[9px] uppercase tracking-[0.2em] text-primary m-0 mt-1">
                {role === 'staff' ? 'Staff portal' : 'Admin'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="lg:hidden grid place-items-center h-8 w-8 rounded-[var(--radius-sm)] bg-transparent border-none text-content-muted hover:text-content cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 py-5 flex flex-col gap-6">
          {groups.map((group) => (
            <div key={group.label} className="flex flex-col gap-1">
              <p className="px-3 mb-1 m-0 text-[10px] font-semibold uppercase tracking-[0.13em] text-content-muted">
                {group.label}
              </p>
              {group.items.map((item) => (
                <NavItem key={item.to} {...item} onNavigate={onClose} />
              ))}
            </div>
          ))}
        </nav>

        {/* Footer actions */}
        <div className="shrink-0 border-t border-subtle p-3 flex flex-col gap-2">
          <Button variant="ghost" size="sm" onClick={onBackToSite} className="justify-start">
            <ArrowLeft size={15} aria-hidden="true" /> Back to website
          </Button>
          <Button variant="danger" size="sm" onClick={onLogout} className="justify-start">
            <LogOut size={15} aria-hidden="true" /> Sign out
          </Button>
        </div>
      </aside>
    </>
  );
}
