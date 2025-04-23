import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function HomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    fetch("/api/spotify/auth-status", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Network error");
        return res.json();
      })
      .then((data) => {
        console.log(data.loggedIn);
        if (!data.loggedIn) {
          navigate("/login");
          return;
        }
        // Authenticated
        setUserInfo(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Auth check failed:", err);
        navigate("/login");
      });
  }, [navigate]);
  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h1>Welcome {userInfo?.display_name || "User"}!</h1>
    </div>
  );
}

export default HomePage;
