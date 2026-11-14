export interface GroceryItem {
  id: string;
  name: string;
  selected: boolean;
  quantity: number;
  bought: boolean;
}

export interface GroceryCategory {
  id: string;
  name: string;
  collapsed: boolean;
  items: GroceryItem[];
}

export type AppMode = 'catalog' | 'checklist' | 'receipt';
export type FilterMode = 'all' | 'selected' | 'unselected';
export type ReceiptWidth = '58mm' | '80mm';
