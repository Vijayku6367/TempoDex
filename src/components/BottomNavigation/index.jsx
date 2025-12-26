import React from 'react';
import './BottomNavigation.css';

import SwapIcon from '../../assets/icons/swap.svg';
import LiquidityIcon from '../../assets/icons/liquidity.svg';
import DashboardIcon from '../../assets/icons/dashboard.svg';

const BottomNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'swap', label: 'Swap', icon: SwapIcon },
    { id: 'liquidity', label: 'Liquidity', icon: LiquidityIcon },
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
  ];

  return (
    <nav className="bottom-navigation">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`nav-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <img src={tab.icon} alt={tab.label} className="nav-icon" />
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNavigation;
