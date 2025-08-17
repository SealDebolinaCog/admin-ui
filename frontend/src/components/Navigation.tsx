import React, { useState } from 'react';
import './Navigation.css';

interface NavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeSection, onSectionChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigationItems = [
    {
      id: 'users',
      label: 'Clients',
      icon: '👥',
      description: 'Client management'
    },
    {
      id: 'shops',
      label: 'Shop',
      icon: '🏪',
      description: 'Shop management'
    },
    {
      id: 'dashboard',
      label: 'Accounts',
      icon: '📊',
      description: 'Account overview and management'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: '📈',
      description: 'Reports and insights'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: '🔔',
      description: 'Alerts and messages'
    }
  ];

  const bottomNavigationItems = [
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      description: 'System configuration'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: '👤',
      description: 'User profile settings'
    }
  ];

  return (
    <nav className={`navigation ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="nav-header">
        <div className="nav-user-header">
          <span className="user-avatar">👨‍💼</span>
          {!isCollapsed && (
            <div className="user-info">
              <span className="user-name">Admin User</span>
              <span className="user-role">Administrator</span>
            </div>
          )}
        </div>
        <button 
          className="nav-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? '▶️' : '◀️'}
        </button>
      </div>

      <div className="nav-menu">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => onSectionChange(item.id)}
            title={isCollapsed ? item.label : item.description}
          >
            <span className="nav-icon">{item.icon}</span>
            {!isCollapsed && (
              <div className="nav-content">
                <span className="nav-label">{item.label}</span>
                <span className="nav-description">{item.description}</span>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="nav-footer">
        <div className="nav-bottom-items">
          {bottomNavigationItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => onSectionChange(item.id)}
              title={isCollapsed ? item.label : item.description}
            >
              <span className="nav-icon">{item.icon}</span>
              {!isCollapsed && (
                <div className="nav-content">
                  <span className="nav-label">{item.label}</span>
                  <span className="nav-description">{item.description}</span>
                </div>
              )}
            </button>
          ))}
        </div>

        <button 
          className="nav-logout"
          title="Logout"
          onClick={() => console.log('Logout clicked')}
        >
          <span className="logout-icon">🚪</span>
          {!isCollapsed && <span className="logout-text">Logout</span>}
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
