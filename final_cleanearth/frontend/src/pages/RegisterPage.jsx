import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { FaUser, FaLock, FaEnvelope, FaMapMarkerAlt, FaUserTag } from "react-icons/fa";
import "../styles/custom.css";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    pincode: "",
    latitude: "",
    longitude: "",
    role: "user"
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getLocation();
    // eslint-disable-next-line
  }, []);

  const getLocation = () => {
    if (navigator.geolocation) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }));
          setLocationLoading(false);
        },
        (error) => {
          setLocationLoading(false);
        }
      );
    }
  };

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
      console.log("Submitting registration form...", formData);
      
      // Use absolute URL to ensure the request goes to the correct server
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(formData),
      });
      
      console.log("Registration response status:", response.status);
      const data = await response.json();
      console.log("Registration response data:", data);
      
      if (!response.ok) throw new Error(data.error || "Registration failed");
      
      // Store JWT and user info
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      // Show success message
      alert("Registration successful! You are now logged in.");
      
      // Navigate based on role
      if (data.user.role === "admin") navigate("/admin");
      else if (data.user.role === "volunteer") navigate("/volunteer");
      else navigate("/");
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message || "Something went wrong with registration. Please ensure the backend server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-green-50">
      <Navbar active="Register" />
      <div className="flex-1 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-green-700">Join CleanEarth</h1>
            <p className="text-gray-600">Create an account to start making a difference</p>
          </div>
          <div className="eco-card p-8">
            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-green-600">
                      <FaUser />
                    </div>
                    <input
                      className="eco-input pl-10 text-black"
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-green-600">
                      <FaEnvelope />
                    </div>
                    <input
                      className="eco-input pl-10 text-black"
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
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-green-600">
                    <FaLock />
                  </div>
                  <input
                    className="eco-input pl-10 text-black"
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pincode">
                    Pincode
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-green-600">
                      <FaMapMarkerAlt />
                    </div>
                    <input
                      className="eco-input pl-10 text-black"
                      id="pincode"
                      name="pincode"
                      type="text"
                      placeholder="Enter your pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">
                    Register As
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-green-600">
                      <FaUserTag />
                    </div>
                    <select
                      className="eco-input pl-10 text-black"
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      required
                    >
                      <option value="user">User</option>
                      <option value="volunteer">Volunteer</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="latitude">
                      Latitude
                    </label>
                    <button
                      type="button"
                      onClick={getLocation}
                      className="text-green-600 text-xs"
                    >
                      {locationLoading ? "Fetching..." : "Auto Fetch"}
                    </button>
                  </div>
                  <input
                    className="eco-input text-black"
                    id="latitude"
                    name="latitude"
                    type="text"
                    placeholder="Latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="longitude">
                    Longitude
                  </label>
                  <input
                    className="eco-input text-black"
                    id="longitude"
                    name="longitude"
                    type="text"
                    placeholder="Longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="eco-btn eco-btn-primary w-full py-3"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Register"}
              </button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link to="/login" className="text-green-600 hover:text-green-800 font-semibold">
                  Login Here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
