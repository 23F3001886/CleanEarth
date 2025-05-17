import React from "react";
import { Link } from "react-router-dom";
import { 
  FaHome, 
  FaMapMarkedAlt, 
  FaClipboardList, 
  FaMedal, 
  FaInfoCircle,
  FaUser,
  FaCampground,
  FaSignOutAlt,
  FaSignInAlt,
  FaTrophy
} from "react-icons/fa";
import { GiEarthAmerica } from "react-icons/gi";

const VolunteerNavbar = ({ active, isLoggedIn = true }) => {
  // Define navbar items based on login status
  const navItems = [
    { name: "Home", icon: <FaHome size={22} />, link: "/" },
    { name: "Report", icon: <FaMapMarkedAlt size={22} />, link: "/report" },
    { name: "Camps", icon: <FaCampground size={22} />, link: "/camps" },
    { name: "Completed", icon: <FaClipboardList size={22} />, link: "/logs" },
    { name: "Your", icon: <FaMedal size={22} />, link: "/badges" },
    { name: "Leaderboard", icon: <FaTrophy size={22} />, link: "/leaderboard" },
    { name: "Profile", icon: <FaUser size={22} />, link: "/profile" },
    { name: "About", icon: <FaInfoCircle size={22} />, link: "/about" },
  ];

  // conditional login/logout button
  const authButton = isLoggedIn 
    ? { name: "Logout", icon: <FaSignOutAlt size={22} />, link: "/logout" }
    : { name: "Login", icon: <FaSignInAlt size={22} />, link: "/login" };

  return (
    <nav className="h-full w-20 bg-green-700 flex flex-col items-center py-6 shadow-lg">
      <div className="mb-6">
        <div className="bg-white p-2 rounded-md">
          <GiEarthAmerica className="text-green-700 text-3xl" />
        </div>
        <div className="text-white text-center text-xs mt-1 font-bold">CLEAN<br/>EARTH</div>
      </div>
      
      {navItems.map((item) => (
        <Link
          key={item.name}
          to={item.link}
          className={`mb-6 flex flex-col items-center justify-center text-white transition p-2 w-16 h-16
            ${active === item.name ? "bg-green-100 text-green-700 rounded-xl" : "hover:bg-green-600 rounded-xl"}`}
        >
          <div className={active === item.name ? "text-green-700" : "text-white"}>
            {item.icon}
          </div>
          <span className={`text-xs mt-1 ${active === item.name ? "text-green-700" : "text-white"}`}>
            {item.name}
          </span>
        </Link>
      ))}
      
      <div className="mt-auto">
        <Link
          to={authButton.link}
          className="mb-2 flex flex-col items-center text-white hover:bg-green-600 p-2 rounded-xl"
        >
          {authButton.icon}
          <span className="text-xs mt-1">{authButton.name}</span>
        </Link>
      </div>
    </nav>
  );
};

export default VolunteerNavbar;