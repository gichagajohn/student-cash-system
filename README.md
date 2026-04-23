# 🏦 Student Cash Management System

A full-stack web application for boarding schools where teachers safely hold money for students and issue it in controlled amounts. Built like a **mini banking system** — not a simple record book.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 Role-based auth | Admin & Teacher roles via Firebase Auth |
| 💰 Real-time balance | Computed from transactions (never stored directly) |
| 🚫 Overdraft protection | System blocks withdrawals exceeding balance |
| 🔁 Reversals | Corrects mistakes without deleting records |
| 📊 Reports & CSV export | Student statements, teacher summaries, full audit trail |
| 📱 Mobile-first | Teachers can use on phones |
| 🔒 Immutable transactions | Records can never be edited or deleted |
| 📶 Offline support | Firestore IndexedDB caching |

---

## 🛠 Tech Stack

- **Frontend:** React 18 + Tailwind CSS + Vite
- **Backend:** Firebase (Firestore + Authentication + Hosting)
- **No custom backend** — serverless architecture

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/student-cash-system.git
cd student-cash-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Firebase

#### a. Create a Firebase Project
1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"** → give it a name (e.g., `school-cash-system`)
3. Disable Google Analytics if not needed → **Create project**

#### b. Enable Authentication
1. In Firebase Console → **Build → Authentication**
2. Click **"Get started"**
3. Under **Sign-in method**, enable **Email/Password**
4. Click **Save**

#### c. Create Firestore Database
1. In Firebase Console → **Build → Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in production mode"** (rules are in `firestore.rules`)
4. Select your region (e.g., `europe-west1` for Kenya)
5. Click **Done**

#### d. Deploy Firestore Rules & Indexes
```bash
# Install Firebase CLI if you haven't already
npm install -g firebase-tools

# Login
firebase login

# Initialize (select Firestore only)
firebase init firestore

# Deploy rules and indexes
firebase deploy --only firestore
```

#### e. Get Your Firebase Config
1. In Firebase Console → **Project Settings** (gear icon)
2. Scroll to **"Your apps"** → click **Web app** (`</>` icon)
3. Register the app → copy the config object

### 4. Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` and fill in your Firebase values:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 5. Create the First Admin Account

You need to manually create the admin user:

#### Option A: Firebase Console (Easiest)
1. Firebase Console → **Authentication → Users → Add user**
2. Enter admin email & password
3. Copy the generated **UID**
4. Go to **Firestore Database → Start collection → `users`**
5. Document ID = the UID you copied
6. Add these fields:
   ```
   name: "Admin Name"          (string)
   email: "admin@school.ac.ke" (string)
   role: "admin"               (string)
   createdAt: (use timestamp)  (timestamp)
   ```

#### Option B: Firebase Admin SDK Script (Advanced)
See the `scripts/` folder docs for a Node.js seeding script.

### 6. Run the App Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 📁 Project Structure

```
student-cash-system/
├── src/
│   ├── firebase/
│   │   ├── config.js          # Firebase init
│   │   └── firestore.js       # All DB operations
│   ├── contexts/
│   │   └── AuthContext.jsx    # Auth state + role management
│   ├── components/
│   │   └── shared/
│   │       ├── Layout.jsx           # Sidebar + navigation
│   │       ├── TransactionModal.jsx # Deposit/withdrawal form
│   │       ├── ReversalModal.jsx    # Correct mistakes
│   │       └── AddStudentModal.jsx  # Register student
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── TeacherDashboard.jsx
│   │   ├── StudentsPage.jsx
│   │   ├── StudentDetail.jsx    # Full wallet + history
│   │   ├── TransactionsPage.jsx # Filterable audit log
│   │   ├── ReportsPage.jsx      # CSV export
│   │   └── TeachersPage.jsx     # Admin: manage teachers
│   ├── App.jsx                  # Router + protected routes
│   ├── main.jsx
│   └── index.css
├── firestore.rules              # Security rules
├── firestore.indexes.json       # Composite indexes
├── firebase.json                # Hosting config
├── .env.example
└── package.json
```

---

## 🔐 Security Rules Overview

The `firestore.rules` file enforces:

- **Transactions are IMMUTABLE** — `update` and `delete` are set to `false`
- Teachers can only read/write their own students and transactions
- Balance is never stored — always computed server-side in queries
- Admins have full read access

---

## 💾 Firestore Data Model

```
users/{uid}
  name: string
  email: string
  role: "admin" | "teacher"
  createdAt: timestamp

students/{id}
  fullName: string
  admissionNumber: string  ← unique
  gradeOrForm: string
  teacherIds: string[]     ← supports multiple teachers
  createdAt: timestamp

transactions/{id}
  studentId: string
  teacherId: string
  type: "deposit" | "withdrawal"
  amount: number           ← always positive
  note: string
  isReversal: boolean      ← true for correction entries
  originalTxId: string     ← links reversal to original
  createdAt: timestamp
```

**Balance formula (always computed, never stored):**
```
Balance = Σ(deposits) - Σ(withdrawals)
```

---

## 🌐 Deploy to GitHub + Firebase Hosting

### Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/student-cash-system.git
git push -u origin main
```

### Deploy to Firebase Hosting

```bash
# Build production bundle
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

Your app will be live at: `https://your-project-id.web.app`

### Optional: GitHub Actions CI/CD

Create `.github/workflows/deploy.yml` to auto-deploy on push to `main`:

```yaml
name: Deploy to Firebase Hosting
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
```

> Add all `VITE_FIREBASE_*` values as **GitHub Secrets** in your repo settings.

---

## 👥 User Guide

### Admin Workflow
1. Log in → Admin Dashboard
2. Go to **Teachers** → Create teacher accounts
3. Go to **Students** → See all students system-wide
4. Go to **Reports** → Export CSV files

### Teacher Workflow
1. Log in → Teacher Dashboard
2. **Add Student** → Fill in name, admission number, grade
3. Click **Deposit** on any student → Record money received
4. Click **Withdraw** → Enter amount + PIN → Confirm
5. Click any student → View full transaction history
6. Go to **Reports** → Export student statement as CSV

### Correcting a Mistake
- Open the student's transaction history
- Hover over a transaction → click **Reverse**
- Enter a reason → Confirm
- A new reversal entry is created (original record preserved)

---

## ⚠️ Important Notes

1. **Default withdrawal PIN is `1234`** — change this in `TransactionModal.jsx` line where `WITHDRAWAL_PIN` is defined. In production, store PINs per teacher in Firestore.
2. **Never commit `.env`** — it contains your Firebase API keys
3. **Firestore rules must be deployed** before the app works correctly in production
4. The app requires **Firestore composite indexes** — run `firebase deploy --only firestore` after cloning

---

## 🔧 Customisation Tips

| What to change | Where |
|---|---|
| Currency symbol (KES) | Global search & replace `KES` |
| Low balance threshold (500) | Search for `500` in Reports & TransactionModal |
| Withdrawal PIN | `TransactionModal.jsx` → `WITHDRAWAL_PIN` constant |
| School grades list | `AddStudentModal.jsx` → `grades` array |
| Max transactions on dashboard | `firestore.js` → `subscribeToAllTransactions` limit |

---

## 📝 License

MIT — Free to use for schools and educational institutions.
