import React from "react";

const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white shadow flex items-center px-4 md:pl-16 z-10">
      <h1 className="text-2xl font-bold text-gray-800">InfoSift</h1>
    </header>
  );
};

export default Header;
