import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import * as apiClient from "../services/apiClient";

const AppContext = createContext(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const navigate = useNavigate();

  // Shared states
  const [userInfo, setUserInfo] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Authentication Check and User Info Fetch
  useEffect(() => {
    const checkAuthAndFetchUser = async () => {
      try {
        const authStatus = await apiClient.getAuthStatus();
        console.log("Auth Status", authStatus);
        if (!authStatus || !authStatus.loggedIn) {
          navigate("/login");
          setLoadingAuth(false);
          return;
        }

        // If logged in, fetch user info
        const userData = await apiClient.getUserInfo();
        setUserInfo(userData);
        setLoadingAuth(false);
      } catch (err) {
        console.error("Auth check or user info fetch failed:", err);
        navigate("/login");
        setLoadingAuth(false);
      }
    };

    checkAuthAndFetchUser();
  }, [navigate]);

  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
      setUserInfo(null);
      navigate("/login");
    } catch (err) {
      console.error("Error logging out:", err);
      alert("Logout failed.");
    }
  }, [navigate]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(
    () => ({
      userInfo,
      loadingAuth, // Expose loading state
      isSidebarCollapsed,
      toggleSidebar,
      logout,
    }),
    [userInfo, loadingAuth, isSidebarCollapsed, toggleSidebar, logout]
  );

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-black text-white font-inter selection:bg-accent selection:text-white flex items-center justify-center">
        {/* Noise Overlay - Keep here as it covers the whole initial load screen too */}
        {/* Assuming noise overlay is in index.css or App.js top level */}
        {/* <div className="bg-[url('../assets/broken-noise.png')] bg-repeat mix-blend-screen absolute inset-0 opacity-50 z-0" /> */}
        <p className="relative z-10 text-white text-xl">Loading...</p>{" "}
        {/* Ensure text is above noise */}
      </div>
    );
  }

  // Render the children (the rest of the app) wrapped in the provider
  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};
