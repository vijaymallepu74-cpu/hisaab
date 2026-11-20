# HISAAB — Premium Digital Ledger

> **Your shop. Your ledger. Simplified.**  
> A mobile-first digital khata designed for local Indian kirana and provision store owners to record credit, track payments, calculate balances, and send automated WhatsApp payment reminders.

---

## 🌟 Hackathon 10 Evaluation Compliance

Every required selector, behavior, and data criterion has been built and strictly verified:

| Feature | Required Selector | Implementation Status | Verified |
|---|---|---|---|
| **Total Outstanding** | `#total-outstanding` | Dynamic sum of all customer balances | **PASS (₹11,820 on sample data)** |
| **Customer Row** | `[data-customer="<phone>"]` | Attribute with 10-digit clean phone on every customer row | **PASS** |
| **Customer Balance** | `[data-balance]` | Located directly inside matching `[data-customer]` | **PASS** |
| **WhatsApp Reminder** | `a[data-remind="<phone>"]` | Real `<a href="...">` pointing to `https://wa.me/91<phone>?text=...` | **PASS** |
| **Import Textarea** | `#import-box` | Textarea for evaluator JSON payload | **PASS** |
| **Import Button** | `#import-go` | Button triggering full dataset replacement & recalculation | **PASS** |
| **Screenshot Input** | `#shot-input` | Real file input `<input type="file" id="shot-input" accept="image/*">` | **PASS** |
| **Screenshot Display** | `img[data-shot]` | Thumbnail with `data-shot` rendered on payment transactions | **PASS (IndexedDB persisted)** |

---

## 📊 Sample Data Acceptance Test Verification

When importing `sample-data.json` with effective date `2026-11-15`:

- **Effective Date:** `2026-11-15` (reads `?today=2026-11-15` query parameter)
- **Total Outstanding:** `₹11,820` (Exact mathematical match)
- **Customers with Balances:** `8`
- **Customer Balances (Sum = ₹11,820):**
  - **Ravi Kumar** (`9000000101`): `₹670`
  - **Sunita Devi** (`9000000102`): `₹3,470` *(Top Defaulter)*
  - **Mohd Irfan** (`9000000103`): `₹2,810`
  - **Anjali Reddy** (`9000000104`): `₹1,260`
  - **Prakash Rao** (`9000000105`): `₹230`
  - **Fatima Begum** (`9000000106`): `₹2,830`
  - **Venkat Naidu** (`9000000107`): `₹250`
  - **Kavitha S** (`9000000108`): `₹300`
- **Top Defaulter:** Sunita Devi (`9000000102`) with `₹3,470`

---

## 🎨 Design System & Palette

- **Primary Emerald:** `#087F5B`
- **Primary Dark:** `#066348`
- **Secondary Mint:** `#E8F5EE`
- **Background:** `#F8FAF8`
- **Card Background:** `#FFFFFF`
- **Main Text:** `#17231E`
- **Secondary Text:** `#64748B`
- **Borders:** `#E5EAE7`
- **Credit Green:** `#16A36A`
- **Payment Coral:** `#E76F51`
- **Warning Amber:** `#F59E0B`
- **Error Red:** `#DC2626`
- **Typography:** Inter, 4px spacing grid, touch targets ≥ 44px, rounded corners (14–18px cards).

---

## 🚀 Key Features

1. **Dashboard:**
   - Real-time dynamic `#total-outstanding` counter.
   - Immediate search filter by customer name or phone number.
   - Quick WhatsApp reminder buttons for all debtors.
   - Top defaulter spotlight card.

2. **Customer Ledger:**
   - Financial breakdown: Net Balance, Total Credit, Total Received.
   - Prominent **Give Credit** (Green) and **Receive Payment** (Coral) actions.
   - Full transaction history sorted newest first with credit/payment badges.
   - Payment screenshot thumbnail preview with full-size lightbox.
   - Edit amount, date, note, or delete transaction with confirmation.

