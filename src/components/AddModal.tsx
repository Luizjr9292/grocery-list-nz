import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { GroceryCategory } from '../types/grocery';

interface AddModalProps {
  isOpen: boolean;
  categories: GroceryCategory[];
  onClose: () => void;
  onAddItemToCategory: (
    categoryId: string,
    itemName: string,
    quantity: number,
    autoSelect: boolean
  ) => void;
  onCreateCategory: (
    categoryName: string,
    initialItemsText: string,
    autoSelect: boolean
  ) => void;
}

export const AddModal: React.FC<AddModalProps> = ({
  isOpen,
  categories,
  onClose,
  onAddItemToCategory,
  onCreateCategory,
}) => {
  const [tab, setTab] = useState<'item' | 'category'>('item');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [autoSelect, setAutoSelect] = useState(true);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [initialItemsText, setInitialItemsText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedCategoryId((prev) =>
        categories.some((c) => c.id === prev) ? prev : categories[0]?.id || ''
      );
      setItemName('');
      setQuantity(1);
      setNewCategoryName('');
      setInitialItemsText('');
    }
  }, [isOpen, categories]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'item') {
      if (!itemName.trim() || !selectedCategoryId) return;
      onAddItemToCategory(
        selectedCategoryId,
        itemName.trim(),
        Math.max(1, quantity),
        autoSelect
      );
      onClose();
    } else {
      if (!newCategoryName.trim()) return;
      onCreateCategory(newCategoryName.trim(), initialItemsText, autoSelect);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2
            id="add-modal-title"
            className="font-display text-base font-semibold text-slate-900"
          >
            Add Category or Item
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pt-4">
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg gap-1">
            <button
              type="button"
              onClick={() => setTab('item')}
              className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                tab === 'item'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Add Item
            </button>
            <button
              type="button"
              onClick={() => setTab('category')}
              className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                tab === 'category'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              New Category
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {tab === 'item' ? (
            <>
              <div>
                <label
                  htmlFor="modal-category-select"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Category
                </label>
                <select
                  id="modal-category-select"
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label
                    htmlFor="modal-item-name"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Item Name
                  </label>
                  <input
                    id="modal-item-name"
                    type="text"
                    required
                    autoFocus
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g., Mango"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700"
                  />
                </div>
                <div>
                  <label
                    htmlFor="modal-item-qty"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Quantity
                  </label>
                  <input
                    id="modal-item-qty"
                    type="number"
                    min={1}
                    max={99}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
                    }
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg tabular-nums focus:outline-none focus:border-emerald-700"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label
                  htmlFor="modal-new-category"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Category Name
                </label>
                <input
                  id="modal-new-category"
                  type="text"
                  required
                  autoFocus
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Bakery & Pastries"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700"
                />
              </div>

              <div>
                <label
                  htmlFor="modal-initial-items"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Initial Items (optional, comma-separated)
                </label>
                <textarea
                  id="modal-initial-items"
                  rows={3}
                  value={initialItemsText}
                  onChange={(e) => setInitialItemsText(e.target.value)}
                  placeholder="e.g., Sourdough, Croissant, Bagel"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700 resize-none"
                />
              </div>
            </>
          )}

          <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoSelect}
              onChange={(e) => setAutoSelect(e.target.checked)}
              className="w-4 h-4 rounded accent-emerald-700"
            />
            Select immediately for this shopping trip
          </label>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors"
            >
              {tab === 'item' ? 'Add Item' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
