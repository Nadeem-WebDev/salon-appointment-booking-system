import React, { useState, useEffect } from 'react';

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
    <div className="p-4 md:p-6 animate-slideIn">
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
        <div className="flex flex-col gap-4">
          
          {/* --- MOBILE CARD VIEW --- */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {users.length === 0 ? (
              <div className="text-center py-8 text-[#134611]/60 bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl shadow-[0_4px_20px_rgba(19,70,17,0.05)] font-bold">No customers found.</div>
            ) : (
              users.map(user => (
                <div key={user.id} className="bg-white/50 backdrop-blur-xl p-5 rounded-2xl shadow-[0_4px_20px_rgba(19,70,17,0.05)] border border-[#3DA35D]/30 flex flex-col gap-3 min-w-0">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <h3 className="font-black text-[#134611] text-lg m-0 truncate">{user.name}</h3>
                    </div>
                    <span className="px-3 py-1.5 inline-flex text-xs leading-5 font-black rounded-lg bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm shrink-0 whitespace-nowrap">
                      🪙 {user.supercoins || 0}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 mt-1 bg-white/40 p-3 rounded-xl border border-white/50">
                    <p className="text-sm font-bold text-[#134611] m-0 truncate">{user.phone}</p>
                    <p className="text-xs font-bold text-[#3DA35D] m-0 truncate">{user.email || 'N/A'}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* --- DESKTOP TABLE VIEW --- */}
          <div className="hidden md:block bg-white/50 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_8px_32px_rgba(19,70,17,0.06)] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#134611]">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-[#E8FCCF] uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#E8FCCF] uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#E8FCCF] uppercase tracking-wider">Supercoins</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3DA35D]/20 bg-white/40">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-[#3DA35D] font-bold">No customers found.</td>
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
                        <span className="px-3 py-1.5 inline-flex text-xs leading-5 font-black rounded-lg bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm">
                          🪙 {user.supercoins || 0}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* --- PAGINATION CONTROLS --- */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-2 bg-white/50 backdrop-blur-xl border border-white/60 p-4 rounded-2xl shadow-[0_4px_20px_rgba(19,70,17,0.05)]">
              <button
                disabled={pagination.currentPage === 1}
                onClick={handlePrevPage}
                className="w-full sm:w-auto py-2.5 px-5 rounded-xl font-bold text-sm bg-white/80 text-[#134611] border border-[#3DA35D]/30 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#96E072]/20 transition-colors cursor-pointer"
              >
                Previous
              </button>
              <span className="text-sm font-black text-[#3E8914] bg-white/80 py-2.5 px-5 rounded-xl border border-[#3DA35D]/30 w-full sm:w-auto text-center shadow-sm">
                Page {pagination.currentPage} of {pagination.totalPages || 1}
              </span>
              <button
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={handleNextPage}
                className="w-full sm:w-auto py-2.5 px-5 rounded-xl font-bold text-sm bg-white/80 text-[#134611] border border-[#3DA35D]/30 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#96E072]/20 transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
          
        </div>
      )}
    </div>
  );
}