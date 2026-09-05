import React, { useState, useEffect } from 'react';

// 1. Accept the props passed down from AdminPanel.jsx
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
      // 2 & 3. Use the apiBase and token props directly!
      const res = await fetch(`${apiBase}/bookings/customers?page=${page}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}` 
        }
      });
      const data = await res.json();
      
      if (res.ok) {
        setUsers(data.users);
        setPagination(data.pagination);
      } else {
        console.error("Server Error:", data.error);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (pagination.currentPage < pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }));
    }
  };

  const handlePrevPage = () => {
    if (pagination.currentPage > 1) {
      setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }));
    }
  };

  return (
    <div className="p-6 animate-slideIn">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#134611] m-0">Client Database</h1>
        <span className="bg-[#96E072]/30 text-[#134611] border border-[#96E072]/50 px-4 py-1.5 rounded-full text-sm font-black">
          Total Clients: {pagination.totalUsers}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3E8914]"></div>
        </div>
      ) : (
        <div className="bg-white/50 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_8px_32px_rgba(19,70,17,0.06)] overflow-hidden">
          <table className="min-w-full divide-y divide-[#3DA35D]/20">
            <thead className="bg-[#134611]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#E8FCCF] uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#E8FCCF] uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#E8FCCF] uppercase tracking-wider">Supercoins</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#E8FCCF] uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3DA35D]/20 bg-white/40">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-[#3DA35D] font-bold">No customers found.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/60 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-black text-[#134611]">{user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-[#134611]">{user.phone}</div>
                      <div className="text-sm font-bold text-[#3DA35D]">{user.email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {/* 4. Changed from user.coins to user.supercoins */}
                      <span className="px-3 py-1.5 inline-flex text-xs leading-5 font-black rounded-lg bg-yellow-100 text-yellow-800 border border-yellow-200">
                        🪙 {user.supercoins || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#3DA35D]">
                      {new Date(user.created_at).toLocaleDateString('en-IN', {
                         year: 'numeric',
                         month: 'short',
                         day: 'numeric'
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="bg-white/50 px-6 py-4 flex items-center justify-between border-t border-[#3DA35D]/20">
              <div className="flex-1 flex justify-between sm:hidden">
                <button onClick={handlePrevPage} disabled={pagination.currentPage === 1} className="relative inline-flex items-center px-4 py-2 border border-[#3DA35D]/30 text-sm font-bold rounded-xl text-[#134611] bg-white hover:bg-[#96E072]/20 disabled:opacity-50 cursor-pointer">Previous</button>
                <button onClick={handleNextPage} disabled={pagination.currentPage === pagination.totalPages} className="ml-3 relative inline-flex items-center px-4 py-2 border border-[#3DA35D]/30 text-sm font-bold rounded-xl text-[#134611] bg-white hover:bg-[#96E072]/20 disabled:opacity-50 cursor-pointer">Next</button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-[#134611] font-bold m-0">
                    Showing Page <span className="font-black">{pagination.currentPage}</span> of <span className="font-black">{pagination.totalPages || 1}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px" aria-label="Pagination">
                    <button onClick={handlePrevPage} disabled={pagination.currentPage === 1} className="relative inline-flex items-center px-4 py-2 rounded-l-xl border border-[#3DA35D]/30 bg-white text-sm font-bold text-[#134611] hover:bg-[#96E072]/20 disabled:opacity-50 cursor-pointer transition-colors">
                      Previous
                    </button>
                    <button onClick={handleNextPage} disabled={pagination.currentPage === pagination.totalPages} className="relative inline-flex items-center px-4 py-2 rounded-r-xl border border-[#3DA35D]/30 bg-white text-sm font-bold text-[#134611] hover:bg-[#96E072]/20 disabled:opacity-50 cursor-pointer transition-colors">
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}