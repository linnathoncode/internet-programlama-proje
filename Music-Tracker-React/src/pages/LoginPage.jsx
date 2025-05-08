// import React, { useState } from "react";
import "./index.css";
import noise from "../assets/broken-noise.png";

function LoginPage() {
  const handleLogin = () => {
    window.location.href = "http://localhost:5017/api/Spotify/login"; // Redirects to your backend's /login
  };

  return (
    <div className="relative h-screen w-full overflow-hidden font-inter selection:bg-accent selection:text-white">
      {/* Noise Background */}
      {/* <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${noise})`,
          backgroundSize: "repeat",
          mixBlendMode: "screen", // Change to 'normal' to avoid color blending issues
          opacity: 1, // Lower opacity if you want a subtle effect
        }}
      /> */}

      {/* Gradient Background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary via-secondary to-black" />
      <div className="absolute inset-0 z-0 bg-[url('../assets/broken-noise.png')] bg-repeat opacity-50 mix-blend-screen" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
        <h1 className="text-white text-5xl md:text-6xl font-bold mb-6 drop-shadow-lg">
          Music Tracker
        </h1>
        <p className="text-white text-lg md:text-xl font-light mb-8 leading-relaxed drop-shadow">
          Track your recent listens.
          <br />
          Get personalized recommendations.
          <br />
          Create playlists and more.
        </p>

        <p className="text-white text-sm font-thin mb-6 drop-shadow">
          To continue, log in with Spotify.
        </p>

        {/* Glossy Spotify Button */}
        <button
          type="submit"
          className="px-6 py-3 bg-primary hover:bg-secondary text-white font-medium rounded-full shadow-lg transition duration-300 ease-in-out backdrop-blur-md border border-white/20"
          onClick={handleLogin}
        >
          Login
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
