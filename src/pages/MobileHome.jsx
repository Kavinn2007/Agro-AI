import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Scan, TrendingUp, CloudSun, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MobileHome() {
  const navigate = useNavigate();

  const actions = [
    {
      id: 'disease',
      title: 'Disease Detection',
      path: '/disease',
      icon: Scan,
    },
    {
      id: 'market',
      title: 'Market',
      path: '/market',
      icon: TrendingUp,
    },
    {
      id: 'environment',
      title: 'Environment',
      path: '/environment',
      icon: CloudSun,
    },
  ];

  return (
    <div className="mobile-page-content mobile-home-screen">
      <div className="home-actions-list">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.id}
              className="home-action-card"
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(action.path)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.25 }}
            >
              <div className="action-card-left">
                <div className="action-icon-wrap">
                  <Icon size={24} />
                </div>
                <span className="action-card-title">{action.title}</span>
              </div>
              <ChevronRight size={20} className="action-card-arrow" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
