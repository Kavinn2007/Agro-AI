import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Scan, TrendingUp, CloudSun } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', path: '/', icon: Home },
  { id: 'disease', label: 'Disease', path: '/disease', icon: Scan },
  { id: 'market', label: 'Market', path: '/market', icon: TrendingUp },
  { id: 'environment', label: 'Environment', path: '/environment', icon: CloudSun },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const getIsActive = (path) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '';
    }
    if (path === '/disease') {
      return location.pathname === '/disease' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavClick = (path) => {
    const isCurrent = getIsActive(path);
    if (!isCurrent) {
      navigate(path);
      window.scrollTo(0, 0);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <div className="bottom-nav-inner">
        {NAV_ITEMS.map((item) => {
          const isActive = getIsActive(item.path);
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.path)}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="bottom-nav-icon-wrapper">
                <Icon size={20} className="bottom-nav-icon" />
              </div>
              <span className="bottom-nav-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

