import React, { useState } from 'react';
import './App.css';
import ClientManagement from './components/ClientManagement';
import ShopManagement from './components/ShopManagement';
import AccountsManagement from './components/AccountsManagement';
import Navigation from './components/Navigation';

function App() {
  const [activeSection, setActiveSection] = useState('users');

  const renderContent = () => {
    switch (activeSection) {
      case 'users':
        return <ClientManagement />;
      case 'shops':
        return <ShopManagement />;
      case 'accounts':
        return <AccountsManagement />;
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