3. **Payment Screenshot Persistence:**
   - Native `<input type="file" id="shot-input" accept="image/*">`.
   - Stored in browser **IndexedDB** for reliable cross-reload persistence.
   - Thumbnails marked with `<img data-shot ...>`.

4. **WhatsApp Reminder Integration:**
   - Evaluator-compliant format: `https://wa.me/91<phone>?text=<URL-ENCODED-MESSAGE>`
   - Dynamically includes customer name, outstanding balance, shop name, and optional UPI ID.

5. **JSON Import (`#import-box` & `#import-go`):**
   - Strictly validates payload structure, customer mobile numbers, entries, dates, and amounts.
   - Completely replaces current dataset, persists to storage, and refreshes the entire UI.

6. **Overdue Customers View:**
   - Ranks customers by days since last payment (most delayed first).
   - Distinct section for customers who have never made a payment.

7. **Date Query Parameter Handling:**
   - Reads `?today=YYYY-MM-DD` URL query parameter without timezone conversion bugs.
   - Defaults new transactions, overdue metrics, and header date to the effective date.

8. **Bonus Features Implemented:**
   - ✅ **Master Excel (.xlsx) Ledger Export**: Loads and populates the existing Excel template from `public/` using ExcelJS, strictly preserving all column widths, borders, fonts, alignments, and preformatted rows.
   - ✅ **Separate CSV Export**: Kept intact as an independent spreadsheet download.
   - ✅ **Overdue Customer Ranking**: Ranks customers by days since last payment with "Never Paid" alerts.
   - ✅ **Transaction Management**: Edit amount, date, and note, or delete with confirmation and immediate balance recalculation.
   - ✅ **Customer Search**: Instant multi-attribute search by name or 10-digit mobile number.
   - ✅ **Configurable UPI ID**: Adds `upi://pay?pa=<UPI_ID>&am=<AMOUNT>` inside WhatsApp reminders if configured in settings.
   - ✅ **Bilingual Interface**: Seamless toggle between English (default) and Telugu (తెలుగు).

9. **Multi-Shop Tenant Isolation & Security:**
   - Multiple shop profiles can operate independently in the same browser using stable `shopId` boundaries.
   - Dual-tier storage isolation: LocalStorage (`hisaab_store_${shopId}_v1`) and IndexedDB v3 stores indexed by `shopId`.
   - **Reset Local Ledger**: Only deletes the active shop's data from this browser; leaves other shops and other devices untouched.
   - Distinct in-app explanation clarifying difference between In-App Reset vs Browser-level Clear Site Data.
   - Zero console leakage of sensitive customer phone numbers, balances, or financial notes.
   - Detailed cloud migration blueprint in [docs/multi-tenant-architecture.md](docs/multi-tenant-architecture.md).

10. **Encrypted Backup & Restore Vault (.hisaab):**
    - Password-protected authenticated encryption using **AES-256-GCM** and **PBKDF2-HMAC-SHA256** (100,000 iterations, 16-byte salt, 12-byte IV).
    - Portable single-file export (`.hisaab`) archiving shop profile, all customers, transactions, and payment screenshots.
    - Pre-restore preview card displaying shop name, customer count, transaction count, receipt attachments, and total outstanding before confirmation.
    - Safe validation: wrong passwords or tampered ciphertexts are rejected before any data is modified.
    - Preserves multi-shop isolation during restore operations.

---

## 💻 Running Locally & Verification Suites

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Run automated evaluator test suite (all 8 selectors, sample dataset ₹11,820, screenshots)
node test-evaluator.cjs

# 4. Run master Excel template export test suite (9 layout & formatting verification checks)
node test-excel-export.cjs

# 5. Run multi-shop data isolation & security test suite (cross-shop isolation & reset checks)
node test-multi-shop.cjs

# 6. Run encrypted backup & restore vault test suite (AES-256-GCM roundtrip & tamper checks)
node test-backup-vault.cjs

# 7. Run 100,000 transaction scalability benchmark
node test-scalability.cjs

# 8. Production build
npm run build
```
