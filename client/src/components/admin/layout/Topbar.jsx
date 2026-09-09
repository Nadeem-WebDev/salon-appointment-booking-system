import React from 'react';
import { Menu, Search, Filter, Calendar, X } from 'lucide-react';
import { Input, Select, cx } from '../../ui/index.js';

/**
 * Sticky admin header: mobile menu trigger, page title, and the contextual
 * filters. Filters only render on the routes that use them.
 */
export default function Topbar({
  title,
  onOpenNav,
  showRecordFilters,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  dateFilter,
  onDateChange,
}) {
  return (
    <header className="sticky top-0 z-20 glass glass-edge border-x-0 border-t-0 rounded-none">
      <div className="px-4 md:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-3">
        <button
          onClick={onOpenNav}
          aria-label="Open navigation"
          className="lg:hidden grid place-items-center h-10 w-10 shrink-0 rounded-[var(--radius-sm)] bg-surface-elevated border border-line text-content-secondary hover:text-content cursor-pointer"
        >
          <Menu size={18} />
        </button>

        <h2 className="font-display text-xl text-content m-0 mr-auto truncate min-w-0">{title}</h2>

        <div
          className={cx(
            'grid grid-cols-2 sm:flex sm:flex-row sm:items-center gap-2.5',
            'w-full md:w-auto'
          )}
        >
          {showRecordFilters && (
            <>
              <div className="relative col-span-2 sm:w-56">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  aria-label="Search appointments"
                  placeholder="Search name, email, phone…"
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>

              <div className="relative sm:w-44">
                <Filter
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted pointer-events-none z-10"
                  aria-hidden="true"
                />
                <Select
                  aria-label="Filter by status"
                  value={statusFilter}
                  onChange={(e) => onStatusChange(e.target.value)}
                  className="pl-9 h-10"
                >
                  <option value="all">All statuses</option>
                  <option value="queued">Queued</option>
                  <option value="in-progress">In progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
              </div>
            </>
          )}

          <div className="relative sm:w-48">
            <Calendar
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted pointer-events-none z-10"
              aria-hidden="true"
            />
            <Input
              type="date"
              aria-label="Filter by date"
              value={dateFilter}
              onChange={(e) => onDateChange(e.target.value)}
              className={cx('pl-9 h-10', dateFilter && 'pr-9')}
            />
            {dateFilter && (
              <button
                onClick={() => onDateChange('')}
                aria-label="Clear date filter"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 grid place-items-center h-6 w-6 rounded-full bg-transparent border-none text-content-muted hover:text-danger cursor-pointer z-10"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
