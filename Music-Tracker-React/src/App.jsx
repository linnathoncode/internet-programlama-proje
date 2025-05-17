import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import ListeningHistory from "./pages/ListeningHistoryPage";
// Layout Components
import Sidebar from "./components/Sidebar";
import PlaylistBar from "./components/PlaylistBar";
import Layout from "./layouts/Layout";

// Context provider
import { AppProvider, useAppContext } from "./context/AppContext";

const ProtectedLayout = () => {
  const { isSidebarCollapsed, toggleSidebar, userInfo, logout } =
    useAppContext();

  return (
    // This is the outermost container, responsible for the overall layout
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-black text-white font-inter selection:bg-accent selection:text-white relative flex">
      {/* Noise Overlay - Stays here as it covers the whole page */}
      {/* Ensure path is correct relative to where index.css/App.js lives */}
      <div className="bg-[url('./assets/broken-noise.png')] bg-repeat mix-blend-screen absolute inset-0 opacity-50 z-0" />
      {/* Sidebar Component - Renders directly within the main layout, uses context */}
      <Sidebar /> {/* Sidebar component will consume context internally */}
      {/* Main Content Wrapper provided by Layout */}
      {/* Outlet renders the specific route component (HomePage, NewPage etc.) */}
      <Layout>
        <Outlet />{" "}
        {/* This is where the routed page component will be rendered */}
      </Layout>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppProvider>
        <Routes>
          {/*login page does not need protected layout */}
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/listening-history" element={<ListeningHistory />} />
          </Route>
        </Routes>
      </AppProvider>
    </Router>
  );
}

export default App;
