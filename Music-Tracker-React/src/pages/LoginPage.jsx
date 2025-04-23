function LoginPage() {
  const handleLogin = () => {
    window.location.href = "http://localhost:5017/api/Spotify/login"; // Redirects to your backend's /login
  };

  return (
    <div>
      <h1>Login with Spotify</h1>
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default LoginPage;
