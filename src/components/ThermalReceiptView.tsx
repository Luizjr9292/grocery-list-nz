import React, { useState } from 'react';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { GroceryCategory, ReceiptWidth } from '../types/grocery';

interface ThermalReceiptViewProps {
  categories: GroceryCategory[];
  receiptWidth: ReceiptWidth;
  receiptRef: React.RefObject<HTMLDivElement | null>;
  onChangeWidth: (width: ReceiptWidth) => void;
  onSaveReceiptJpg: () => void;
  onPrintReceipt: () => void;
  onBackToCatalog: () => void;
  isExporting: boolean;
}

export const ThermalReceiptView: React.FC<ThermalReceiptViewProps> = ({
  categories,
  receiptWidth,
  receiptRef,
  onChangeWidth,
  onSaveReceiptJpg,
  onPrintReceipt,
  onBackToCatalog,
  isExporting,
}) => {
  const [showCategories, setShowCategories] = useState(true);
  const [hidePicked, setHidePicked] = useState(false);
  const [headerTitle, setHeaderTitle] = useState('SMART GROCERY LIST');

  const groups = categories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) => item.selected && (!hidePicked || !item.bought)
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  const totalItems = groups.reduce((acc, g) => acc + g.items.length, 0);
  const totalQty = groups.reduce(
    (acc, g) => acc + g.items.reduce((sum, item) => sum + item.quantity, 0),
    0
  );

  const now = new Date();
  const formattedDate = now.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
  const formattedTime = now.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  // 58mm thermal printers typically use 384px printable width; 80mm uses 576px.
  const paperPixelWidth = receiptWidth === '58mm' ? 340 : 460;

  return (
    <div className="space-y-6">
      <div className="no-print bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div
            className="inline-flex items-center p-1 bg-slate-100 rounded-lg"
            role="group"
            aria-label="Thermal paper width"
          >
            <button
              type="button"
              onClick={() => onChangeWidth('58mm')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                receiptWidth === '58mm'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              58mm Mini
            </button>
            <button
              type="button"
              onClick={() => onChangeWidth('80mm')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                receiptWidth === '80mm'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              80mm Standard
            </button>
          </div>

          <input
            type="text"
            value={headerTitle}
            onChange={(e) => setHeaderTitle(e.target.value)}
            placeholder="Receipt title..."
            aria-label="Receipt header title"
            className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg w-48 focus:outline-none focus:border-emerald-700"
          />

          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showCategories}
              onChange={(e) => setShowCategories(e.target.checked)}
              className="w-4 h-4 rounded accent-emerald-700"
            />
            Group by category
          </label>

          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hidePicked}
              onChange={(e) => setHidePicked(e.target.checked)}
              className="w-4 h-4 rounded accent-emerald-700"
            />
            Hide picked items
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onBackToCatalog}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Catalog
          </button>

          <button
            type="button"
            onClick={onSaveReceiptJpg}
            disabled={totalItems === 0 || isExporting}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 disabled:opacity-45 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            {isExporting ? 'Exporting...' : 'Save Receipt JPG'}
          </button>

          <button
            type="button"
            onClick={onPrintReceipt}
            disabled={totalItems === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-45 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </div>

      <p className="no-print text-xs text-slate-500 text-center">
        Formatted in high-contrast monochrome for mini Bluetooth thermal printers (Kmart Anko, Fun Print, iPrint, PeriPage).
      </p>

      <div className="flex justify-center pb-8">
        <div
          className="print-only-container"
          style={{
            boxShadow: '0 8px 28px rgba(15, 23, 42, 0.08)',
            border: '1px solid #cbd5e1',
            backgroundColor: '#ffffff',
          }}
        >
          {/* Explicit hex colors inside receiptRef so html2canvas never encounters Tailwind v4 oklch() */}
          <div
            ref={receiptRef}
            className="font-mono-receipt"
            style={{
              width: `${paperPixelWidth}px`,
              maxWidth: '100%',
              backgroundColor: '#ffffff',
              color: '#000000',
              padding: receiptWidth === '58mm' ? '20px 14px 26px' : '24px 20px 30px',
              fontSize: receiptWidth === '58mm' ? '12.5px' : '13.5px',
              lineHeight: 1.45,
              boxSizing: 'border-box',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: receiptWidth === '58mm' ? '16px' : '18px',
                  letterSpacing: '0.04em',
                  color: '#000000',
                  wordBreak: 'break-word',
                }}
              >
                {headerTitle.trim() || 'SMART GROCERY LIST'}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#000000',
                  marginTop: '4px',
                }}
              >
                {formattedDate} · {formattedTime}
              </div>
              <div
                style={{
                  fontSize: '10.5px',
                  color: '#000000',
                  marginTop: '2px',
                }}
              >
                {receiptWidth.toUpperCase()} THERMAL FORMAT
              </div>
            </div>

            <div
              style={{
                borderTop: '2px dashed #000000',
                margin: '10px 0 12px',
              }}
            />

            {totalItems === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '24px 8px',
                  fontSize: '12px',
                  color: '#000000',
                }}
              >
                NO ITEMS SELECTED
                <br />
                Select items in Catalog to print.
              </div>
            ) : showCategories ? (
              <div>
                {groups.map((group) => (
                  <div key={group.id} style={{ marginBottom: '12px' }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: receiptWidth === '58mm' ? '11.5px' : '12.5px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        borderBottom: '1px solid #000000',
                        paddingBottom: '2px',
                        marginBottom: '5px',
                        color: '#000000',
                      }}
                    >
                      {group.name}
                    </div>
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '8px',
                          padding: '2.5px 0',
                          color: '#000000',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '6px',
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <span style={{ fontWeight: 700, flexShrink: 0 }}>
                            {item.bought ? '[x]' : '[ ]'}
                          </span>
                          <span
                            style={{
                              wordBreak: 'break-word',
                              textDecoration: item.bought ? 'line-through' : 'none',
                            }}
                          >
                            {item.name}
                          </span>
                        </div>
                        <span
                          style={{
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          x{item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {groups
                  .flatMap((g) => g.items)
                  .map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '8px',
                        padding: '3px 0',
                        color: '#000000',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '6px',
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <span style={{ fontWeight: 700, flexShrink: 0 }}>
                          {item.bought ? '[x]' : '[ ]'}
                        </span>
                        <span
                          style={{
                            wordBreak: 'break-word',
                            textDecoration: item.bought ? 'line-through' : 'none',
                          }}
                        >
                          {item.name}
                        </span>
                      </div>
                      <span style={{ fontWeight: 700, flexShrink: 0 }}>
                        x{item.quantity}
                      </span>
                    </div>
                  ))}
              </div>
            )}

            <div
              style={{
                borderTop: '2px dashed #000000',
                margin: '12px 0 10px',
              }}
            />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 700,
                fontSize: receiptWidth === '58mm' ? '12.5px' : '13.5px',
                color: '#000000',
              }}
            >
              <span>ITEMS: {totalItems}</span>
              <span>TOTAL QTY: {totalQty}</span>
            </div>

            <div
              style={{
                textAlign: 'center',
                fontSize: '10.5px',
                marginTop: '14px',
                color: '#000000',
              }}
            >
              * * * HAPPY SHOPPING * * *
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
