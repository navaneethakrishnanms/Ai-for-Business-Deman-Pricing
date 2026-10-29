import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { formatINR } from '../../utils/formatters';

export const SearchableSelect = ({
  items = [],
  value,
  onChange,
  placeholder = 'Select a menu item...',
  style = {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  const selectedItem = items.find(it => it.item_id === value) || items[0];

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Filter items based on search query
  const filteredItems = items.filter(it => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      it.name.toLowerCase().includes(q) ||
      it.item_id.toLowerCase().includes(q) ||
      (it.kind && it.kind.toLowerCase().includes(q))
    );
  });

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', ...style }}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchTerm('');
        }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--bg-surface-inset)',
          border: '1px solid var(--border-medium)',
          color: 'var(--text-primary)',
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: 'pointer',
          textAlign: 'left',
          boxShadow: 'var(--shadow-card)',
          transition: 'border-color 0.15s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          {selectedItem ? (
            <>
              <span style={{
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: selectedItem.kind === 'main' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                color: selectedItem.kind === 'main' ? 'var(--accent-green)' : 'var(--accent-blue)',
                border: selectedItem.kind === 'main' ? '1px solid var(--accent-green-border)' : '1px solid rgba(56, 189, 248, 0.3)',
                flexShrink: 0
              }}>
                {selectedItem.kind}
              </span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedItem.name}
              </span>
              <span className="mono" style={{ color: 'var(--accent-green)', fontSize: '0.8rem', marginLeft: 'auto', flexShrink: 0 }}>
                {formatINR(selectedItem.price)}
              </span>
            </>
          ) : (
            <span style={{ color: 'var(--text-secondary)' }}>{placeholder}</span>
          )}
        </div>

        <ChevronDown size={14} color="var(--text-secondary)" style={{ flexShrink: 0, marginLeft: '6px' }} />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          backgroundColor: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-strong)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-modal)',
          zIndex: 1000,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Search Input Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface-inset)'
          }}>
            <Search size={14} color="var(--text-secondary)" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search dishes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '0.8rem',
                color: 'var(--text-primary)'
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-secondary)' }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Items Options List */}
          <div style={{ maxHeight: '220px', overflowY: 'auto', padding: '4px' }}>
            {filteredItems.length > 0 ? (
              filteredItems.map(item => {
                const isSelected = item.item_id === (selectedItem?.item_id);
                return (
                  <div
                    key={item.item_id}
                    onClick={() => {
                      onChange(item.item_id);
                      setIsOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'var(--accent-green-subtle)' : 'transparent',
                      transition: 'background-color 0.1s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '0.62rem',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: 'var(--radius-pill)',
                        backgroundColor: item.kind === 'main' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                        color: item.kind === 'main' ? 'var(--accent-green)' : 'var(--accent-blue)'
                      }}>
                        {item.kind}
                      </span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="mono" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-green)' }}>
                        {formatINR(item.price)}
                      </span>
                      {isSelected && <Check size={14} color="var(--accent-green)" />}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                No dishes found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
