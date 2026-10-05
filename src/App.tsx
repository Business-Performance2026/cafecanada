import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import Login from "./pages/Login"
import NotFound from "./pages/NotFound"
import CafePage from "./pages/CafePage"
import Dashboard from "./pages/Dashboard"
import Register from "./pages/Register"
import Admin from "./pages/Admin"
import { firebaseReady } from "@/lib/firebase"
import { FirebaseSetupNotice } from "@/components/FirebaseSetupNotice"
import { Header } from "@/components/Header"

function SetupScreen() {
  return (
    <div className="min-h-screen bg-[#faf7f2]">
      <Header />
      <FirebaseSetupNotice />
    </div>
  )
}

export default function App() {
  if (!firebaseReady) return <SetupScreen />
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/c/:slug" element={<CafePage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
