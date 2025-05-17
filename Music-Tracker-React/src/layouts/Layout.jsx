// src/components/Layout.js
import React from "react";

const Layout = ({ children }) => {
  return (
    // This div contains the main content area
    // Flex-1 allows it to grow and take available space
    // min-w-0 is important in flex containers to prevent content from overflowing
    <main className="relative z-10 p-6 md:p-10 flex-1 min-w-0">{children}</main>
  );
};

export default Layout;
