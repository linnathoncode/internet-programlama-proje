import { createBrowserRouter } from "react-router-dom";
import Landing from "../pages/Landing";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import NotFound from "../pages/NotFound";
import AuthenticatedLayout from "../layouts/AuthenticatedLayout";
import PublicLayout from "../layouts/PublicLayout";
import { RequireAuth } from "./RequireAuth"; // custom guard

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <Landing /> },
      { path: "/login", element: <Login /> },
    ],
  },
  {
    element: <AuthenticatedLayout />,
    children: [
      {
        path: "/dashboard",
        element: (
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        ),
      },
      {
        path: "/playlist-builder",
        element: (
          <RequireAuth>
            <PlaylistBuilder />
          </RequireAuth>
        ),
      },
    ],
  },
  { path: "*", element: <NotFound /> },
]);
