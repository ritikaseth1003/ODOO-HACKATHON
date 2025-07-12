import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const initialUsers = [
  { id: 1, name: "User One", email: "user1@email.com" },
  { id: 2, name: "User Two", email: "user2@email.com" },
  { id: 3, name: "User Three", email: "user3@email.com" },
  { id: 4, name: "User Four", email: "user4@email.com" },
];

export default function AdminPanel() {
  const navigate = useNavigate();
  const [users, setUsers] = useState(initialUsers);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("users");

  useEffect(() => {
    if (localStorage.getItem("isAdmin") !== "true") {
      navigate("/admin-login");
    }
  }, [navigate]);

  const handleDelete = (id) => {
    setUsers(users.filter((user) => user.id !== id));
    setMessage("User deleted!");
    setTimeout(() => setMessage(""), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-6 relative">
        <button
          onClick={handleLogout}
          className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
        >
          Logout
        </button>
        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Admin Panel</h2>
        <div className="flex justify-center gap-4 mb-8">
          <button
            className={`px-4 py-2 rounded font-semibold transition ${
              activeTab === "users"
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-primary-100"
            }`}
            onClick={() => setActiveTab("users")}
          >
            Manage Users
          </button>
          <button
            className={`px-4 py-2 rounded font-semibold transition ${
              activeTab === "orders"
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-primary-100"
            }`}
            onClick={() => setActiveTab("orders")}
          >
            Manage Orders
          </button>
          <button
            className={`px-4 py-2 rounded font-semibold transition ${
              activeTab === "listings"
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-primary-100"
            }`}
            onClick={() => setActiveTab("listings")}
          >
            Manage Listings
          </button>
        </div>
        {message && (
          <div className="mb-4 text-green-600 text-center font-medium">{message}</div>
        )}

        {/* Tab Content */}
        {activeTab === "users" && (
          <>
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Manage Users</h3>
            <div className="space-y-4">
              {users.length === 0 ? (
                <div className="text-center text-gray-500">No users found.</div>
              ) : (
                users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center bg-gray-100 rounded-lg shadow p-4"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary-200 flex items-center justify-center text-xl font-bold text-primary-700 mr-4">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{user.name}</div>
                      <div className="text-gray-500 text-sm">{user.email}</div>
                    </div>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="ml-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === "orders" && (
          <div className="text-center text-gray-500 py-12">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Manage Orders</h3>
            <p>No orders yet.</p>
          </div>
        )}

        {activeTab === "listings" && (
          <div className="text-center text-gray-500 py-12">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Manage Listings</h3>
            <p>No listings yet.</p>
          </div>
        )}
      </div>
    </div>
  );
} 