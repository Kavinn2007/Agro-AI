import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Scan, TrendingUp, CloudSun } from 'lucide-react';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', path: '/', icon: Home },
  { id: 'disease', label: 'Disease', path: '/disease', icon: Scan },
  { id: 'market', label: 'Market', path: '/market', icon: TrendingUp },
  { id: 'environment', label: 'Environment', path: '/environment', icon: CloudSun },
];

const TAB_INDEX = {
  '/': 0,
  '/disease': 1,
  '/dashboard': 1,
  '/market': 2,
  '/environment': 3,
};

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
      const currentTab = TAB_INDEX[location.pathname] ?? 0;
      const targetTab = TAB_INDEX[path] ?? 0;
      const direction = targetTab >= currentTab ? 'forward' : 'backward';

      if (typeof document !== 'undefined' && 'startViewTransition' in document && typeof document.startViewTransition === 'function') {
        document.documentElement.dataset.navDirection = direction;
        try {
          const transition = document.startViewTransition(() => {
            navigate(path);
          });
          transition.finished
            .catch(() => {})
            .finally(() => {
              if (document.documentElement.dataset.navDirection === direction) {
                delete document.documentElement.dataset.navDirection;
              }
            });
        } catch {
          delete document.documentElement.dataset.navDirection;
          navigate(path);
        }
      } else {
        navigate(path);
      }
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
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="bottom-nav-active-pill"
                  transition={{
                    type: 'spring',
                    stiffness: 440,
                    damping: 34,
                    mass: 0.65,
                  }}
                />
              )}
              <div className="bottom-nav-item-content">
                <div className="bottom-nav-icon-wrapper">
                  <Icon
                    size={20}
                    className="bottom-nav-icon"
                    strokeWidth={isActive ? 2.25 : 1.75}
                  />
                </div>
                <span className="bottom-nav-label">{item.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

