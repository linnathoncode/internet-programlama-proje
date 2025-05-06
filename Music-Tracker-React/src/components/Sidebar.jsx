import React from "react";

const Sidebar = ({ userInfo, onLogout }) => {
  return (
    <aside className="fixed top-0 left-0 h-full z-20 w-64 p-6 border-r border-white/10 bg-black/30 backdrop-blur-md hidden md:block shadow-xl shadow-primary/40 rounded-lg">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white">Your Profile</h2>
        <p className="text-sm text-gray-300">
          {userInfo?.display_name || "Loading Profile..."}
        </p>
      </div>
      <nav className="space-y-4">
        <button className="block w-full text-left px-4 py-2 bg-white/10 hover:bg-white/25 rounded-lg transition">
          Dashboard
        </button>
        <button className="block w-full text-left px-4 py-2 bg-white/10 hover:bg-white/25 rounded-lg transition">
          Listen History
        </button>
        <button className="block w-full text-left px-4 py-2 bg-white/10 hover:bg-white/25 rounded-lg transition">
          Settings
        </button>
        <button
          onClick={onLogout}
          className="block w-full text-left px-4 py-2 bg-white/10 hover:bg-white/25 rounded-lg transition"
        >
          Logout
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
