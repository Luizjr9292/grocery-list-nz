import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  onAuthStateChanged,
  sendEmailVerification,
  signOut,
  User,
} from 'firebase/auth';
import {
  CheckSquare,
  ChevronsDownUp,
  ChevronsUpDown,
  Cloud,
  CloudOff,
  Code2,
  Copy,
  Eraser,
  FileDown,
  Image as ImageIcon,
  ListChecks,
  LogIn,
  LogOut,
  MailCheck,
  Plus,
  Receipt,
  RefreshCw,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { AddModal } from './components/AddModal';
import { AuthModal } from './components/AuthModal';
import { CategoryCard } from './components/CategoryCard';
import { ConfirmModal } from './components/ConfirmModal';
import { PrintableSheet } from './components/PrintableSheet';
import { ShoppingListView } from './components/ShoppingListView';
import { ThermalReceiptView } from './components/ThermalReceiptView';
import { createDefaultCategories } from './data/defaultCategories';
import { auth } from './firebase';
import {
  cloudAddItem,
  cloudClearSelection,
  cloudCreateCategory,
  cloudDeleteCategory,
  cloudDeleteItem,
  cloudEditItem,
  cloudResetPicked,
  cloudResetToOriginal,
  cloudSetAllCollapsed,
  cloudToggleBought,
  cloudToggleCollapse,
  cloudToggleItem,
  cloudUpdateQuantity,
  ensureUserProfileAndSeed,
  subscribeUserGroceryList,
} from './services/grocerySync';
import {
  AppMode,
  FilterMode,
  GroceryCategory,
  ReceiptWidth,
} from './types/grocery';
import {
  downloadElementAsJpg,
  downloadGroceryPdf,
  downloadStandaloneHtml,
  formatGroceryListText,
  getDateStamp,
} from './utils/exportHelpers';

const STORAGE_KEY = 'smart_grocery_list_v1';

function loadInitialCategories(): GroceryCategory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultCategories();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Fallback cleanly to defaults if storage is unavailable or corrupted
  }
  return createDefaultCategories();
}

