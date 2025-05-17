import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaHome, FaMapMarkedAlt, FaClipboardList, FaMedal, FaInfoCircle, FaLeaf, FaSignInAlt, FaUserPlus, FaSignOutAlt } from "react-icons/fa";
import "../styles/custom.css";

const navItems = [
  { name: "Home", icon: <FaHome />, link: "/" },
  { name: "Report Location", icon: <FaMapMarkedAlt />, link: "/report" },
  { name: "Completed Logs", icon: <FaClipboardList />, link: "/logs" },
  { name: "Your Badges", icon: <FaMedal />, link: "/badges" },
  { name: "About Us", icon: <FaInfoCircle />, link: "/about" },
];

const Navbar = ({ active }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isLoggedIn = !!localStorage.getItem("token");

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch("http://localhost:5000/api/logout", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="eco-nav h-full w-24 flex flex-col items-center pt-8 pb-6">
      <div className="mb-8">
        <FaLeaf className="text-3xl text-white" />
        <h1 className="text-white text-xs font-bold mt-1">CLEAN<br />EARTH</h1>
      </div>
      
      {navItems.map((item) => (
        <Link
          key={item.name}
          to={item.link}
          className={`eco-nav-item mb-6 ${active === item.name ? "active" : ""}`}
        >
          <span className="eco-nav-icon">{item.icon}</span>
          <span className="text-xs mt-1 font-medium">{item.name.split(" ")[0]}</span>
        </Link>
      ))}
      
      {/* Auth Navigation Items */}
      <div className="mt-auto border-t border-green-600 pt-6 w-full">
        {isLoggedIn ? (
          <button
            onClick={handleLogout}
            className="eco-nav-item w-full cursor-pointer"
          >
            <span className="eco-nav-icon"><FaSignOutAlt /></span>
            <span className="text-xs mt-1 font-medium">Logout</span>
          </button>
        ) : (
          <>
            <Link
              to="/login"
              className={`eco-nav-item mb-4 ${active === "Login" ? "active" : ""}`}
            >
              <span className="eco-nav-icon"><FaSignInAlt /></span>
              <span className="text-xs mt-1 font-medium">Login</span>
            </Link>
            <Link
              to="/register"
              className={`eco-nav-item ${active === "Register" ? "active" : ""}`}
            >
              <span className="eco-nav-icon"><FaUserPlus /></span>
              <span className="text-xs mt-1 font-medium">Register</span>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;