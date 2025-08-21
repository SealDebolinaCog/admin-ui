import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './UserManagement.css';

interface Client {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  status: string;
}

interface ClientSearchDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
  onClientSelect?: (client: Client) => void;
}

const ClientSearchDropdown: React.FC<ClientSearchDropdownProps> = ({
  value,
  onChange,
  placeholder = "Search for a client...",
  className = "",
  error = false,
  onClientSelect
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sync searchTerm with value prop when it changes
  useEffect(() => {
    if (value && value !== searchTerm) {
      setSearchTerm(value);
    }
  }, [value]);

  // Search clients when search term changes
  useEffect(() => {
    const searchClients = async () => {
      if (searchTerm.length < 2) {
        setClients([]);
        return;
      }

      setLoading(true);
              setSearchError(null);
      
      try {
        const response = await axios.get(`/api/clients?search=${encodeURIComponent(searchTerm)}`);
        if (response.data.success) {
          setClients(response.data.data || []);
        } else {
          setSearchError('Failed to fetch clients');
        }
      } catch (err) {
        console.error('Error searching clients:', err);
        setSearchError('Failed to search clients');
        setClients([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchClients, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleInputChange = (inputValue: string) => {
    setSearchTerm(inputValue);
    onChange(inputValue);
    setIsOpen(true);
  };

  const handleClientSelect = (client: Client) => {
    const fullName = `${client.firstName} ${client.lastName}`.trim();
    onChange(fullName);
    setSearchTerm(fullName);
    setIsOpen(false);
    
    if (onClientSelect) {
      onClientSelect(client);
    }
  };

  const getClientDisplayName = (client: Client) => {
    const fullName = `${client.firstName} ${client.lastName}`.trim();
    const details = [];
    
    if (client.email) details.push(client.email);
    if (client.phone) details.push(client.phone);
    
    return {
      name: fullName,
      details: details.length > 0 ? details.join(' • ') : 'No contact info'
    };
  };

  const getClientInitials = (client: Client) => {
    const firstInitial = client.firstName?.charAt(0)?.toUpperCase() || '';
    const lastInitial = client.lastName?.charAt(0)?.toUpperCase() || '';
    return `${firstInitial}${lastInitial}`;
  };

  return (
    <div className={`client-search-dropdown ${className}`} ref={dropdownRef}>
      <div className="search-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`search-input ${error ? 'error' : ''}`}
          autoComplete="off"
        />
        <span className="search-icon">🔍</span>
        {searchTerm && (
          <button
            type="button"
            className="clear-search-btn"
            onClick={() => {
              setSearchTerm('');
              onChange('');
              setIsOpen(false);
            }}
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && (
        <div className="dropdown-menu">
          {loading && (
            <div className="dropdown-loading">
              <div className="loading-spinner"></div>
              <span>Searching clients...</span>
            </div>
          )}

          {searchError && (
            <div className="dropdown-error">
              <span>⚠️ {searchError}</span>
            </div>
          )}

          {!loading && !searchError && clients.length === 0 && searchTerm.length >= 2 && (
            <div className="dropdown-empty">
              <span>No clients found</span>
            </div>
          )}

          {!loading && !searchError && clients.length > 0 && (
            <div className="clients-list">
              {clients.map((client) => {
                const display = getClientDisplayName(client);
                return (
                  <div
                    key={client.id}
                    className="client-option"
                    onClick={() => handleClientSelect(client)}
                  >
                    <div className="client-option-avatar">
                      {getClientInitials(client)}
                    </div>
                    <div className="client-option-info">
                      <div className="client-option-name">{display.name}</div>
                      <div className="client-option-details">{display.details}</div>
                    </div>
                    <div className="client-option-status">
                      <span className={`status-badge ${client.status}`}>
                        {client.status === 'active' ? '🟢' : 
                         client.status === 'suspended' ? '🟠' : '⚫'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {searchTerm.length < 2 && (
            <div className="dropdown-hint">
              <span>Type at least 2 characters to search</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientSearchDropdown; 