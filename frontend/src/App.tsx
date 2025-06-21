import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Navbar from "./components/Navbar";
import NavbarHorizontal from "./components/NavbarHorizontal";
import { AuthProvider } from "./context/AuthContext";
import UserHistory from "./pages/UserHistory";
import NewsPortal from "./pages/NewsPortal";
import NewsDetail from "./pages/NewsDetails";
import Home from "./pages/Home";
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/history" element={<UserHistory />} />
          <Route path="/news/portal" element={<NewsPortal />} />
          <Route path="/news/:id" element={<NewsDetail />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
