import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  Unsubscribe,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { createDefaultCategories } from '../data/defaultCategories';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { GroceryCategory, GroceryItem } from '../types/grocery';

interface FirestoreCategoryRecord {
  ownerId: string;
  name: string;
  order: number;
  collapsed: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

interface FirestoreItemRecord {
  ownerId: string;
  categoryId: string;
  name: string;
  selected: boolean;
  quantity: number;
  bought: boolean;
  order: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120);
  return cleaned.length > 0 ? cleaned : `id-${Date.now()}`;
}

function clampCategoryName(name: string): string {
  const trimmed = name.trim().slice(0, 80);
  return trimmed.length > 0 ? trimmed : 'Untitled Category';
}

function clampItemName(name: string): string {
  const trimmed = name.trim().slice(0, 120);
  return trimmed.length > 0 ? trimmed : 'Untitled Item';
}

function clampQuantity(qty: number): number {
  const n = Math.round(Number(qty) || 1);
  return Math.min(999, Math.max(1, n));
}

export async function ensureUserProfileAndSeed(
  user: User,
  localCategoriesFallback?: GroceryCategory[]
): Promise<void> {
  const uid = user.uid;
  const profilePath = `users/${uid}/private/profile`;
  const profileRef = doc(db, 'users', uid, 'private', 'profile');

  try {
    const profileSnap = await getDoc(profileRef);
    const displayName = (
      user.displayName ||
      user.email?.split('@')[0] ||
      'Grocery User'
    )
      .trim()
      .slice(0, 80);
    const email = (user.email || 'user@example.com').trim().slice(0, 254);

    if (!profileSnap.exists()) {
      await setDoc(profileRef, {
        uid,
        email,
        displayName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, profilePath);
  }

  const catsPath = `users/${uid}/categories`;
  try {
    const existingCatsSnap = await getDocs(
      query(collection(db, catsPath), where('ownerId', '==', uid), limit(1))
    );

    if (existingCatsSnap.empty) {
      const sourceCategories =
        localCategoriesFallback && localCategoriesFallback.length > 0
          ? localCategoriesFallback
          : createDefaultCategories();

      await seedCategoriesInBatches(uid, sourceCategories);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, catsPath);
  }
}

async function seedCategoriesInBatches(
  uid: string,
  categoriesToSeed: GroceryCategory[]
): Promise<void> {
  // First write all category docs so existsAfter/exists checks on items always succeed
  const catChunks: GroceryCategory[][] = [];
  for (let i = 0; i < categoriesToSeed.length; i += 400) {
    catChunks.push(categoriesToSeed.slice(i, i + 400));
  }

  for (let chunkIdx = 0; chunkIdx < catChunks.length; chunkIdx++) {
    const batch = writeBatch(db);
    const chunk = catChunks[chunkIdx];
    chunk.forEach((cat, idxInChunk) => {
      const order = chunkIdx * 400 + idxInChunk;
      const catId = sanitizeId(cat.id);
      const catRef = doc(db, 'users', uid, 'categories', catId);
      batch.set(catRef, {
        ownerId: uid,
        name: clampCategoryName(cat.name),
        order,
        collapsed: Boolean(cat.collapsed),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
  }

  // Then write all item docs in batches of up to 400
  const itemEntries: Array<{
    catId: string;
    item: GroceryItem;
    order: number;
  }> = [];
  categoriesToSeed.forEach((cat) => {
    const safeCatId = sanitizeId(cat.id);
    cat.items.forEach((item, itemIdx) => {
      itemEntries.push({ catId: safeCatId, item, order: itemIdx });
    });
  });

  for (let i = 0; i < itemEntries.length; i += 400) {
    const batch = writeBatch(db);
    const slice = itemEntries.slice(i, i + 400);
    slice.forEach(({ catId, item, order }) => {
      const itemId = sanitizeId(item.id);
      const itemRef = doc(db, 'users', uid, 'items', itemId);
      batch.set(itemRef, {
        ownerId: uid,
        categoryId: catId,
        name: clampItemName(item.name),
        selected: Boolean(item.selected),
        quantity: clampQuantity(item.quantity),
        bought: Boolean(item.bought),
        order,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
  }
}

export function subscribeUserGroceryList(
  uid: string,
  onCategoriesChange: (categories: GroceryCategory[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const catsPath = `users/${uid}/categories`;
  const itemsPath = `users/${uid}/items`;

  let latestCategories: Array<{ id: string; data: FirestoreCategoryRecord }> = [];
  let latestItems: Array<{ id: string; data: FirestoreItemRecord }> = [];
  let catsLoaded = false;
  let itemsLoaded = false;

  const emitCombined = () => {
    if (!catsLoaded || !itemsLoaded) return;

    const sortedCats = [...latestCategories].sort(
      (a, b) => a.data.order - b.data.order
    );

    const itemsByCat = new Map<
      string,
      Array<{ id: string; data: FirestoreItemRecord }>
    >();
    for (const entry of latestItems) {
      const list = itemsByCat.get(entry.data.categoryId) || [];
      list.push(entry);
      itemsByCat.set(entry.data.categoryId, list);
    }

    const assembled: GroceryCategory[] = sortedCats.map((cat) => {
      const catItems = (itemsByCat.get(cat.id) || [])
        .sort((a, b) => a.data.order - b.data.order)
        .map((it) => ({
          id: it.id,
          name: it.data.name,
          selected: Boolean(it.data.selected),
          quantity: clampQuantity(it.data.quantity),
          bought: Boolean(it.data.bought),
        }));

      return {
        id: cat.id,
        name: cat.data.name,
        collapsed: Boolean(cat.data.collapsed),
        items: catItems,
      };
    });

    onCategoriesChange(assembled);
  };

  const unsubCats = onSnapshot(
    query(collection(db, catsPath), where('ownerId', '==', uid)),
    (snapshot) => {
      latestCategories = snapshot.docs.map((d) => ({
        id: d.id,
        data: d.data() as FirestoreCategoryRecord,
      }));
      catsLoaded = true;
      emitCombined();
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, catsPath);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );

  const unsubItems = onSnapshot(
    query(collection(db, itemsPath), where('ownerId', '==', uid)),
    (snapshot) => {
      latestItems = snapshot.docs.map((d) => ({
        id: d.id,
        data: d.data() as FirestoreItemRecord,
      }));
      itemsLoaded = true;
      emitCombined();
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, itemsPath);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );

  return () => {
    unsubCats();
    unsubItems();
  };
}

export async function cloudToggleCollapse(
  uid: string,
  categoryId: string,
  collapsed: boolean
): Promise<void> {
  const path = `users/${uid}/categories/${categoryId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'categories', categoryId), {
      collapsed,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function cloudSetAllCollapsed(
  uid: string,
  categoryIds: string[],
  collapsed: boolean
): Promise<void> {
  const path = `users/${uid}/categories`;
  try {
    for (let i = 0; i < categoryIds.length; i += 400) {
      const batch = writeBatch(db);
      categoryIds.slice(i, i + 400).forEach((catId) => {
        batch.update(doc(db, 'users', uid, 'categories', catId), {
          collapsed,
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function cloudCreateCategory(
  uid: string,
  categoryName: string,
  order: number,
  initialItems: string[],
  autoSelect: boolean
): Promise<void> {
  const catId = sanitizeId(`cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  const catPath = `users/${uid}/categories/${catId}`;

  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', uid, 'categories', catId), {
      ownerId: uid,
      name: clampCategoryName(categoryName),
      order: Math.max(0, Math.round(order)),
      collapsed: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    initialItems.forEach((rawName, idx) => {
      const itemId = sanitizeId(
        `item-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`
      );
      batch.set(doc(db, 'users', uid, 'items', itemId), {
        ownerId: uid,
        categoryId: catId,
        name: clampItemName(rawName),
        selected: autoSelect,
        quantity: 1,
        bought: false,
        order: idx,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, catPath);
  }
}

export async function cloudDeleteCategory(
  uid: string,
  categoryId: string,
  itemIds: string[]
): Promise<void> {
  const catPath = `users/${uid}/categories/${categoryId}`;
  try {
    for (let i = 0; i < itemIds.length; i += 400) {
      const batch = writeBatch(db);
      itemIds.slice(i, i + 400).forEach((itemId) => {
        batch.delete(doc(db, 'users', uid, 'items', itemId));
      });
      await batch.commit();
    }
    await deleteDoc(doc(db, 'users', uid, 'categories', categoryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, catPath);
  }
}

export async function cloudAddItem(
  uid: string,
  categoryId: string,
  itemName: string,
  quantity: number,
  selected: boolean,
  order: number
): Promise<void> {
  const itemId = sanitizeId(
    `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  );
  const path = `users/${uid}/items/${itemId}`;

  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', uid, 'categories', categoryId), {
      collapsed: false,
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'users', uid, 'items', itemId), {
      ownerId: uid,
      categoryId,
      name: clampItemName(itemName),
      selected,
      quantity: clampQuantity(quantity),
      bought: false,
      order: Math.max(0, Math.round(order)),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function cloudToggleItem(
  uid: string,
  itemId: string,
  selected: boolean,
  bought: boolean
): Promise<void> {
  const path = `users/${uid}/items/${itemId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'items', itemId), {
      selected,
      bought,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function cloudToggleBought(
  uid: string,
  itemId: string,
  bought: boolean
): Promise<void> {
  const path = `users/${uid}/items/${itemId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'items', itemId), {
      bought,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function cloudUpdateQuantity(
  uid: string,
  itemId: string,
  quantity: number
): Promise<void> {
  const path = `users/${uid}/items/${itemId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'items', itemId), {
      quantity: clampQuantity(quantity),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function cloudEditItem(
  uid: string,
  itemId: string,
  newName: string
): Promise<void> {
  const path = `users/${uid}/items/${itemId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'items', itemId), {
      name: clampItemName(newName),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function cloudDeleteItem(
  uid: string,
  itemId: string
): Promise<void> {
  const path = `users/${uid}/items/${itemId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'items', itemId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function cloudClearSelection(
  uid: string,
  selectedItemIds: string[]
): Promise<void> {
  const path = `users/${uid}/items`;
  try {
    for (let i = 0; i < selectedItemIds.length; i += 400) {
      const batch = writeBatch(db);
      selectedItemIds.slice(i, i + 400).forEach((itemId) => {
        batch.update(doc(db, 'users', uid, 'items', itemId), {
          selected: false,
          bought: false,
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function cloudResetPicked(
  uid: string,
  boughtItemIds: string[]
): Promise<void> {
  const path = `users/${uid}/items`;
  try {
    for (let i = 0; i < boughtItemIds.length; i += 400) {
      const batch = writeBatch(db);
      boughtItemIds.slice(i, i + 400).forEach((itemId) => {
        batch.update(doc(db, 'users', uid, 'items', itemId), {
          bought: false,
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function cloudResetToOriginal(
  uid: string,
  existingCategories: GroceryCategory[],
  targetCategories?: GroceryCategory[]
): Promise<void> {
  const path = `users/${uid}/categories`;
  try {
    const allItemIds = existingCategories.flatMap((c) =>
      c.items.map((it) => it.id)
    );
    const allCatIds = existingCategories.map((c) => c.id);

    for (let i = 0; i < allItemIds.length; i += 400) {
      const batch = writeBatch(db);
      allItemIds.slice(i, i + 400).forEach((id) => {
        batch.delete(doc(db, 'users', uid, 'items', id));
      });
      await batch.commit();
    }

    for (let i = 0; i < allCatIds.length; i += 400) {
      const batch = writeBatch(db);
      allCatIds.slice(i, i + 400).forEach((id) => {
        batch.delete(doc(db, 'users', uid, 'categories', id));
      });
      await batch.commit();
    }

    await seedCategoriesInBatches(
      uid,
      targetCategories && targetCategories.length > 0
        ? targetCategories
        : createDefaultCategories()
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function cloudSaveAsOriginal(
  uid: string,
  categoriesToSave: GroceryCategory[]
): Promise<void> {
  const tplCatsPath = `users/${uid}/templateCategories`;
  const tplItemsPath = `users/${uid}/templateItems`;

  try {
    // Delete any existing saved template items and categories
    const oldItemsSnap = await getDocs(
      query(collection(db, tplItemsPath), where('ownerId', '==', uid))
    );
    const oldCatsSnap = await getDocs(
      query(collection(db, tplCatsPath), where('ownerId', '==', uid))
    );

    const oldItemDocs = oldItemsSnap.docs;
    for (let i = 0; i < oldItemDocs.length; i += 400) {
      const batch = writeBatch(db);
      oldItemDocs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    const oldCatDocs = oldCatsSnap.docs;
    for (let i = 0; i < oldCatDocs.length; i += 400) {
      const batch = writeBatch(db);
      oldCatDocs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    // Write template categories first
    for (let i = 0; i < categoriesToSave.length; i += 400) {
      const batch = writeBatch(db);
      categoriesToSave.slice(i, i + 400).forEach((cat, idxInChunk) => {
        const catId = sanitizeId(cat.id);
        const catRef = doc(db, tplCatsPath, catId);
        batch.set(catRef, {
          ownerId: uid,
          name: clampCategoryName(cat.name),
          order: i + idxInChunk,
          collapsed: Boolean(cat.collapsed),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();
    }

    // Write template items
    const itemEntries: Array<{
      catId: string;
      item: GroceryItem;
      order: number;
    }> = [];
    categoriesToSave.forEach((cat) => {
      const safeCatId = sanitizeId(cat.id);
      cat.items.forEach((item, itemIdx) => {
        itemEntries.push({ catId: safeCatId, item, order: itemIdx });
      });
    });

    for (let i = 0; i < itemEntries.length; i += 400) {
      const batch = writeBatch(db);
      itemEntries.slice(i, i + 400).forEach(({ catId, item, order }) => {
        const itemId = sanitizeId(item.id);
        const itemRef = doc(db, tplItemsPath, itemId);
        batch.set(itemRef, {
          ownerId: uid,
          categoryId: catId,
          name: clampItemName(item.name),
          selected: Boolean(item.selected),
          quantity: clampQuantity(item.quantity),
          bought: false,
          order,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, tplCatsPath);
  }
}

export async function cloudGetSavedOriginal(
  uid: string
): Promise<GroceryCategory[] | null> {
  const tplCatsPath = `users/${uid}/templateCategories`;
  const tplItemsPath = `users/${uid}/templateItems`;

  try {
    const [catsSnap, itemsSnap] = await Promise.all([
      getDocs(query(collection(db, tplCatsPath), where('ownerId', '==', uid))),
      getDocs(query(collection(db, tplItemsPath), where('ownerId', '==', uid))),
    ]);

    if (catsSnap.empty) return null;

    const sortedCats = catsSnap.docs
      .map((d) => ({
        id: d.id,
        data: d.data() as FirestoreCategoryRecord,
      }))
      .sort((a, b) => a.data.order - b.data.order);

    const itemsByCat = new Map<
      string,
      Array<{ id: string; data: FirestoreItemRecord }>
    >();
    itemsSnap.docs.forEach((d) => {
      const data = d.data() as FirestoreItemRecord;
      const list = itemsByCat.get(data.categoryId) || [];
      list.push({ id: d.id, data });
      itemsByCat.set(data.categoryId, list);
    });

    return sortedCats.map((cat) => ({
      id: cat.id,
      name: cat.data.name,
      collapsed: Boolean(cat.data.collapsed),
      items: (itemsByCat.get(cat.id) || [])
        .sort((a, b) => a.data.order - b.data.order)
        .map((it) => ({
          id: it.id,
          name: it.data.name,
          selected: Boolean(it.data.selected),
          quantity: clampQuantity(it.data.quantity),
          bought: false,
        })),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, tplCatsPath);
  }
}

