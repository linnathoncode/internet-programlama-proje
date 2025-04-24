// import React, { useState } from "react";
import "./index.css";
import noise from "../assets/broken-noise.png";

function LoginPage() {
  const handleLogin = () => {
    window.location.href = "http://localhost:5017/api/Spotify/login"; // Redirects to your backend's /login
  };

  return (
    <div className="relative h-screen w-full overflow-hidden font-inter">
      {/* Noise Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${noise})`,
          backgroundSize: "repeat",
          mixBlendMode: "normal", // Change to 'normal' to avoid color blending issues
          opacity: 0.1, // Lower opacity if you want a subtle effect
        }}
      />
      {/* Gradient Background */}
      <div
        className="absolute inset-0 z-0 border-5 "
        style={{
          borderColor: "rgb(67, 154, 134)",
          backgroundImage: "linear-gradient(to right, #000000, #001f3d)", // black to blue-950
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
        <h1 className="text-white text-5xl md:text-6xl font-bold mb-6">
          Music Tracker
        </h1>
        <p className="text-white text-lg md:text-xl font-light mb-8 leading-relaxed">
          Track your recent listens.
          <br />
          Get personalized recommendations.
          <br />
          Create playlists and more.
        </p>

        <p className="text-white text-sm font-thin mb-6">
          To continue, log in with Spotify.
        </p>

        {/* Glossy Spotify Button */}
        <button
          type="submit"
          className="custom-login-button"
          onClick={handleLogin}
        >
          Login
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
