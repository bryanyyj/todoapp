import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first, then system preference
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    // Default to dark mode for polytechnic students (easier on eyes for long study sessions)
    return window.matchMedia('(prefers-color-scheme: dark)').matches || true;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    
    // Update CSS custom properties and document class
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.setProperty('--background', '222.2 84% 4.9%');
      document.documentElement.style.setProperty('--foreground', '210 40% 98%');
      document.documentElement.style.setProperty('--card', '222.2 84% 4.9%');
      document.documentElement.style.setProperty('--card-foreground', '210 40% 98%');
      document.documentElement.style.setProperty('--popover', '222.2 84% 4.9%');
      document.documentElement.style.setProperty('--popover-foreground', '210 40% 98%');
      document.documentElement.style.setProperty('--primary', '217.2 91.2% 59.8%');
      document.documentElement.style.setProperty('--primary-foreground', '222.2 84% 4.9%');
      document.documentElement.style.setProperty('--secondary', '217.2 32.6% 17.5%');
      document.documentElement.style.setProperty('--secondary-foreground', '210 40% 98%');
      document.documentElement.style.setProperty('--muted', '217.2 32.6% 17.5%');
      document.documentElement.style.setProperty('--muted-foreground', '215 20.2% 65.1%');
      document.documentElement.style.setProperty('--accent', '217.2 32.6% 17.5%');
      document.documentElement.style.setProperty('--accent-foreground', '210 40% 98%');
      document.documentElement.style.setProperty('--destructive', '0 62.8% 30.6%');
      document.documentElement.style.setProperty('--destructive-foreground', '210 40% 98%');
      document.documentElement.style.setProperty('--border', '217.2 32.6% 17.5%');
      document.documentElement.style.setProperty('--input', '217.2 32.6% 17.5%');
      document.documentElement.style.setProperty('--ring', '224.3 76.3% 58%');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.setProperty('--background', '0 0% 100%');
      document.documentElement.style.setProperty('--foreground', '222.2 84% 4.9%');
      document.documentElement.style.setProperty('--card', '0 0% 100%');
      document.documentElement.style.setProperty('--card-foreground', '222.2 84% 4.9%');
      document.documentElement.style.setProperty('--popover', '0 0% 100%');
      document.documentElement.style.setProperty('--popover-foreground', '222.2 84% 4.9%');
      document.documentElement.style.setProperty('--primary', '221.2 83.2% 53.3%');
      document.documentElement.style.setProperty('--primary-foreground', '210 40% 98%');
      document.documentElement.style.setProperty('--secondary', '210 40% 96%');
      document.documentElement.style.setProperty('--secondary-foreground', '222.2 84% 4.9%');
      document.documentElement.style.setProperty('--muted', '210 40% 96%');
      document.documentElement.style.setProperty('--muted-foreground', '215.4 16.3% 46.9%');
      document.documentElement.style.setProperty('--accent', '210 40% 96%');
      document.documentElement.style.setProperty('--accent-foreground', '222.2 84% 4.9%');
      document.documentElement.style.setProperty('--destructive', '0 84.2% 60.2%');
      document.documentElement.style.setProperty('--destructive-foreground', '210 40% 98%');
      document.documentElement.style.setProperty('--border', '214.3 31.8% 91.4%');
      document.documentElement.style.setProperty('--input', '214.3 31.8% 91.4%');
      document.documentElement.style.setProperty('--ring', '221.2 83.2% 53.3%');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const value = {
    isDarkMode,
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};