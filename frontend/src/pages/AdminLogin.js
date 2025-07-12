import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !password) {
      setError("Please enter both name and password.");
      return;
    }
    if (name === "priyanka" && password === "pass123") {
      localStorage.setItem("isAdmin", "true");
      navigate("/admin");
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-lg flex flex-col gap-4 w-full max-w-sm"
      >
        <h2 className="text-gray-800 text-2xl font-bold mb-2 text-center">Admin Login</h2>
        {error && <div className="text-red-500 text-center text-sm">{error}</div>}
        <input
          className="p-3 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-800"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="p-3 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-800"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="bg-primary-600 hover:bg-primary-700 text-white rounded p-3 font-semibold transition"
        >
          Login
        </button>
      </form>
    </div>
  );
} 