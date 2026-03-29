import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  getDoc,
  setDoc,
  getDocs
} from "firebase/firestore";
import { db, auth } from "../firebase";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Clients API
export const subscribeToClients = (callback: (clients: any[]) => void) => {
  if (!auth.currentUser) return () => {};
  const q = query(collection(db, "clients"), where("ownerId", "==", auth.currentUser.uid));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (error) => handleFirestoreError(error, OperationType.LIST, "clients"));
};

export const addClient = async (clientData: any) => {
  try {
    return await addDoc(collection(db, "clients"), {
      ...clientData,
      ownerId: auth.currentUser?.uid,
      createdAt: Date.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, "clients");
  }
};

// Architects API
export const subscribeToArchitects = (callback: (architects: any[]) => void) => {
  if (!auth.currentUser) return () => {};
  const q = query(collection(db, "architects"), where("ownerId", "==", auth.currentUser.uid));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (error) => handleFirestoreError(error, OperationType.LIST, "architects"));
};

export const addArchitect = async (architectData: any) => {
  try {
    return await addDoc(collection(db, "architects"), {
      ...architectData,
      ownerId: auth.currentUser?.uid,
      createdAt: Date.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, "architects");
  }
};

// Sales API
export const subscribeToSales = (callback: (sales: any[]) => void) => {
  if (!auth.currentUser) return () => {};
  const q = query(collection(db, "sales"), where("ownerId", "==", auth.currentUser.uid));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (error) => handleFirestoreError(error, OperationType.LIST, "sales"));
};

export const addSale = async (saleData: any) => {
  try {
    return await addDoc(collection(db, "sales"), {
      ...saleData,
      ownerId: auth.currentUser?.uid,
      createdAt: Date.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, "sales");
  }
};

// Settings API
export const getCompanySettings = async () => {
  try {
    const docRef = doc(db, "settings", "company");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, "settings/company");
  }
};

export const updateCompanySettings = async (settings: any) => {
  try {
    await setDoc(doc(db, "settings", "company"), {
      ...settings,
      ownerId: auth.currentUser?.uid
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "settings/company");
  }
};

// Users Management API
export const subscribeToUsers = (callback: (users: any[]) => void) => {
  return onSnapshot(collection(db, "users"), (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (error) => handleFirestoreError(error, OperationType.LIST, "users"));
};

export const updateUserStatus = async (userId: string, status: 'authorized' | 'rejected') => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
};
