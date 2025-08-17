import React, { useState } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import ShopManagement from './components/ShopManagement';
import './App.css';

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'users':
        return <UserManagement />;
      case 'shops':
        return <ShopManagement />;
      case 'settings':
        return (
          <div className="content-section">
            <h1>Settings</h1>
            <p>System configuration and preferences</p>
            <div className="coming-soon">
              <span>⚙️</span>
              <h3>Coming Soon</h3>
              <p>Settings panel is under development</p>
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="content-section">
            <h1>Analytics</h1>
            <p>Reports and data insights</p>
            <div className="coming-soon">
              <span>📈</span>
              <h3>Coming Soon</h3>
              <p>Analytics dashboard is under development</p>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="content-section">
            <h1>Notifications</h1>
            <p>System alerts and messages</p>
            <div className="coming-soon">
              <span>🔔</span>
              <h3>Coming Soon</h3>
              <p>Notification center is under development</p>
            </div>
          </div>
        );
      case 'profile':
        return (
          <div className="content-section">
            <h1>Profile</h1>
            <p>User profile and account settings</p>
            <div className="coming-soon">
              <span>👤</span>
              <h3>Coming Soon</h3>
              <p>Profile management is under development</p>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="App">
      <Navigation 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <main className="App-main">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