export default function App() {
  const [categories, setCategories] = useState<GroceryCategory[]>(loadInitialCategories);
  const [mode, setMode] = useState<AppMode>('catalog');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [receiptWidth, setReceiptWidth] = useState<ReceiptWidth>('58mm');

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authRefreshTick, setAuthRefreshTick] = useState(0);
  const [isCloudLoading, setIsCloudLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<GroceryCategory | null>(null);
  const [isExportingJpg, setIsExportingJpg] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const receiptRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const categoriesRef = useRef<GroceryCategory[]>(categories);

  useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);

  // LocalStorage mirror always stays up to date as fast local cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    } catch {
      // Ignore quota errors gracefully
    }
  }, [categories]);

  // Firebase Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthReady(true);
      if (!user) {
        setCategories(loadInitialCategories());
        setIsCloudLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const isCloudSynced = Boolean(authUser && authUser.emailVerified);

  // Real-time Firestore listener when authenticated & verified
  useEffect(() => {
    if (!authReady || !authUser || !authUser.emailVerified) {
      return;
    }

    let cancelled = false;
    let unsubscribeSnapshot: (() => void) | null = null;

    setIsCloudLoading(true);

    ensureUserProfileAndSeed(authUser, categoriesRef.current)
      .then(() => {
        if (cancelled) return;
        unsubscribeSnapshot = subscribeUserGroceryList(
          authUser.uid,
          (cloudCategories) => {
            if (cancelled) return;
            setCategories(cloudCategories);
            setIsCloudLoading(false);
          },
          () => {
            if (cancelled) return;
            setIsCloudLoading(false);
            showToast('Cloud sync error. Check permissions or connection.');
          }
        );
      })
      .catch(() => {
        if (cancelled) return;
        setIsCloudLoading(false);
        showToast('Could not initialize cloud sync.');
      });

    return () => {
      cancelled = true;
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, [authReady, authUser, authRefreshTick]);

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const stats = useMemo(() => {
    let totalItems = 0;
    let selectedItems = 0;
    let totalQuantity = 0;
    for (const cat of categories) {
      totalItems += cat.items.length;
      for (const item of cat.items) {
        if (item.selected) {
          selectedItems += 1;
          totalQuantity += item.quantity;
        }
      }
    }
    return {
      totalCategories: categories.length,
      totalItems,
      selectedItems,
      totalQuantity,
    };
  }, [categories]);

  const allCollapsed = useMemo(
    () => categories.length > 0 && categories.every((c) => c.collapsed),
    [categories]
  );

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      showToast('Signed out');
    } catch {
      showToast('Failed to sign out');
    }
  };

  const handleResendVerification = async () => {
    if (!authUser) return;
    try {
      await sendEmailVerification(authUser);
      showToast(`Verification email sent to ${authUser.email}`);
    } catch {
      showToast('Please wait a moment before resending verification.');
    }
  };

  const handleRefreshVerification = async () => {
    if (!authUser) return;
    try {
      await authUser.reload();
      await authUser.getIdToken(true);
      setAuthRefreshTick((t) => t + 1);
      if (auth.currentUser?.emailVerified) {
        showToast('Email verified! Cloud sync enabled.');
      } else {
        showToast('Email still not verified yet. Check your inbox.');
      }
    } catch {
      showToast('Could not refresh verification status.');
    }
  };

  const handleToggleCollapse = (categoryId: string) => {
    const target = categories.find((c) => c.id === categoryId);
    const nextCollapsed = target ? !target.collapsed : false;
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId ? { ...cat, collapsed: nextCollapsed } : cat
      )
    );
    if (isCloudSynced && authUser) {
      void cloudToggleCollapse(authUser.uid, categoryId, nextCollapsed).catch(() =>
        showToast('Cloud update failed')
      );
    }
  };

  const handleToggleCollapseAll = () => {
    const nextCollapsed = !allCollapsed;
    const ids = categories.map((c) => c.id);
    setCategories((prev) =>
      prev.map((cat) => ({ ...cat, collapsed: nextCollapsed }))
    );
    if (isCloudSynced && authUser) {
      void cloudSetAllCollapsed(authUser.uid, ids, nextCollapsed).catch(() =>
        showToast('Cloud update failed')
      );
    }
  };

  const handleToggleItem = (categoryId: string, itemId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    const item = cat?.items.find((i) => i.id === itemId);
    if (!item) return;

    const nextSelected = !item.selected;
    const nextBought = nextSelected ? item.bought : false;

    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== categoryId) return c;
        return {
          ...c,
          items: c.items.map((it) =>
            it.id === itemId
              ? { ...it, selected: nextSelected, bought: nextBought }
              : it
          ),
        };
      })
    );

    if (isCloudSynced && authUser) {
      void cloudToggleItem(authUser.uid, itemId, nextSelected, nextBought).catch(
        () => showToast('Cloud update failed')
      );
    }
  };

  const handleToggleBought = (categoryId: string, itemId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    const item = cat?.items.find((i) => i.id === itemId);
    if (!item) return;

    const nextBought = !item.bought;

    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== categoryId) return c;
        return {
          ...c,
          items: c.items.map((it) =>
            it.id === itemId ? { ...it, bought: nextBought } : it
          ),
        };
      })
    );

    if (isCloudSynced && authUser) {
      void cloudToggleBought(authUser.uid, itemId, nextBought).catch(() =>
        showToast('Cloud update failed')
      );
    }
  };

  const handleUpdateQuantity = (
    categoryId: string,
    itemId: string,
    delta: number
  ) => {
    const cat = categories.find((c) => c.id === categoryId);
    const item = cat?.items.find((i) => i.id === itemId);
    if (!item) return;

    const nextQty = Math.min(999, Math.max(1, item.quantity + delta));

    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== categoryId) return c;
        return {
          ...c,
          items: c.items.map((it) =>
            it.id === itemId ? { ...it, quantity: nextQty } : it
          ),
        };
      })
    );

    if (isCloudSynced && authUser) {
      void cloudUpdateQuantity(authUser.uid, itemId, nextQty).catch(() =>
        showToast('Cloud update failed')
      );
    }
  };

  const handleInlineAddItem = (categoryId: string, itemName: string) => {
    const shouldAutoSelect = filterMode !== 'unselected';
    const cat = categories.find((c) => c.id === categoryId);
    const nextOrder = cat ? cat.items.length : 0;

    if (isCloudSynced && authUser) {
      void cloudAddItem(
        authUser.uid,
        categoryId,
        itemName,
        1,
        shouldAutoSelect,
        nextOrder
      )
        .then(() => showToast(`Added "${itemName}"`))
        .catch(() => showToast('Failed to add item to cloud'));
      return;
    }

    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: itemName,
      selected: shouldAutoSelect,
      quantity: 1,
      bought: false,
    };
    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId
          ? { ...c, collapsed: false, items: [...c.items, newItem] }
          : c
      )
    );
    showToast(`Added "${itemName}"`);
  };

  const handleEditItem = (
    categoryId: string,
    itemId: string,
    newName: string
  ) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== categoryId) return cat;
        return {
          ...cat,
          items: cat.items.map((item) =>
            item.id === itemId ? { ...item, name: newName } : item
          ),
        };
      })
    );
    if (isCloudSynced && authUser) {
      void cloudEditItem(authUser.uid, itemId, newName).catch(() =>
        showToast('Cloud update failed')
      );
    }
  };

  const handleDeleteItem = (categoryId: string, itemId: string) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== categoryId) return cat;
        return {
          ...cat,
          items: cat.items.filter((item) => item.id !== itemId),
        };
      })
    );
    if (isCloudSynced && authUser) {
      void cloudDeleteItem(authUser.uid, itemId).catch(() =>
        showToast('Failed to delete item from cloud')
      );
    }
  };

  const handleModalAddItem = (
    categoryId: string,
    itemName: string,
    quantity: number,
    autoSelect: boolean
  ) => {
    const cat = categories.find((c) => c.id === categoryId);
    const nextOrder = cat ? cat.items.length : 0;

    if (isCloudSynced && authUser) {
      void cloudAddItem(
        authUser.uid,
        categoryId,
        itemName,
        quantity,
        autoSelect,
        nextOrder
      )
        .then(() => showToast(`Added "${itemName}"`))
        .catch(() => showToast('Failed to add item to cloud'));
      return;
    }

    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: itemName,
      selected: autoSelect,
      quantity,
      bought: false,
    };
    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId
          ? { ...c, collapsed: false, items: [...c.items, newItem] }
          : c
      )
    );
    showToast(`Added "${itemName}"`);
  };

  const handleCreateCategory = (
    categoryName: string,
    initialItemsText: string,
    autoSelect: boolean
  ) => {
    const itemNames = initialItemsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (isCloudSynced && authUser) {
      void cloudCreateCategory(
        authUser.uid,
        categoryName,
        categories.length,
        itemNames,
        autoSelect
      )
        .then(() => showToast(`Created category "${categoryName}"`))
        .catch(() => showToast('Failed to create category in cloud'));
      return;
    }

    const parsedItems = itemNames.map((name, idx) => ({
      id: `item-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      selected: autoSelect,
      quantity: 1,
      bought: false,
    }));

    const newCategory: GroceryCategory = {
      id: `cat-${Date.now()}`,
      name: categoryName,
      collapsed: false,
      items: parsedItems,
    };

    setCategories((prev) => [...prev, newCategory]);
    showToast(`Created category "${categoryName}"`);
  };

  const handleClearSelection = () => {
    const selectedIds = categories.flatMap((c) =>
      c.items.filter((i) => i.selected).map((i) => i.id)
    );
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        items: cat.items.map((item) => ({
          ...item,
          selected: false,
          bought: false,
        })),
      }))
    );
    if (isCloudSynced && authUser && selectedIds.length > 0) {
      void cloudClearSelection(authUser.uid, selectedIds).catch(() =>
        showToast('Failed to clear cloud selection')
      );
    }
    showToast('All selections cleared');
  };

  const handleResetPicked = () => {
    const boughtIds = categories.flatMap((c) =>
      c.items.filter((i) => i.bought).map((i) => i.id)
    );
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        items: cat.items.map((item) => ({ ...item, bought: false })),
      }))
    );
    if (isCloudSynced && authUser && boughtIds.length > 0) {
      void cloudResetPicked(authUser.uid, boughtIds).catch(() =>
        showToast('Failed to update cloud items')
      );
    }
    showToast('Unchecked picked items');
  };

  const handleConfirmResetOriginal = () => {
    setConfirmResetOpen(false);
    setFilterMode('all');
    setSearchQuery('');

    if (isCloudSynced && authUser) {
      setIsCloudLoading(true);
      void cloudResetToOriginal(authUser.uid, categories)
        .then(() => {
          setIsCloudLoading(false);
          showToast('Restored original 12 categories');
        })
        .catch(() => {
          setIsCloudLoading(false);
          showToast('Failed to restore cloud defaults');
        });
      return;
    }

    setCategories(createDefaultCategories());
    showToast('Restored original 12 categories');
  };

  const handleConfirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    const removedName = categoryToDelete.name;
    const removedId = categoryToDelete.id;
    const itemIds = categoryToDelete.items.map((i) => i.id);

    setCategories((prev) => prev.filter((c) => c.id !== removedId));
    setCategoryToDelete(null);

    if (isCloudSynced && authUser) {
      void cloudDeleteCategory(authUser.uid, removedId, itemIds).catch(() =>
        showToast('Failed to remove category from cloud')
      );
    }
    showToast(`Removed category "${removedName}"`);
  };

  const handleCopyText = async () => {
    const formatted = formatGroceryListText(categories);
    if (!formatted) {
      showToast('Select at least one item before copying');
      return;
    }
    try {
      await navigator.clipboard.writeText(formatted);
      showToast('Copied grocery list to clipboard');
    } catch {
      showToast('Unable to access clipboard in this browser');
    }
  };

  const handleSavePdf = () => {
    const ok = downloadGroceryPdf(categories);
    if (!ok) {
      showToast('Select at least one item to export PDF');
      return;
    }
    showToast('Downloaded grocery list PDF');
  };

  const handleSaveReceiptJpg = async () => {
    if (!receiptRef.current || stats.selectedItems === 0) {
      showToast('Select at least one item to export receipt');
      return;
    }
    try {
      setIsExportingJpg(true);
      await downloadElementAsJpg(
        receiptRef.current,
        `grocery-receipt-${receiptWidth}-${getDateStamp()}.jpg`,
        3
      );
      showToast(`Saved ${receiptWidth} thermal receipt JPG`);
    } catch {
      showToast('Failed to export receipt image');
    } finally {
      setIsExportingJpg(false);
    }
  };

  const handleSaveGeneralJpg = async () => {
    if (stats.selectedItems === 0) {
      showToast('Select at least one item to export JPG');
      return;
    }
    if (mode === 'receipt' && receiptRef.current) {
      await handleSaveReceiptJpg();
      return;
    }
    if (!sheetRef.current) return;
    try {
      setIsExportingJpg(true);
      await downloadElementAsJpg(
        sheetRef.current,
        `smart-grocery-list-${getDateStamp()}.jpg`,
        2
      );
      showToast('Saved grocery list JPG');
    } catch {
      showToast('Failed to export JPG');
    } finally {
      setIsExportingJpg(false);
    }
  };

  const handleDownloadHtml = () => {
    downloadStandaloneHtml(categories);
    showToast('Downloaded standalone index.html for GitHub Pages');
  };

  const handlePrint = () => {
    if (stats.selectedItems === 0) {
      showToast('Select at least one item before printing');
      return;
    }
    window.print();
  };

  const hasVisibleCatalogCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return categories.some((cat) => {
      const catMatches = q.length > 0 && cat.name.toLowerCase().includes(q);
      const visibleCount = cat.items.filter((item) => {
        if (filterMode === 'selected' && !item.selected) return false;
        if (filterMode === 'unselected' && item.selected) return false;
        if (q.length > 0 && !catMatches && !item.name.toLowerCase().includes(q)) {
          return false;
        }
        return true;
      }).length;
      if (q.length > 0) return catMatches || visibleCount > 0;
      if (filterMode !== 'all') return visibleCount > 0;
      return true;
    });
  }, [categories, searchQuery, filterMode]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FA] text-slate-900">
      {/* Strict 3-zone Top Bar with colorful top accent ribbon */}
      <header className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div
          className="h-1 w-full bg-gradient-to-r from-emerald-500 via-amber-500 to-sky-500"
          aria-hidden="true"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4 sm:gap-8">
          <button
            type="button"
            onClick={() => setMode('catalog')}
            className="font-display text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 rounded"
          >
            Smart Grocery List
          </button>

          <nav
            aria-label="Primary views"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            <button
              type="button"
              onClick={() => setMode('catalog')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                mode === 'catalog'
                  ? 'text-emerald-700 border-emerald-600 font-semibold'
                  : 'text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              Catalog
            </button>
            <button
              type="button"
              onClick={() => setMode('checklist')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                mode === 'checklist'
                  ? 'text-amber-700 border-amber-500 font-semibold'
                  : 'text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              Generate List
            </button>
            <button
              type="button"
              onClick={() => setMode('receipt')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                mode === 'receipt'
                  ? 'text-indigo-700 border-indigo-600 font-semibold'
                  : 'text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              Thermal Receipt
            </button>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {authUser ? (
              <button
                type="button"
                onClick={handleSignOut}
                title={`Signed in as ${authUser.email || authUser.displayName}. Click to sign out.`}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline max-w-[120px] truncate">
                  {authUser.displayName || authUser.email?.split('@')[0]}
                </span>
                <span className="sm:hidden">Sign Out</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-sky-800 bg-sky-50 border border-sky-200 hover:bg-sky-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap shrink-0 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Category/Item</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-6">
        {/* Cloud Sync / Account Status Strip */}
        {authReady && !authUser && (
          <div className="no-print mb-4 bg-white border border-sky-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700">
              <CloudOff className="w-4 h-4 text-sky-600 shrink-0" />
              <span>
                Currently saving only on this device. Sign in or create a login to access your grocery list on any computer, tablet, or phone.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors whitespace-nowrap shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In / Create Account
            </button>
          </div>
        )}

        {authUser && !authUser.emailVerified && (
          <div className="no-print mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-amber-950">
              <MailCheck className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                Please verify <strong>{authUser.email}</strong> via the link sent to your inbox to activate cross-device cloud sync.
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResendVerification}
                className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-white border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors whitespace-nowrap"
              >
                Resend Email
              </button>
              <button
                type="button"
                onClick={handleRefreshVerification}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors whitespace-nowrap"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                I&apos;ve Verified
              </button>
            </div>
          </div>
        )}

        {/* Workspace Toolbar */}
        <section
          aria-label="List controls and exports"
          className="no-print bg-white border border-slate-200 rounded-xl p-4 mb-6 space-y-3.5"
        >
          {/* Mobile mode switcher */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg md:hidden">
            <button
              type="button"
              onClick={() => setMode('catalog')}
              className={`py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                mode === 'catalog'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              Catalog
            </button>
            <button
              type="button"
              onClick={() => setMode('checklist')}
              className={`py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                mode === 'checklist'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              Generate List
            </button>
            <button
              type="button"
              onClick={() => setMode('receipt')}
              className={`py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                mode === 'receipt'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              Receipt
            </button>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            {/* Search input */}
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items or categories..."
                aria-label="Search grocery items or categories"
                className="w-full pl-9 pr-9 py-2 text-sm bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:border-emerald-700"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Filter segmented control */}
              {mode === 'catalog' && (
                <div
                  className="inline-flex items-center p-1 bg-slate-100 rounded-lg"
                  role="group"
                  aria-label="Filter items"
                >
                  {(['all', 'selected', 'unselected'] as FilterMode[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFilterMode(f)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors whitespace-nowrap ${
                        filterMode === f
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}

              {mode === 'catalog' && (
                <button
                  type="button"
                  onClick={handleToggleCollapseAll}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                >
                  {allCollapsed ? (
                    <>
                      <ChevronsUpDown className="w-3.5 h-3.5" />
                      Expand All
                    </>
                  ) : (
                    <>
                      <ChevronsDownUp className="w-3.5 h-3.5" />
                      Collapse All
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => setMode('checklist')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  mode === 'checklist'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <ListChecks className="w-3.5 h-3.5" />
                Generate List ({stats.selectedItems})
              </button>

              <button
                type="button"
                onClick={() => setMode('receipt')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  mode === 'receipt'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                Thermal Receipt
              </button>
            </div>
          </div>

          {/* Action buttons & quiet tabular summary */}
          <div className="pt-3 border-t border-slate-100 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleClearSelection}
                disabled={stats.selectedItems === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50/70 border border-amber-200 rounded-lg hover:bg-amber-100 disabled:opacity-45 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0"
              >
                <Eraser className="w-3.5 h-3.5" />
                Clear Selection
              </button>

              <button
                type="button"
                onClick={() => setConfirmResetOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50/70 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset to Original
              </button>

              <button
                type="button"
                onClick={handleCopyText}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50/70 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors whitespace-nowrap shrink-0"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Text
              </button>

              <button
                type="button"
                onClick={handleSavePdf}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-800 bg-red-50/70 border border-red-200 rounded-lg hover:bg-red-100 transition-colors whitespace-nowrap shrink-0"
              >
                <FileDown className="w-3.5 h-3.5" />
                Save as PDF
              </button>

              <button
                type="button"
                onClick={handleSaveGeneralJpg}
                disabled={isExportingJpg}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-800 bg-sky-50/70 border border-sky-200 rounded-lg hover:bg-sky-100 disabled:opacity-45 transition-colors whitespace-nowrap shrink-0"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                {isExportingJpg ? 'Saving JPG...' : 'Save as JPG'}
              </button>

              <button
                type="button"
                onClick={handleDownloadHtml}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-violet-800 bg-violet-50/70 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors whitespace-nowrap shrink-0"
              >
                <Code2 className="w-3.5 h-3.5" />
                Download HTML
              </button>
            </div>

            <div className="text-xs text-slate-500 tabular-nums flex flex-wrap items-center gap-2 shrink-0">
              {isCloudSynced && (
                <>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                    <Cloud className="w-3.5 h-3.5" />
                    Cloud synced
                  </span>
                  <span aria-hidden="true">·</span>
                </>
              )}
              <span className="inline-flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-700" />
                {stats.selectedItems} of {stats.totalItems} selected
              </span>
              <span aria-hidden="true">·</span>
              <span>{stats.totalQuantity} total qty</span>
              <span aria-hidden="true">·</span>
              <span>{stats.totalCategories} categories</span>
            </div>
          </div>
        </section>

        {isCloudLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[0, 1, 2, 3, 4, 5].map((skeletonIdx) => (
              <div
                key={skeletonIdx}
                className="bg-white border border-slate-200 rounded-xl p-4 h-56 animate-pulse space-y-3"
              >
                <div className="h-5 w-40 bg-slate-200 rounded" />
                <div className="h-4 w-full bg-slate-100 rounded" />
                <div className="h-4 w-5/6 bg-slate-100 rounded" />
                <div className="h-4 w-4/6 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {mode === 'catalog' && (
              <>
                {!hasVisibleCatalogCards ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-10 text-center max-w-lg mx-auto">
                    <h2 className="font-display text-base font-semibold text-slate-900">
                      No matching grocery items
                    </h2>
                    <p className="text-sm text-slate-600 mt-1.5 mb-5">
                      Try clearing your search or switching back to the All filter.
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                        >
                          Clear Search
                        </button>
                      )}
                      {filterMode !== 'all' && (
                        <button
                          type="button"
                          onClick={() => setFilterMode('all')}
                          className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800"
                        >
                          Show All Items
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
                    {categories.map((category, idx) => (
                      <CategoryCard
                        key={category.id}
                        category={category}
                        categoryIndex={idx}
                        searchQuery={searchQuery}
                        filterMode={filterMode}
                        onToggleCollapse={handleToggleCollapse}
                        onToggleItem={handleToggleItem}
                        onUpdateQuantity={handleUpdateQuantity}
                        onAddItem={handleInlineAddItem}
                        onEditItem={handleEditItem}
                        onDeleteItem={handleDeleteItem}
                        onDeleteCategory={(id) => {
                          const found = categories.find((c) => c.id === id);
                          if (found) setCategoryToDelete(found);
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {mode === 'checklist' && (
              <ShoppingListView
                categories={categories}
                searchQuery={searchQuery}
                onToggleBought={handleToggleBought}
                onUpdateQuantity={handleUpdateQuantity}
                onResetPicked={handleResetPicked}
                onBackToCatalog={() => setMode('catalog')}
                onOpenReceipt={() => setMode('receipt')}
              />
            )}

            {mode === 'receipt' && (
              <ThermalReceiptView
                categories={categories}
                receiptWidth={receiptWidth}
                receiptRef={receiptRef}
                onChangeWidth={setReceiptWidth}
                onSaveReceiptJpg={handleSaveReceiptJpg}
                onPrintReceipt={handlePrint}
                onBackToCatalog={() => setMode('catalog')}
                isExporting={isExportingJpg}
              />
            )}
          </>
        )}
      </main>

      {/* Off-screen Printable Checklist Sheet for Save as JPG outside Receipt mode */}
      <PrintableSheet categories={categories} sheetRef={sheetRef} />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccessToast={showToast}
      />

      <AddModal
        isOpen={isAddModalOpen}
        categories={categories}
        onClose={() => setIsAddModalOpen(false)}
        onAddItemToCategory={handleModalAddItem}
        onCreateCategory={handleCreateCategory}
      />

      <ConfirmModal
        isOpen={confirmResetOpen}
        title="Reset to Original Categories?"
        description="This restores all 12 pre-loaded grocery categories and items, replacing any custom edits or selections."
        confirmLabel="Reset to Original"
        onConfirm={handleConfirmResetOriginal}
        onCancel={() => setConfirmResetOpen(false)}
      />

      <ConfirmModal
        isOpen={categoryToDelete !== null}
        title={`Remove "${categoryToDelete?.name ?? ''}"?`}
        description="This removes the category and all items inside it from your saved list. You can restore defaults anytime with Reset to Original."
        confirmLabel="Remove Category"
        onConfirm={handleConfirmDeleteCategory}
        onCancel={() => setCategoryToDelete(null)}
      />

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="no-print fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-semibold shadow-lg"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
