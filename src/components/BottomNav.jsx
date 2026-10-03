import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Scan, TrendingUp, CloudSun, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { id: 'home', label: 'Home', path: '/', icon: Home },
    { id: 'disease', label: 'Disease', path: '/disease', icon: Scan },
    { id: 'market', label: 'Market', path: '/market', icon: TrendingUp },
    { id: 'environment', label: 'Advisory', path: '/environment', icon: CloudSun },
    { id: 'profile', label: 'Profile', path: '/profile', icon: User },
  ];

  // Helper to determine active item
  const getIsActive = (path) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '';
    }
    if (path === '/disease') {
      return location.pathname === '/disease' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <div className="bottom-nav-inner">
        {navItems.map((item) => {
          const isActive = getIsActive(item.path);
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => {
                navigate(item.path);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="bottom-nav-icon-wrapper">
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="bottom-nav-active-pill"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
                <Icon size={22} className="bottom-nav-icon" />
              </div>
              <span className="bottom-nav-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
