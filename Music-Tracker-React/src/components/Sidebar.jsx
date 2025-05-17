import React from "react";
import {
  FaHome,
  FaHistory,
  FaCog,
  FaSignOutAlt,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

import { FaUser } from "react-icons/fa6";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
const Sidebar = () => {
  // get context from appcontext
  const { userInfo, isSidebarCollapsed, toggleSidebar, logout } =
    useAppContext();

  // Navigate
  const navigate = useNavigate();

  // Conditional classes for width and padding
  const sidebarWidthClass = isSidebarCollapsed ? "w-20" : "w-64";
  const sidebarPaddingClass = isSidebarCollapsed ? "p-4" : "p-6";

  // Classes for the text span visibility with delay
  const textClasses = `whitespace-nowrap transition-opacity duration-200 ${
    isSidebarCollapsed
      ? "opacity-0 pointer-events-none"
      : "opacity-100 delay-100"
  }`;

  // Classes for the button's inner flex layout
  const buttonFlexClasses = `flex items-center w-full text-white text-left px-3 py-2 bg-white/10 hover:bg-white/25 rounded-lg transition ${
    isSidebarCollapsed ? "" : "gap-3" // Apply gap only when not collapsed
  }`;

  // Class to prevent icon from shrinking when collapsed
  const iconShrinkClass = isSidebarCollapsed ? "flex-shrink-0" : "";

  return (
    <aside
      className={`sticky left-0 top-0 h-screen z-20 ${sidebarWidthClass} ${sidebarPaddingClass} border-r border-white/10 bg-primary backdrop-blur-md hidden md:flex flex-col shadow-xl shadow-primary/40 rounded-lg transition-all duration-300 ease-in-out`}
    >
      {/* Toggle Button */}
      <div
        className={`flex ${
          isSidebarCollapsed ? "justify-center" : "justify-end"
        } mb-8`}
      >
        <button
          onClick={toggleSidebar}
          className="p-1 rounded-full hover:bg-white/10 transition"
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isSidebarCollapsed ? (
            <FaChevronRight size={20} />
          ) : (
            <FaChevronLeft size={20} />
          )}
        </button>
      </div>

      {/* Profile Section */}
      <div className={`mb-8 ${isSidebarCollapsed ? "text-center" : ""}`}>
        {/* Inner container for profile image/placeholder and text */}
        <div
          className={`flex items-center ${isSidebarCollapsed ? "" : "gap-3"}`}
        >
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 text-sm font-bold overflow-hidden flex-shrink-0">
            {userInfo?.profile_image ? (
              <img
                src={userInfo.profile_image.url}
                alt={
                  userInfo?.display_name
                    ? `${userInfo.display_name}'s profile`
                    : "Profile"
                }
                className="w-full h-full object-cover"
              />
            ) : userInfo?.display_name ? (
              userInfo.display_name[0]
            ) : (
              <FaUser size={24} />
            )}
          </div>
          {/* Profile Text (only visible when uncollapsed) */}
          {/* Wrapped text in a div and applied textClasses for visibility */}
          <div className={`flex-col ${textClasses}`}>
            {/* Use flex-col to stack text, apply textClasses for visibility */}
            <h2 className="text-xl font-bold text-white">Your Profile</h2>
            <p className="text-sm text-gray-300">
              {userInfo?.display_name || "Loading Profile..."}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-4 flex-grow">
        {/* Navigation Links*/}
        <button
          onClick={() => navigate("/")}
          className={`${buttonFlexClasses}`}
        >
          <FaHome size={20} className={iconShrinkClass} /> {/* Icon */}
          <span className={textClasses}>Dashboard</span> {/* Text span */}
        </button>
        <button
          onClick={() => navigate("listening-history")}
          className={`${buttonFlexClasses}`}
        >
          <FaHistory size={20} className={iconShrinkClass} /> {/* Icon */}
          <span className={textClasses}>Listen History</span> {/* Text span */}
        </button>
        <button className={`${buttonFlexClasses}`}>
          <FaCog size={20} className={iconShrinkClass} /> {/* Icon */}
          <span className={textClasses}>Settings</span> {/* Text span */}
        </button>
      </nav>

      {/* Logout Buttons */}
      <button
        onClick={logout}
        className={`${buttonFlexClasses} ${
          isSidebarCollapsed ? "" : "mt-auto"
        }`}
      >
        <FaSignOutAlt size={20} className={iconShrinkClass} /> {/* Icon */}
        <span className={textClasses}>Logout</span> {/* Text span */}
      </button>
    </aside>
  );
};

export default Sidebar;
