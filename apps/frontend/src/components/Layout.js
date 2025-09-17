import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  MessageCircle, 
  BookOpen, 
  Brain, 
  Map, 
  Calendar, 
  LogOut,
  User,
  LayoutDashboard,
  Moon,
  Sun,
  GraduationCap,
  FolderOpen
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/modules', icon: GraduationCap, label: 'Modules' },
  { to: '/chat', icon: MessageCircle, label: 'Chat' },
  { to: '/library', icon: FolderOpen, label: 'Library' },
  { to: '/quiz', icon: Brain, label: 'Quiz' },
  { to: '/mastery', icon: Map, label: 'Mastery Map' },
  { to: '/planner', icon: Calendar, label: 'Planner' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-card shadow-sm border-r border-border">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-foreground">Study Buddy</h1>
          <p className="text-sm text-muted-foreground">One Inbox → One Brain → One Plan</p>
        </div>
        
        <nav className="mt-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-primary bg-primary/10 border-r-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card shadow-sm border-b border-border">
          <div className="flex justify-between items-center px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {navItems.find(item => item.to === location.pathname)?.label || 'Study Buddy'}
              </h2>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-foreground">{user?.name}</span>
              </div>
              
              <button
                onClick={toggleTheme}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}