import React from 'react';
import { GroceryCategory } from '../types/grocery';
import { getCategoryTheme } from '../utils/categoryThemes';
import { getDateStamp, getSelectedGroups } from '../utils/exportHelpers';

interface PrintableSheetProps {
  categories: GroceryCategory[];
  sheetRef: React.RefObject<HTMLDivElement | null>;
}

export const PrintableSheet: React.FC<PrintableSheetProps> = ({
  categories,
  sheetRef,
}) => {
  const groups = getSelectedGroups(categories);
  const totalItems = groups.reduce((acc, g) => acc + g.items.length, 0);
  const totalQty = groups.reduce(
    (acc, g) => acc + g.items.reduce((sum, item) => sum + item.quantity, 0),
    0
  );

  // Rendered off-screen with explicit hex colors so html2canvas never trips on oklch()
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: '-9999px',
        top: 0,
        pointerEvents: 'none',
        zIndex: -1,
      }}
    >
      <div
        ref={sheetRef}
        style={{
          width: '760px',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          padding: '32px',
          fontFamily: "'DM Sans', system-ui, sans-serif",
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            borderBottom: '2px solid #059669',
            paddingBottom: '12px',
            marginBottom: '20px',
          }}
        >
          <div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>
              Smart Grocery List
            </div>
            <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
              Generated {getDateStamp()}
            </div>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#059669' }}>
            {totalItems} items · {totalQty} total qty
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            alignItems: 'start',
          }}
        >
          {groups.map((group, idx) => {
            const theme = getCategoryTheme(group.id, idx);
            return (
              <div
                key={group.id}
                style={{
                  border: `1px solid ${theme.hexBorder}`,
                  borderTop: `3px solid ${theme.hexPrimary}`,
                  borderRadius: '8px',
                  padding: '14px',
                  backgroundColor: '#ffffff',
                }}
              >
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: theme.hexPrimary,
                    backgroundColor: theme.hexBg,
                    padding: '6px 8px',
                    borderRadius: '6px',
                    marginBottom: '8px',
                  }}
                >
                  {group.name}
                </div>
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '4px 0',
                      fontSize: '13px',
                      color: item.bought ? '#94a3b8' : '#0f172a',
                      textDecoration: item.bought ? 'line-through' : 'none',
                    }}
                  >
                    <span>
                      {item.bought ? '[x] ' : '[ ] '}
                      {item.name}
                    </span>
                    <span style={{ fontWeight: 600, color: '#334155' }}>
                      x{item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
