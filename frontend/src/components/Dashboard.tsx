import React from 'react';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome to your Admin UI dashboard</p>
      </div>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Users</h3>
            <p className="stat-number">1,234</p>
            <span className="stat-change positive">+12% from last month</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Active Sessions</h3>
            <p className="stat-number">89</p>
            <span className="stat-change positive">+5% from yesterday</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Revenue</h3>
            <p className="stat-number">$45,678</p>
            <span className="stat-change negative">-2% from last week</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🚀</div>
          <div className="stat-content">
            <h3>Performance</h3>
            <p className="stat-number">98.5%</p>
            <span className="stat-change positive">+0.3% uptime</span>
          </div>
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="dashboard-section">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            <div className="activity-item">
              <span className="activity-icon">👤</span>
              <div className="activity-details">
                <p>New user registered: john.doe@example.com</p>
                <span className="activity-time">2 minutes ago</span>
              </div>
            </div>
            <div className="activity-item">
              <span className="activity-icon">⚙️</span>
              <div className="activity-details">
                <p>System configuration updated</p>
                <span className="activity-time">15 minutes ago</span>
              </div>
            </div>
            <div className="activity-item">
              <span className="activity-icon">📈</span>
              <div className="activity-details">
                <p>Monthly report generated</p>
                <span className="activity-time">1 hour ago</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <button className="action-btn primary">
              <span>👥</span>
              Add New User
            </button>
            <button className="action-btn secondary">
              <span>📊</span>
              Generate Report
            </button>
            <button className="action-btn secondary">
              <span>⚙️</span>
              System Settings
            </button>
            <button className="action-btn secondary">
              <span>🔔</span>
              Send Notification
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
