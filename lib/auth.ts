import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Lazy initialization of Firebase
function initializeFirebase() {
  if (getApps().length > 0) {
    return; // Already initialized
  }
  
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    throw new Error('Firebase credentials are required');
  }
  
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };

  initializeApp({
    credential: cert(serviceAccount),
  });
}

export async function verifyToken(token: string) {
  try {
    initializeFirebase();
    // debugger;
    const decoded = await getAuth().verifyIdToken(token);
    if (decoded.uid !== process.env.FIREBASE_USER_UID) {
      throw new Error('Unauthorized');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export async function requireAuth(request: Request) {
  initializeFirebase();
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }
  
  const token = authHeader.split(' ')[1];
  return await verifyToken(token);
}