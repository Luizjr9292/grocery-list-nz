import React from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Minus,
  Plus,
  Printer,
  RotateCcw,
  ShoppingBasket,
} from 'lucide-react';
import { GroceryCategory } from '../types/grocery';
import { getCategoryTheme } from '../utils/categoryThemes';

interface ShoppingListViewProps {
  categories: GroceryCategory[];
  searchQuery: string;
  onToggleBought: (categoryId: string, itemId: string) => void;
  onUpdateQuantity: (categoryId: string, itemId: string, delta: number) => void;
  onResetPicked: () => void;
  onBackToCatalog: () => void;
  onOpenReceipt: () => void;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  categories,
  searchQuery,
  onToggleBought,
  onUpdateQuantity,
  onResetPicked,
  onBackToCatalog,
  onOpenReceipt,
}) => {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const allSelectedGroups = categories
    .map((cat, idx) => ({
      ...cat,
      originalIndex: idx,
      items: cat.items.filter((item) => item.selected),
    }))
    .filter((cat) => cat.items.length > 0);

  const filteredGroups = allSelectedGroups
    .map((cat) => {
      if (!normalizedQuery) return cat;
      const catMatches = cat.name.toLowerCase().includes(normalizedQuery);
      if (catMatches) return cat;
      return {
        ...cat,
        items: cat.items.filter((item) =>
          item.name.toLowerCase().includes(normalizedQuery)
        ),
      };
    })
    .filter((cat) => cat.items.length > 0);

  const totalSelectedItems = allSelectedGroups.reduce(
    (sum, g) => sum + g.items.length,
    0
  );
  const totalPickedItems = allSelectedGroups.reduce(
    (sum, g) => sum + g.items.filter((item) => item.bought).length,
    0
  );
  const totalQuantity = allSelectedGroups.reduce(
    (sum, g) => sum + g.items.reduce((q, item) => q + item.quantity, 0),
    0
  );
  const progressPercent =
    totalSelectedItems > 0
      ? Math.round((totalPickedItems / totalSelectedItems) * 100)
      : 0;

  if (totalSelectedItems === 0) {
    return (
      <div className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-xl p-10 text-center max-w-xl mx-auto mt-4">
        <div className="w-12 h-12 rounded-xl bg-[var(--theme-primary-soft)] text-[var(--theme-primary-text)] flex items-center justify-center mx-auto mb-4">
          <ShoppingBasket className="w-6 h-6" />
        </div>
        <h2 className="font-display text-lg font-semibold text-[var(--theme-text)]">
          Your shopping list is empty
        </h2>
        <p className="text-sm text-[var(--theme-text-muted)] mt-1.5 mb-6">
          Check items in the Catalog view to build your focused shopping checklist and thermal receipt.
        </p>
        <button
          type="button"
          onClick={onBackToCatalog}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-[var(--theme-primary)] text-white hover:bg-[var(--theme-primary-hover)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Browse Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-[var(--theme-surface)] border border-[var(--theme-border)] border-t-[3px] border-t-[var(--theme-primary)] rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-semibold text-[var(--theme-text)]">
                Shopping Checklist
              </h2>
              {progressPercent === 100 && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--theme-primary-text)]">
                  <CheckCircle2 className="w-4 h-4" />
                  All picked up
                </span>
              )}
            </div>
            <p className="text-sm text-[var(--theme-text-muted)] tabular-nums mt-0.5">
              {totalPickedItems} of {totalSelectedItems} items picked up ({progressPercent}%) · {totalQuantity} total units
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {totalPickedItems > 0 && (
              <button
                type="button"
                onClick={onResetPicked}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Uncheck Picked
              </button>
            )}
            <button
              type="button"
              onClick={onBackToCatalog}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Edit Selection
            </button>
            <button
              type="button"
              onClick={onOpenReceipt}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              Thermal Receipt
            </button>
          </div>
        </div>

        <div
          className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mt-4"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Shopping trip progress"
        >
          <div
            className="h-full theme-progress-bar transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {filteredGroups.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
          No selected items match "{searchQuery}".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
          {filteredGroups.map((group) => {
            const theme = getCategoryTheme(group.id, group.originalIndex);
            const groupPicked = group.items.filter((i) => i.bought).length;
            return (
              <section
                key={group.id}
                className={`bg-white border border-slate-200 border-t-[3px] ${theme.topBorderClass} rounded-xl overflow-hidden shadow-xs`}
              >
                <div
                  className={`px-4 py-3 border-b border-slate-200/80 ${theme.headerBgClass} flex items-center justify-between gap-2`}
                >
                  <h3 className={`font-display text-[15px] font-semibold truncate ${theme.titleTextClass}`}>
                    {group.name}
                  </h3>
                  <span className="text-xs text-slate-600 tabular-nums shrink-0">
                    {groupPicked}/{group.items.length} picked
                  </span>
                </div>

                <ul className="divide-y divide-slate-100">
                  {group.items.map((item) => (
                    <li
                      key={item.id}
                      className={`flex items-center justify-between gap-2 px-4 py-1.5 min-h-[48px] transition-colors ${
                        item.bought ? 'bg-slate-50' : theme.selectedRowClass
                      }`}
                    >
                      <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer py-1.5 select-none">
                        <input
                          type="checkbox"
                          checked={item.bought}
                          onChange={() => onToggleBought(group.id, item.id)}
                          className={`w-4 h-4 rounded border-slate-300 ${theme.checkboxAccentClass} cursor-pointer shrink-0`}
                        />
                        <span
                          className={`text-sm break-words ${
                            item.bought
                              ? 'line-through text-slate-400'
                              : 'font-medium text-slate-900'
                          }`}
                        >
                          {item.name}
                        </span>
                      </label>

                      <div className="inline-flex items-center border border-slate-200 bg-white rounded-lg overflow-hidden shrink-0">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(group.id, item.id, -1)}
                          disabled={item.quantity <= 1}
                          aria-label={`Decrease quantity for ${item.name}`}
                          className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="min-w-[24px] text-center text-xs font-semibold text-slate-900 tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(group.id, item.id, 1)}
                          aria-label={`Increase quantity for ${item.name}`}
                          className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};
