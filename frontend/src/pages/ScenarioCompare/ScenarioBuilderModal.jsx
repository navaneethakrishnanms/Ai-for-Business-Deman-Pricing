import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { formatINR } from '../../utils/formatters';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { SearchableSelect } from '../../components/common/SearchableSelect';

export const ScenarioBuilderModal = ({ isOpen, onClose, items = [], onAddScenario }) => {
  const [scenarioName, setScenarioName] = useState('New Balanced Scenario');
  const [itemChanges, setItemChanges] = useState([
    { item_id: items[0]?.item_id || 'item_biryani', price: items[0]?.price || 120, portion_size_g: items[0]?.portion_size_g || 380 }
  ]);

  const handleAddChange = () => {
    const unselected = items.find(i => !itemChanges.some(c => c.item_id === i.item_id)) || items[0];
    setItemChanges(prev => [
      ...prev,
      { item_id: unselected.item_id, price: unselected.price, portion_size_g: unselected.portion_size_g }
    ]);
  };

  const handleRemoveChange = (idx) => {
    setItemChanges(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateChange = (idx, field, value) => {
    setItemChanges(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      return { ...item, [field]: value };
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!scenarioName.trim()) return;

    onAddScenario({
      name: scenarioName,
      item_changes: itemChanges,
      combo_changes: []
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Custom Scenario"
      subtitle="Define pricing and portion modifications to evaluate alongside Today's baseline"
      maxWidth="680px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
            Scenario Name:
          </label>
          <input
            type="text"
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            placeholder="e.g., Exam Period Low-Cost Bundles"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--input-bg)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem'
            }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Item Price & Portion Modifications:</label>
            <button
              type="button"
              onClick={handleAddChange}
              style={{
                background: 'var(--accent-blue-subtle)',
                border: '1px solid var(--accent-blue)',
                color: 'var(--accent-blue)',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Plus size={13} />
              <span>Add Item</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {itemChanges.map((change, idx) => {
              return (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.8fr 1fr 1fr auto',
                    gap: '8px',
                    alignItems: 'center',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-surface-inset)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <SearchableSelect
                    items={items}
                    selectedId={change.item_id}
                    onSelect={(it) => {
                      handleUpdateChange(idx, 'item_id', it.item_id);
                      handleUpdateChange(idx, 'price', it.price);
                      handleUpdateChange(idx, 'portion_size_g', it.portion_size_g);
                    }}
                    placeholder="Search menu item..."
                  />

                  <div>
                    <input
                      type="number"
                      value={change.price}
                      onChange={(e) => handleUpdateChange(idx, 'price', parseFloat(e.target.value))}
                      placeholder="Price ₹"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: '0.82rem'
                      }}
                    />
                  </div>

                  <div>
                    <input
                      type="number"
                      value={change.portion_size_g}
                      onChange={(e) => handleUpdateChange(idx, 'portion_size_g', parseInt(e.target.value, 10))}
                      placeholder="Portion (g)"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: '0.82rem'
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveChange(idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                    title="Remove item modification"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>


        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '0.5rem' }}>
          <button type="button" onClick={onClose} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" style={{ fontSize: '0.85rem' }}>
            Add Scenario
          </button>
        </div>
      </form>
    </Modal>
  );
};

