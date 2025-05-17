import React, { useState, useEffect } from 'react';
import { FaUserShield, FaTrash, FaEye, FaLock, FaLockOpen } from 'react-icons/fa';
import { MdCleaningServices } from 'react-icons/md';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all admin data on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Fetch users
    fetch('/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setUsers(Array.isArray(data) ? data : []));

    // Fetch all requests
    fetch('/api/managerequest', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setRequests(Array.isArray(data) ? data : []));

    // Fetch all camps
    fetch('/api/managecamp', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setCamps(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  // Block/unblock user
  const toggleUserBlock = async (userId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/admin/toggle_block/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(users =>
          users.map(user =>
            user.id === userId ? { ...user, is_blocked: data.user.is_blocked } : user
          )
        );
      } else {
        alert(data.error || "Failed to update user status");
      }
    } catch (err) {
      alert("Failed to update user status");
    }
  };

  // Optionally, implement request/camp deletion here

  return (
    <div className="min-h-screen bg-[#d1f1fa]">
      {/* Admin Navbar */}
      <nav className="bg-green-600 text-white p-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center">
          <MdCleaningServices className="text-2xl mr-2" />
          <span className="text-xl font-bold">CleanEarth Admin</span>
        </div>
        <div className="flex items-center space-x-4">
          <button className="hover:bg-green-700 px-3 py-1 rounded transition-colors">Dashboard</button>
          <button className="hover:bg-green-700 px-3 py-1 rounded transition-colors" onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }}>Logout</button>
        </div>
      </nav>

      <div className="p-6 space-y-8">
        {/* User Management Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-green-700 mb-4 flex items-center">
            <FaUserShield className="mr-2" />
            User Management
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-green-50">
                <tr>
                  <th className="p-3 text-left text-green-700">Name</th>
                  <th className="p-3 text-left text-green-700">Email</th>
                  <th className="p-3 text-left text-green-700">Role</th>
                  <th className="p-3 text-left text-green-700">Status</th>
                  <th className="p-3 text-left text-green-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">{user.name}</td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3 capitalize">{user.role}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${user.is_blocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-700'}`}>
                        {user.is_blocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="p-3">
                      <button 
                        onClick={() => toggleUserBlock(user.id)}
                        className="p-2 rounded hover:bg-green-50"
                      >
                        {user.is_blocked ? (
                          <FaLockOpen className="text-green-600" />
                        ) : (
                          <FaLock className="text-red-600" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Requests Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-green-700 mb-4 flex items-center">
            <FaEye className="mr-2" />
            All Requests
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-green-50">
                <tr>
                  <th className="p-3 text-left text-green-700">Location</th>
                  <th className="p-3 text-left text-green-700">Description</th>
                  <th className="p-3 text-left text-green-700">Status</th>
                  <th className="p-3 text-left text-green-700">Pincode</th>
                  {/* <th className="p-3 text-left text-green-700">Actions</th> */}
                </tr>
              </thead>
              <tbody>
                {requests.map(request => (
                  <tr key={request.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">{request.address || request.location}</td>
                    <td className="p-3">{request.description}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-700'
                      }`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="p-3">{request.pincode}</td>
                    {/* <td className="p-3">
                      <button className="p-2 rounded hover:bg-green-50">
                        <FaTrash className="text-red-600" />
                      </button>
                    </td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Camps Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-green-700 mb-4 flex items-center">
            <MdCleaningServices className="mr-2" />
            Camp Details
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-green-50">
                <tr>
                  <th className="p-3 text-left text-green-700">Camp Name</th>
                  <th className="p-3 text-left text-green-700">Date</th>
                  <th className="p-3 text-left text-green-700">Volunteers</th>
                  <th className="p-3 text-left text-green-700">Location</th>
                  <th className="p-3 text-left text-green-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {camps.map(camp => (
                  <tr key={camp.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">{camp.name}</td>
                    <td className="p-3">{camp.date}</td>
                    <td className="p-3">{camp.num_volunteers}</td>
                    <td className="p-3">{camp.location || (camp.request && camp.request.address)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        camp.status === 'active' || camp.status === 'planned'
                          ? 'bg-green-100 text-green-700'
                          : camp.status === 'completed'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {camp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;