import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { FaUser, FaLock, FaUserTag } from "react-icons/fa";
import "../styles/custom.css";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      console.log("Submitting login form...", formData);
      
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login failed");

      console.log("Login response:", data);
      
      // Store JWT and user info
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      // Verify token with auth check
      try {
        const verifyResponse = await fetch('http://localhost:5000/api/auth-check', {
          headers: {
            'Authorization': `Bearer ${data.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (verifyResponse.ok) {
          console.log("Token verification successful");
        } else {
          console.warn("Token verification response:", await verifyResponse.json());
        }
      } catch (verifyErr) {
        console.error("Token verification error:", verifyErr);
      }

      // Redirect based on role
      if (data.user.role === "admin") navigate("/admin");
      else if (data.user.role === "volunteer") navigate("/volunteer");
      else navigate("/");

    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-green-50">
      <Navbar active="Login" />
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-green-700">Welcome Back</h1>
            <p className="text-gray-600">Log in to continue your eco-journey</p>
            <p className="text-green-600 mt-2">
              New user? <Link to="/register" className="font-semibold underline">Register here</Link>
            </p>
          </div>
          <div className="eco-card p-8">
            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-green-600">
                    <FaUser />
                  </div>
                  <input
                    className="eco-input pl-10"
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-green-600">
                    <FaLock />
                  </div>
                  <input
                    className="eco-input pl-10"
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">
                  Login As (Optional)
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-green-600">
                    <FaUserTag />
                  </div>
                  <select
                    className="eco-input pl-10"
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="">Any Role</option>
                    <option value="user">User</option>
                    <option value="volunteer">Volunteer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="eco-btn eco-btn-primary w-full py-3"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have an account?{" "}
                <Link to="/register" className="text-green-600 hover:text-green-800 font-semibold">
                  Register Now
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
