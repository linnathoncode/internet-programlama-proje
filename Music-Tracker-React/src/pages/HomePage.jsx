import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function HomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [limit, setLimit] = useState(1);

  const handleFetchRecentListens = async () => {
    try {
      const response = await fetch(`/api/spotify/recent?limit=${limit}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch recent listens");

      const data = await response.json();
      setTracks(data);
    } catch (err) {
      console.error("Error fetching recent listens", err);
      alert("Failed to fetch recent listens.");
    }
  };

  // cookie management is handled in the backend
  const handleLogout = async () => {
    try {
      const response = await fetch("/api/spotify/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Logout failed");

      window.location.href = "/login";
    } catch (err) {
      console.error("Error logging out:", err);
      alert("Logout failed.");
    }
  };

  // useEffect is a react hook
  // it runs side effects after component render
  // a side effect is anything that affects something outside react
  // like fetching data, updating the documnt title, subscribing to events
  // setting timers
  useEffect(() => {
    // When the component mount, make a request to check the authentication status
    fetch("/api/spotify/auth-status", {
      credentials: "include", // Include cookies with the request (contains jwt token)
    })
      .then((res) => {
        // If response is not OK -> throw error
        if (!res.ok) throw new Error("Network error");
        return res.json();
      })
      .then((data) => {
        // console.log(data.loggedIn);
        // If user is not logged in according to the respond, redirect to the login page
        if (!data.loggedIn) {
          navigate("/login");
          return;
        }
        // If user is authenticatd, save their info and stop the loading state
        setUserInfo(data);
        setLoading(false);
      })
      .catch((err) => {
        // If there is any error, redirect to the login page
        console.error("Auth check failed:", err);
        navigate("/login");
      });
  }, [navigate]);

  if (loading)
    return <p className="text-white text-center mt-10">Loading...</p>;

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-primary via-secondary to-black text-white font-inter selection:bg-accent selection:text-white relative">
      {/* Noise Overlay */}
      <div className="bg-[url('../assets/broken-noise.png')] bg-repeat mix-blend-screen absolute inset-0 opacity-100 z-0" />

      {/* Sidebar */}
      <aside className="relative z-10 w-64 p-6 border-r border-white/10 bg-black/30 backdrop-blur-md hidden md:block">
        <div className="mb-8">
          <h2 className="text-xl font-bold">Your Profile</h2>
          <p className="text-sm text-gray-300">User Name</p>
        </div>
        <nav className="space-y-4">
          <button className="block w-full text-left px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition">
            Dashboard
          </button>
          <button className="block w-full text-left px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition">
            Listen History
          </button>
          <button className="block w-full text-left px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition">
            Settings
          </button>
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
          >
            Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="relative z-10 flex-1 p-6 md:p-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 drop-shadow-lg">
          Welcome, User!
        </h1>

        {/* Retrieve Options */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <label className="text-lg font-medium">
            How many recent listens?
          </label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="bg-black/30 border border-white/20 rounded-lg px-4 py-2 text-white backdrop-blur-md shadow-sm"
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>

          <button
            onClick={handleFetchRecentListens}
            className="px-6 py-2 bg-primary hover:bg-secondary text-white rounded-full shadow-lg transition duration-300"
          >
            Get Recent Listens
          </button>
        </div>

        {/* List of Tracks */}
        <ul className="space-y-4">
          {tracks.map((track, index) => (
            <li
              key={index}
              className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 backdrop-blur-md shadow-sm"
            >
              <div className="w-16 h-16 bg-gray-300/10 rounded-md" />
              <div>
                <p className="font-semibold text-lg">{track.trackName}</p>
                <p className="text-sm text-gray-300">{track.artistName}</p>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}

export default HomePage;
