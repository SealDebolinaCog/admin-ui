import React from 'react';

interface SuccessMessageProps {
  message: string;
  onClose: () => void;
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({ message, onClose }) => {
  return (
    <div className="success-message" style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: '#d4edda',
      color: '#155724',
      padding: '15px 20px',
      borderRadius: '5px',
      border: '1px solid #c3e6cb',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      maxWidth: '400px'
    }}>
      <span className="success-icon" style={{ fontSize: '20px' }}>✅</span>
      <p style={{ margin: 0, flex: 1 }}>{message}</p>
      <button 
        onClick={onClose} 
        className="close-success-btn"
        style={{
          background: 'none',
          border: 'none',
          fontSize: '18px',
          cursor: 'pointer',
          color: '#155724',
          padding: '0',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        ✕
      </button>
    </div>
  );
};

export default SuccessMessage; 