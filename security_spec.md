# Firestore Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Strict Ownership Isolation**: Every user profile (`/users/{userId}/private/{docId}`), grocery category (`/users/{userId}/categories/{categoryId}`), and grocery item (`/users/{userId}/items/{itemId}`) belongs strictly to `userId` (`request.auth.uid`), and writes require `request.auth.token.email_verified == true`.
2. **Referential Integrity**: A grocery item cannot be created without a valid `categoryId` whose document exists (or is created atomically in the same batch via `existsAfter`) under `/users/{userId}/categories/{categoryId}`.
3. **Immutability & Server Timestamps**: `ownerId`/`uid` and `createdAt` are immutable after creation. All `createdAt` and `updatedAt` timestamps must equal `request.time`.
4. **Bounded Fields & No Ghost Keys**: Every document enforces exact `keys().hasAll(...)` and `keys().hasOnly(...)` on create, `affectedKeys().hasOnly(...)` on update, and strict type/size bounds matching `firebase-blueprint.json`.

## 2. Dirty Dozen Attack Payloads (All Must Fail with PERMISSION_DENIED)
1. **Cross-User Read/Write**: User A (`uidA`) attempts `get`/`list`/`create` under `/users/uidB/categories/cat1`.
2. **Unverified Email Write**: Authenticated user with `email_verified: false` attempts to create `/users/{uid}/categories/cat1`.
3. **Identity Spoofing on Create**: User A creates `/users/uidA/categories/cat1` with `ownerId: "uidB"`.
4. **Shadow/Ghost Field Injection**: User A creates `/users/{uid}/items/item1` including an extra key `isAdmin: true`.
5. **Owner Mutation on Update**: User A updates `/users/{uid}/categories/cat1` attempting to change `ownerId` or `createdAt`.
6. **Client Timestamp Forgery**: User A creates `/users/{uid}/items/item1` with a backdated `createdAt` instead of `request.time`.
7. **Orphan Item Creation**: User A creates `/users/{uid}/items/item1` pointing to a non-existent `categoryId: "missing-cat"`.
8. **ID Poisoning (Oversized / Invalid Path ID)**: User A attempts to create `/users/{uid}/categories/${'a'.repeat(200)}`.
9. **Value Type Poisoning**: User A updates item `quantity` to `"five"` (string) or `-10` or `10000`.
10. **Oversized String Exhaustion**: User A creates an item with `name` of 500 characters (`maxLength: 120`).
11. **PII Cross-Read**: User A attempts to read `/users/uidB/private/profile`.
12. **Blanket Collection Access**: Unauthenticated or cross-user `list` query on `/users/uidB/items`.
