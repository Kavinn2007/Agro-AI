import React from 'react';
import MobileHeader from './MobileHeader';
import BottomNav from './BottomNav';

export default function MobileAppLayout({ children }) {
  return (
    <div className="mobile-app-root">
      {/* Ambient background for desktop presentation */}
      <div className="desktop-ambient-glow" />

      {/* Main mobile viewport container */}
      <div className="mobile-app-container">
        {/* Top App Header */}
        <MobileHeader />

        {/* Dynamic Screen View */}
        <main className="mobile-main-viewport">
          {children}
        </main>

        {/* Bottom App Navigation */}
        <BottomNav />
      </div>
    </div>
  );
}
