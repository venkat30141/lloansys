import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Login from './pages/Auth/Login'
import Admin from './pages/Admin'
import Lender from './pages/Lender'
import Borrower from './pages/Borrower'
import Analyst from './pages/Analyst'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/lender" element={<Lender />} />
      <Route path="/borrower" element={<Borrower />} />
      <Route path="/analyst" element={<Analyst />} />
    </Routes>
  )
}
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import LenderDashboard from "./pages/Lender/LenderDashboard";
import BorrowerDashboard from "./pages/Borrower/BorrowerDashboard";
import AnalystDashboard from "./pages/Analyst/AnalystDashboard";
import Login from "./pages/Auth/Login";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/lender" element={<LenderDashboard />} />
        <Route path="/borrower" element={<BorrowerDashboard />} />
        <Route path="/analyst" element={<AnalystDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
