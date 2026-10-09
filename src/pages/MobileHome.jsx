import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Scan, TrendingUp, CloudSun, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const CORE_FEATURES = [
  {
    id: 'disease',
    title: 'Disease Detection',
    subtitle: 'AI leaf diagnosis & remedies',
    path: '/disease',
    icon: Scan,
  },
  {
    id: 'market',
    title: 'Market',
    subtitle: 'Real-time Mandi wholesale rates',
    path: '/market',
    icon: TrendingUp,
  },
  {
    id: 'environment',
    title: 'Environment',
    subtitle: 'Local weather & climate insights',
    path: '/environment',
    icon: CloudSun,
  },
];

export default function MobileHome() {
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    if (typeof document !== 'undefined' && 'startViewTransition' in document && typeof document.startViewTransition === 'function') {
      document.documentElement.dataset.navDirection = 'forward';
      try {
        const transition = document.startViewTransition(() => {
          navigate(path);
        });
        transition.finished
          .catch(() => {})
          .finally(() => {
            if (document.documentElement.dataset.navDirection === 'forward') {
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
  };

  return (
    <div className="mobile-page-content mobile-home-screen">
      <div className="home-hero-section">
        <span className="home-eyebrow">AgroAI Intelligence</span>
        <h1 className="home-main-title">Crop Intelligence</h1>
        <p className="home-hero-subtitle">
          Plant disease diagnosis, real-time Mandi market rates, and local microclimate intelligence.
        </p>
      </div>

      <div className="home-actions-list">
        {CORE_FEATURES.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.id}
              className="home-action-card"
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNavigate(feature.path)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleNavigate(feature.path);
                }
              }}
              aria-label={`Open ${feature.title}`}
            >
              <div className="action-card-left">
                <div className="action-icon-wrap">
                  <Icon size={22} />
                </div>
                <div className="action-card-text">
                  <span className="action-card-title">{feature.title}</span>
                  <span className="action-card-subtitle">{feature.subtitle}</span>
                </div>
              </div>
              <ChevronRight size={18} className="action-card-arrow" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
