import React, { useState } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import ClientManagement from './components/ClientManagement';
import ShopManagement from './components/ShopManagement';
import AccountsManagement from './components/AccountsManagement';
import ShopInsights from './components/ShopInsights';
import Navigation from './components/Navigation';

function App() {
  const [activeSection, setActiveSection] = useState('users');

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'users':
        return <ClientManagement />;
      case 'shops':
        return <ShopManagement />;
      case 'accounts':
        return <AccountsManagement />;
      case 'shop-insights':
        return <ShopInsights />;
      default:
        return <ClientManagement />;
    }
  };

  return (
    <div className="App">
      <Navigation activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
