import { useState } from "react";
import "./App.css";
import { BrowserRouter } from "react-router";
import Home from "./pages/Home";

function App() {
  return (
    <BrowserRouter>
      <Home />
    </BrowserRouter>
  );
}

export default App;
