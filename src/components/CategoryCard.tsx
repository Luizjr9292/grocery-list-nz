import React, { useState } from 'react';
import {
  Apple,
  Beef,
  Check,
  ChevronDown,
  ChevronRight,
  Coffee,
  Cookie,
  Flame,
  Milk,
  Minus,
  Pencil,
  Plus,
  Snowflake,
  Sparkles,
  SprayCan,
  Tag,
  Trash2,
  Utensils,
  Wheat,
  X,
} from 'lucide-react';
import { FilterMode, GroceryCategory, GroceryItem } from '../types/grocery';
import { getCategoryTheme } from '../utils/categoryThemes';

interface CategoryCardProps {
  category: GroceryCategory;
  categoryIndex: number;
  searchQuery: string;
  filterMode: FilterMode;
  onToggleCollapse: (categoryId: string) => void;
  onToggleItem: (categoryId: string, itemId: string) => void;
  onUpdateQuantity: (categoryId: string, itemId: string, delta: number) => void;
  onAddItem: (categoryId: string, itemName: string) => void;
  onEditItem: (categoryId: string, itemId: string, newName: string) => void;
  onDeleteItem: (categoryId: string, itemId: string) => void;
  onDeleteCategory?: (categoryId: string) => void;
}

function renderCategoryIcon(categoryId: string) {
  switch (categoryId) {
    case 'cat-fruits-vegetables':
      return <Apple className="w-4 h-4" />;
    case 'cat-bread-cereal-rice':
      return <Wheat className="w-4 h-4" />;
    case 'cat-dairy':
      return <Milk className="w-4 h-4" />;
    case 'cat-drinks':
      return <Coffee className="w-4 h-4" />;
    case 'cat-household':
      return <SprayCan className="w-4 h-4" />;
    case 'cat-cooking-ingredients':
      return <Flame className="w-4 h-4" />;
    case 'cat-meat':
      return <Beef className="w-4 h-4" />;
    case 'cat-snacks':
      return <Cookie className="w-4 h-4" />;
    case 'cat-dannis-personal':
      return <Sparkles className="w-4 h-4" />;
    case 'cat-chinese-supermarket':
      return <Utensils className="w-4 h-4" />;
    case 'cat-two-dollar-shopping':
      return <Tag className="w-4 h-4" />;
    case 'cat-frozen':
      return <Snowflake className="w-4 h-4" />;
    default:
      return <Tag className="w-4 h-4" />;
  }
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  categoryIndex,
  searchQuery,
  filterMode,
  onToggleCollapse,
  onToggleItem,
  onUpdateQuantity,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onDeleteCategory,
}) => {
  const [newItemName, setNewItemName] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const theme = getCategoryTheme(category.id, categoryIndex);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const categoryNameMatches =
    normalizedQuery.length > 0 &&
    category.name.toLowerCase().includes(normalizedQuery);

  const visibleItems = category.items.filter((item) => {
    if (filterMode === 'selected' && !item.selected) return false;
    if (filterMode === 'unselected' && item.selected) return false;
    if (
      normalizedQuery.length > 0 &&
      !categoryNameMatches &&
      !item.name.toLowerCase().includes(normalizedQuery)
    ) {
      return false;
    }
    return true;
  });

  if (normalizedQuery.length > 0 && !categoryNameMatches && visibleItems.length === 0) {
    return null;
  }

  if (filterMode !== 'all' && visibleItems.length === 0 && normalizedQuery.length === 0) {
    return null;
  }

  const selectedCount = category.items.filter((item) => item.selected).length;

  const handleInlineAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newItemName.trim();
    if (!trimmed) return;
    onAddItem(category.id, trimmed);
    setNewItemName('');
  };

  const startEdit = (item: GroceryItem) => {
    setEditingItemId(item.id);
    setEditingValue(item.name);
  };

  const commitEdit = (itemId: string) => {
    const trimmed = editingValue.trim();
    if (trimmed) {
      onEditItem(category.id, itemId, trimmed);
    }
    setEditingItemId(null);
    setEditingValue('');
  };

  const cancelEdit = () => {
    setEditingItemId(null);
    setEditingValue('');
  };

  return (
    <section
      aria-label={category.name}
      className={`bg-white border border-slate-200 border-t-[3px] ${theme.topBorderClass} rounded-xl overflow-hidden flex flex-col shadow-xs`}
    >
      <div
        className={`flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-200/80 ${theme.headerBgClass}`}
      >
        <button
          type="button"
          onClick={() => onToggleCollapse(category.id)}
          aria-expanded={!category.collapsed}
          className="flex items-center gap-2.5 text-left flex-1 min-w-0 min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 rounded-lg"
        >
          <span
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${theme.iconBgClass} ${theme.iconTextClass}`}
            aria-hidden="true"
          >
            {renderCategoryIcon(category.id)}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className={`font-display text-[15px] font-semibold truncate ${theme.titleTextClass}`}>
              {category.name}
            </h2>
            <p className="text-xs text-slate-600 tabular-nums">
              {selectedCount} selected · {category.items.length}{' '}
              {category.items.length === 1 ? 'item' : 'items'}
            </p>
          </div>
          <span className="text-slate-500 shrink-0">
            {category.collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </span>
        </button>

        {onDeleteCategory && (
          <button
            type="button"
            onClick={() => onDeleteCategory(category.id)}
            title={`Remove ${category.name} category`}
            aria-label={`Remove ${category.name} category`}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {!category.collapsed && (
        <>
          {visibleItems.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-slate-500">
              No matching items in this category.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {visibleItems.map((item) => {
                const isEditing = editingItemId === item.id;
                return (
                  <li
                    key={item.id}
                    className={`flex items-center justify-between gap-2 px-4 py-1.5 min-h-[46px] transition-colors ${
                      item.selected ? theme.selectedRowClass : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1 py-1">
                        <input
                          type="text"
                          value={editingValue}
                          autoFocus
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              commitEdit(item.id);
                            } else if (e.key === 'Escape') {
                              cancelEdit();
                            }
                          }}
                          aria-label="Edit item name"
                          className="flex-1 min-w-0 px-2.5 py-1.5 text-sm bg-white border border-emerald-600 rounded-lg focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => commitEdit(item.id)}
                          aria-label="Save item name"
                          className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-emerald-700 text-white hover:bg-emerald-800"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          aria-label="Cancel edit"
                          className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer py-1.5 select-none">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() => onToggleItem(category.id, item.id)}
                            className={`w-4 h-4 rounded border-slate-300 ${theme.checkboxAccentClass} cursor-pointer shrink-0`}
                          />
                          <span
                            className={`text-sm leading-snug break-words ${
                              item.selected
                                ? 'font-semibold text-slate-900'
                                : 'text-slate-700'
                            }`}
                          >
                            {item.name}
                          </span>
                        </label>

                        <div className="flex items-center gap-1 shrink-0">
                          {item.selected && (
                            <div
                              className="inline-flex items-center border border-slate-200 bg-white rounded-lg overflow-hidden mr-1"
                              aria-label={`Quantity for ${item.name}`}
                            >
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(category.id, item.id, -1)}
                                aria-label={`Decrease quantity for ${item.name}`}
                                disabled={item.quantity <= 1}
                                className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="min-w-[24px] text-center text-xs font-semibold text-slate-900 tabular-nums select-none">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(category.id, item.id, 1)}
                                aria-label={`Increase quantity for ${item.name}`}
                                className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            title={`Edit ${item.name}`}
                            aria-label={`Edit ${item.name}`}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteItem(category.id, item.id)}
                            title={`Delete ${item.name}`}
                            aria-label={`Delete ${item.name}`}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <form
            onSubmit={handleInlineAdd}
            className="flex items-center gap-2 p-3 bg-slate-50/70 border-t border-slate-200 mt-auto"
          >
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder={`Add item to ${category.name}...`}
              aria-label={`Add item to ${category.name}`}
              className="flex-1 min-w-0 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:border-emerald-700"
            />
            <button
              type="submit"
              disabled={!newItemName.trim()}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0"
            >
              Add
            </button>
          </form>
        </>
      )}
    </section>
  );
};
