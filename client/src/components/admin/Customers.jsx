import React, { useState, useEffect } from 'react';
import { Coins, UsersRound } from 'lucide-react';
import {
  Card, Badge, EmptyState, LoadingState, Pagination, PageHeader, Table, Td, Tr,
} from '../ui/index.js';

export default function Customers({ apiBase, token }) {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalUsers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers(pagination.currentPage);
  }, [pagination.currentPage]);

  const fetchUsers = async (page) => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/bookings/customers?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        setUsers(data.users);
        setPagination(data.pagination);
      } else {
        console.error('Server Error:', data.error);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (pagination.currentPage < pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: prev.currentPage + 1 }));
    }
  };

  const handlePrevPage = () => {
    if (pagination.currentPage > 1) {
      setPagination((prev) => ({ ...prev, currentPage: prev.currentPage - 1 }));
    }
  };

  const CoinBadge = ({ value }) => (
    <Badge tone="primary" className="tabular-nums">
      <Coins size={11} aria-hidden="true" />
      {Number(value || 0).toLocaleString()}
    </Badge>
  );

  return (
    <div className="animate-slideIn flex flex-col gap-5">
      <PageHeader
        title="Client database"
        description="Everyone who has booked with the salon."
        action={
          <Badge tone="neutral" className="tabular-nums">
            {pagination.totalUsers} total
          </Badge>
        }
      />

      {loading ? (
        <LoadingState label="Loading clients…" />
      ) : users.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="No customers yet"
          description="Clients appear here after their first booking."
        />
      ) : (
        <>
          {/* Mobile cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {users.map((user) => (
              <Card key={user.id} className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="m-0 font-semibold text-content text-[15px] truncate min-w-0">{user.name}</p>
                  <CoinBadge value={user.supercoins} />
                </div>
                <div className="bg-surface-sunken border border-subtle rounded-[var(--radius-md)] p-3 flex flex-col gap-1">
                  <p className="m-0 text-[13px] text-content tabular-nums truncate">{user.phone}</p>
                  <p className="m-0 text-[12px] text-content-muted truncate">{user.email || 'No email'}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block">
            <Table minWidth="40rem" columns={['Name', 'Contact', 'Supercoins']}>
              {users.map((user) => (
                <Tr key={user.id}>
                  <Td className="font-medium">{user.name}</Td>
                  <Td>
                    <span className="block text-[13px] text-content tabular-nums">{user.phone}</span>
                    <span className="block text-[13px] text-content-muted">{user.email || 'No email'}</span>
                  </Td>
                  <Td><CoinBadge value={user.supercoins} /></Td>
                </Tr>
              ))}
            </Table>
          </div>

          <Pagination
            page={pagination.currentPage}
            totalPages={pagination.totalPages || 1}
            onPrev={handlePrevPage}
            onNext={handleNextPage}
          />
        </>
      )}
    </div>
  );
}
