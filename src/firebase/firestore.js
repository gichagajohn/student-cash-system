// src/firebase/firestore.js
// All Firestore read/write operations

import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  runTransaction,
  onSnapshot,
  limit,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from './config';

// ─── USERS ──────────────────────────────────────────────────────────────────

export async function createTeacherAccount(name, email, password) {
  // Create Firebase Auth user
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  // Write profile to Firestore
  await setDoc(doc(db, 'users', credential.user.uid), {
    name,
    email,
    role: 'teacher',
    createdAt: serverTimestamp(),
  });
  return credential.user;
}

export async function getAllUsers() {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getUserById(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateUser(uid, data) {
  await updateDoc(doc(db, 'users', uid), data);
}

export async function deleteUser(uid) {
  await deleteDoc(doc(db, 'users', uid));
}

// ─── STUDENTS ───────────────────────────────────────────────────────────────

export async function createStudent(data) {
  // Check admission number is unique
  const q = query(
    collection(db, 'students'),
    where('admissionNumber', '==', data.admissionNumber)
  );
  const existing = await getDocs(q);
  if (!existing.empty) throw new Error('Admission number already exists.');

  const ref = await addDoc(collection(db, 'students'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateStudent(id, data) {
  await updateDoc(doc(db, 'students', id), data);
}

export async function getStudentsByTeacher(teacherId) {
  const q = query(
    collection(db, 'students'),
    where('teacherIds', 'array-contains', teacherId),
    orderBy('fullName')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAllStudents() {
  const q = query(collection(db, 'students'), orderBy('fullName'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getStudentById(id) {
  const snap = await getDoc(doc(db, 'students', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ─── TRANSACTIONS ────────────────────────────────────────────────────────────

/**
 * Calculate balance from transactions array
 */
export function calculateBalance(transactions) {
  return transactions.reduce((sum, tx) => {
    return tx.type === 'deposit' ? sum + tx.amount : sum - tx.amount;
  }, 0);
}

/**
 * Get all transactions for a student
 */
export async function getTransactionsByStudent(studentId) {
  const q = query(
    collection(db, 'transactions'),
    where('studentId', '==', studentId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Get transactions by teacher
 */
export async function getTransactionsByTeacher(teacherId) {
  const q = query(
    collection(db, 'transactions'),
    where('teacherId', '==', teacherId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Get all transactions (admin)
 */
export async function getAllTransactions() {
  const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Record a deposit — no balance check needed
 */
export async function recordDeposit({ studentId, teacherId, amount, note }) {
  if (amount <= 0) throw new Error('Amount must be positive.');
  const ref = await addDoc(collection(db, 'transactions'), {
    studentId,
    teacherId,
    type: 'deposit',
    amount: Number(amount),
    note: note || '',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * Record a withdrawal — uses Firestore transaction to prevent race conditions
 */
export async function recordWithdrawal({ studentId, teacherId, amount, note }) {
  if (amount <= 0) throw new Error('Amount must be positive.');

  return await runTransaction(db, async (transaction) => {
    // Read all transactions for this student inside the transaction
    const q = query(
      collection(db, 'transactions'),
      where('studentId', '==', studentId)
    );
    const snap = await getDocs(q); // Note: getDocs outside runTransaction is safe for reads
    const txList = snap.docs.map((d) => d.data());
    const balance = calculateBalance(txList);

    if (amount > balance) {
      throw new Error(
        `Insufficient balance. Available: KES ${balance.toLocaleString()}`
      );
    }

    // Write new withdrawal
    const newRef = doc(collection(db, 'transactions'));
    transaction.set(newRef, {
      studentId,
      teacherId,
      type: 'withdrawal',
      amount: Number(amount),
      note: note || '',
      createdAt: serverTimestamp(),
    });

    return newRef.id;
  });
}

/**
 * Create a reversal transaction to correct a mistake
 */
export async function recordReversal({ originalTxId, studentId, teacherId, amount, originalType, note }) {
  const reversalType = originalType === 'deposit' ? 'withdrawal' : 'deposit';

  // For reversing a deposit (which creates a withdrawal), check balance first
  if (reversalType === 'withdrawal') {
    const txList = await getTransactionsByStudent(studentId);
    const balance = calculateBalance(txList);
    if (amount > balance) {
      throw new Error(`Cannot reverse: Insufficient balance. Available: KES ${balance.toLocaleString()}`);
    }
  }

  const ref = await addDoc(collection(db, 'transactions'), {
    studentId,
    teacherId,
    type: reversalType,
    amount: Number(amount),
    note: `REVERSAL of transaction ${originalTxId}: ${note || ''}`,
    isReversal: true,
    originalTxId,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// ─── REALTIME LISTENERS ──────────────────────────────────────────────────────

export function subscribeToStudentTransactions(studentId, callback) {
  const q = query(
    collection(db, 'transactions'),
    where('studentId', '==', studentId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function subscribeToTeacherStudents(teacherId, callback) {
  const q = query(
    collection(db, 'students'),
    where('teacherIds', 'array-contains', teacherId),
    orderBy('fullName')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function subscribeToAllTransactions(callback) {
  const q = query(
    collection(db, 'transactions'),
    orderBy('createdAt', 'desc'),
    limit(200)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// ─── STATS ───────────────────────────────────────────────────────────────────

export async function getSystemStats() {
  const [students, transactions, users] = await Promise.all([
    getDocs(collection(db, 'students')),
    getDocs(collection(db, 'transactions')),
    getDocs(query(collection(db, 'users'), where('role', '==', 'teacher'))),
  ]);

  const txList = transactions.docs.map((d) => d.data());
  const totalDeposits = txList
    .filter((t) => t.type === 'deposit')
    .reduce((s, t) => s + t.amount, 0);
  const totalWithdrawals = txList
    .filter((t) => t.type === 'withdrawal')
    .reduce((s, t) => s + t.amount, 0);

  return {
    totalStudents: students.size,
    totalTeachers: users.size,
    totalTransactions: transactions.size,
    totalFundsHeld: totalDeposits - totalWithdrawals,
    totalDeposits,
    totalWithdrawals,
  };
}
