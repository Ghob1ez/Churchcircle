import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  useNavigate,
  Link,
  useLocation
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "./lib/firebase";
import { LogOut, Calendar, List, Shield, PlusCircle, ShieldAlert, CircleDot, Menu, X, Users, UserCircle, Settings, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";
import { Dropdown } from "./components/ui/Dropdown";

const CCLogo = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center justify-center bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-200 ring-1 ring-white/20", className)}>
    <span className="text-[10px] tracking-tighter">CC</span>
  </div>
);

// --- Components ---
const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  
  const isAdmin = role === "admin" || user.email?.toLowerCase() === "georgeghobrial97@gmail.com";
  if (adminOnly && !isAdmin) return <Navigate to="/my-requests" replace />;

  return <>{children}</>;
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, role, error: authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const isAdmin = role === "admin" || user?.email?.toLowerCase() === "georgeghobrial97@gmail.com";

  const navItems = [
    { name: "My Requests", path: "/my-requests", icon: List, show: !!user },
    { name: "New Booking", path: "/request", icon: PlusCircle, show: !!user },
    { name: "Approvals", path: "/admin", icon: Shield, show: isAdmin },
    { name: "Users", path: "/admin/users", icon: Users, show: isAdmin },
    { name: "Availability", path: "/admin/availability", icon: ShieldAlert, show: isAdmin },
  ];

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900">
      {authError && (
        <div className="bg-red-600 text-white px-4 py-3 text-center text-sm font-bold">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
            <Shield className="h-5 w-5" />
            <span>{authError}</span>
          </div>
        </div>
      )}
      <nav className="sticky top-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-indigo-600">
            <CCLogo className="h-8 w-8 text-sm" />
            <span>ChurchCircle</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1 bg-neutral-100/50 p-1 rounded-2xl border border-neutral-200/50">
            {navItems.filter(i => i.show).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 text-sm font-bold transition-all rounded-xl relative",
                  location.pathname === item.path 
                    ? "text-indigo-600" 
                    : "text-neutral-500 hover:text-neutral-900"
                )}
              >
                {location.pathname === item.path && (
                  <motion.div
                    layoutId="nav-tab"
                    className="absolute inset-0 bg-white shadow-sm rounded-xl border border-neutral-200/50"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <item.icon className={cn("h-4 w-4 relative z-10", location.pathname === item.path ? "text-indigo-600" : "text-neutral-400")} />
                <span className="relative z-10">{item.name}</span>
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-2">
            {user && (
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-neutral-200">
                <Dropdown
                  trigger={
                    <button className="flex items-center gap-2 px-2 py-1 rounded-xl bg-neutral-50 border border-neutral-100 hover:bg-neutral-100 transition-all group">
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt={user.displayName || "User"} 
                          className="h-6 w-6 rounded-full object-cover ring-1 ring-white"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600 ring-1 ring-white">
                          {user.email?.charAt(0).toUpperCase() || "U"}
                        </div>
                      )}
                      <span className="hidden xl:block text-xs font-bold text-neutral-600 max-w-[100px] truncate">
                        {user.displayName || user.email?.split("@")[0]}
                      </span>
                      <ChevronDown className="h-3 w-3 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
                    </button>
                  }
                  items={[
                    { label: "Edit Details", onClick: () => navigate("/profile"), icon: Settings },
                    { label: "Logout", onClick: handleLogout, icon: LogOut, variant: "danger" }
                  ]}
                />
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-neutral-100 text-neutral-600 hover:text-indigo-600 transition-all"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-neutral-100 bg-white overflow-hidden"
            >
              <div className="px-4 py-6 space-y-2">
                {user && (
                  <div className="flex items-center gap-3 p-3 mb-2 bg-neutral-50 rounded-2xl border border-neutral-100">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || "User"} 
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600 ring-2 ring-white">
                        {user.email?.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-neutral-900">{user.displayName || user.email?.split("@")[0]}</span>
                      <span className="text-[10px] text-neutral-500 truncate max-w-[150px]">{user.email}</span>
                    </div>
                  </div>
                )}
                <div className="bg-neutral-100/50 p-1 rounded-2xl border border-neutral-200/50 space-y-1">
                  {navItems.filter(i => i.show).map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-base font-bold rounded-xl transition-all relative",
                        location.pathname === item.path 
                          ? "text-indigo-600" 
                          : "text-neutral-500 hover:text-neutral-900"
                      )}
                    >
                      {location.pathname === item.path && (
                        <motion.div
                          layoutId="nav-tab-mobile"
                          className="absolute inset-0 bg-white shadow-sm rounded-xl border border-neutral-200/50"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <item.icon className={cn("h-5 w-5 relative z-10", location.pathname === item.path ? "text-indigo-600" : "text-neutral-400")} />
                      <span className="relative z-10">{item.name}</span>
                    </Link>
                  ))}
                </div>
                
                {user && (
                  <>
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-3 text-base font-bold text-neutral-600 rounded-2xl transition-all hover:bg-neutral-50"
                    >
                      <Settings className="h-5 w-5" />
                      <span>Edit Details</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-base font-bold text-red-600 rounded-2xl transition-all hover:bg-red-50"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Logout</span>
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

// --- Pages (Placeholders for now, will be implemented in separate files) ---
import Login from "./pages/Login";
import RequestBooking from "./pages/RequestBooking";
import MyRequests from "./pages/MyRequests";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRequestDetail from "./pages/AdminRequestDetail";
import AdminAvailability from "./pages/AdminAvailability";
import AdminUsers from "./pages/AdminUsers";
import AdminUserDetail from "./pages/AdminUserDetail";
import Profile from "./pages/Profile";

import { ErrorBoundary } from "./components/ErrorBoundary";

const RootRedirect = () => {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  const isAdmin = role === "admin" || user?.email?.toLowerCase() === "georgeghobrial97@gmail.com";
  return isAdmin ? <Navigate to="/admin" replace /> : <Navigate to="/my-requests" replace />;
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RootRedirect />} />
          
          <Route path="/request" element={
            <ProtectedRoute>
              <Layout><RequestBooking /></Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/my-requests" element={
            <ProtectedRoute>
              <Layout><MyRequests /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/my-requests/:id" element={
            <ProtectedRoute>
              <Layout><AdminRequestDetail /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <Layout><AdminDashboard /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/admin/requests/:id" element={
            <ProtectedRoute adminOnly>
              <Layout><AdminRequestDetail /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/admin/availability" element={
            <ProtectedRoute adminOnly>
              <Layout><AdminAvailability /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <Layout><Profile /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/admin/users" element={
            <ProtectedRoute adminOnly>
              <Layout><AdminUsers /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/admin/users/:id" element={
            <ProtectedRoute adminOnly>
              <Layout><AdminUserDetail /></Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
    </ErrorBoundary>
  );
}
