import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Auth/Login";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import BorrowerDashboard from "./pages/Borrower/BorrowerDashboard";
import LenderDashboard from "./pages/Lender/LenderDashboard";
import AnalystDashboard from "./pages/Analyst/AnalystDashboard";
import "./index.css"; // ✅ make sure global CSS is imported

function App() {
  return (
    // ✅ BrowserRouter must wrap all Routes
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/borrower" element={<BorrowerDashboard />} />
        <Route path="/lender" element={<LenderDashboard />} />
        <Route path="/analyst" element={<AnalystDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
