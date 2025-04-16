import React, { useState } from "react";
import "./index.css";
import noise from "../assets/broken-noise.png";

function App() {
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div className="relative h-screen w-full overflow-hidden font-inter">
      {/* Noise Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${noise})`,
          backgroundSize: "repeat",
          mixBlendMode: "multiply",
          opacity: 0.15,
        }}
      />

      {/* Gradient Background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-gray-900 to-gray-800" />

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
          className="relative px-6 py-3 text-white text-lg rounded-lg font-semibold
            bg-gradient-to-b from-green-700 to-green-900/90
            bg-opacity-80 backdrop-blur-sm
            shadow-inner shadow-green-950
            hover:from-green-600 hover:to-green-800 hover:shadow-xl hover:shadow-green-700/50
            transition duration-300 ease-in-out overflow-hidden"
          onMouseMove={handleMouseMove}
          style={{
            "--x": `${coords.x}px`,
            "--y": `${coords.y}px`,
          }}
        >
          <span className="relative z-10">Log in with Spotify</span>

          {/* Cursor-following highlight */}
          <div
            className="absolute w-40 h-40 bg-white opacity-10 rounded-full pointer-events-none blur-xl transition-all duration-300"
            style={{
              top: `calc(var(--y) - 80px)`,
              left: `calc(var(--x) - 80px)`,
            }}
          />

          {/* Base gloss */}
          <div className="absolute top-0 left-0 w-full h-full bg-white opacity-5 pointer-events-none rounded-lg blur-sm z-0" />
        </button>
      </div>
    </div>
  );
}

export default App;
