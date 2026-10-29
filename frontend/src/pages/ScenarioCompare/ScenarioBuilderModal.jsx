import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { formatINR } from '../../utils/formatters';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';

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
      maxWidth="620px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
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
              background: 'rgba(0,0,0,0.3)',
              color: '#ffffff',
              fontSize: '0.88rem'
            }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Item Price & Portion Modifications:</label>
            <button
              type="button"
              onClick={handleAddChange}
              style={{
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: '#818cf8',
                borderRadius: '4px',
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {itemChanges.map((change, idx) => {
              const selectedItem = items.find(i => i.item_id === change.item_id);
              return (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.5fr 1fr 1fr auto',
                    gap: '8px',
                    alignItems: 'center',
                    padding: '8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <select
                    value={change.item_id}
                    onChange={(e) => {
                      const it = items.find(i => i.item_id === e.target.value);
                      handleUpdateChange(idx, 'item_id', e.target.value);
                      if (it) {
                        handleUpdateChange(idx, 'price', it.price);
                        handleUpdateChange(idx, 'portion_size_g', it.portion_size_g);
                      }
                    }}
                    style={{
                      padding: '6px',
                      borderRadius: '4px',
                      background: '#0f172a',
                      border: '1px solid var(--border-subtle)',
                      color: '#ffffff',
                      fontSize: '0.78rem'
                    }}
                  >
                    {items.map(it => (
                      <option key={it.item_id} value={it.item_id}>
                        {it.name}
                      </option>
                    ))}
                  </select>

                  <div>
                    <input
                      type="number"
                      value={change.price}
                      onChange={(e) => handleUpdateChange(idx, 'price', parseFloat(e.target.value))}
                      placeholder="Price ₹"
                      style={{
                        width: '100%',
                        padding: '6px',
                        borderRadius: '4px',
                        background: '#0f172a',
                        border: '1px solid var(--border-subtle)',
                        color: '#ffffff',
                        fontSize: '0.78rem'
                      }}
                    />
                  </div>

                  <div>
                    <input
                      type="number"
                      value={change.portion_size_g}
                      onChange={(e) => handleUpdateChange(idx, 'portion_size_g', parseInt(e.target.value, 10))}
                      placeholder="Grams"
                      style={{
                        width: '100%',
                        padding: '6px',
                        borderRadius: '4px',
                        background: '#0f172a',
                        border: '1px solid var(--border-subtle)',
                        color: '#ffffff',
                        fontSize: '0.78rem'
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveChange(idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    <Trash2 size={15} />
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

