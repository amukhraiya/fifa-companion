import * as admin from 'firebase-admin';
import { env } from '@fifa/config';
import { logger } from '../lib/logger';

export interface AuthUser {
  firebaseUid: string;
  email: string;
  emailVerified: boolean;
}

export interface IAuthService {
  register(email: string, password: string): Promise<AuthUser>;
  login(email: string, password: string): Promise<AuthUser>;
  verifyIdToken(idToken: string): Promise<AuthUser>;
  sendPasswordResetEmail(email: string): Promise<void>;
}

// -------------------------------------------------------------
// 1. Firebase Authentication Service Strategy
// -------------------------------------------------------------
export class FirebaseAuthService implements IAuthService {
  private adminApp: admin.app.App;

  constructor() {
    logger.info('Initializing Concrete FirebaseAuthService');
    const privateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

    // To prevent multiple apps initialization errors in hot reload or testing
    if (admin.apps.length > 0 && admin.apps[0]) {
      this.adminApp = admin.apps[0];
    } else {
      this.adminApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
    }
  }

  async register(email: string, password: string): Promise<AuthUser> {
    try {
      const userRecord = await this.adminApp.auth().createUser({
        email,
        password,
        emailVerified: false,
      });

      return {
        firebaseUid: userRecord.uid,
        email: userRecord.email || email,
        emailVerified: userRecord.emailVerified,
      };
    } catch (error) {
      logger.error(error, `Firebase register failed for email: ${email}`);
      throw error;
    }
  }

  async login(email: string, password: string): Promise<AuthUser> {
    try {
      // Firebase Admin SDK does not support signing in with email/password directly (credentials checks).
      // We must call the Google Identity Toolkit REST API with the Web API Key.
      const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${env.FIREBASE_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        const msg = errJson?.error?.message || 'Authentication failed';
        throw new Error(msg);
      }

      const data = (await response.json()) as { idToken: string; localId: string; email: string };
      
      // Verify the returned token to align profiles
      return await this.verifyIdToken(data.idToken);
    } catch (error) {
      logger.error(error, `Firebase login failed for email: ${email}`);
      throw error;
    }
  }

  async verifyIdToken(idToken: string): Promise<AuthUser> {
    try {
      const decodedToken = await this.adminApp.auth().verifyIdToken(idToken);
      return {
        firebaseUid: decodedToken.uid,
        email: decodedToken.email || '',
        emailVerified: decodedToken.email_verified || false,
      };
    } catch (error) {
      logger.error(error, 'Firebase ID token verification failed');
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${env.FIREBASE_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestType: 'PASSWORD_RESET', email }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        const msg = errJson?.error?.message || 'Failed to send password reset email';
        throw new Error(msg);
      }
    } catch (error) {
      logger.error(error, `Firebase sendPasswordResetEmail failed for: ${email}`);
      throw error;
    }
  }
}

// -------------------------------------------------------------
// 2. Mock Authentication Service Strategy (For Sandboxed testing)
// -------------------------------------------------------------
export class MockAuthService implements IAuthService {
  constructor() {
    logger.info('Initializing Sandbox MockAuthService');
  }

  async register(email: string, password: string): Promise<AuthUser> {
    if (password.length < 6) {
      throw new Error('WEAK_PASSWORD : Password should be at least 6 characters');
    }
    const mockUid = `mock-uid-${Buffer.from(email).toString('hex').slice(0, 12)}`;
    return {
      firebaseUid: mockUid,
      email,
      emailVerified: false,
    };
  }

  async login(email: string, password: string): Promise<AuthUser> {
    if (password === 'invalid-password') {
      throw new Error('INVALID_PASSWORD');
    }
    const mockUid = `mock-uid-${Buffer.from(email).toString('hex').slice(0, 12)}`;
    return {
      firebaseUid: mockUid,
      email,
      emailVerified: true,
    };
  }

  async verifyIdToken(idToken: string): Promise<AuthUser> {
    if (idToken.startsWith('invalid-')) {
      throw new Error('INVALID_ID_TOKEN');
    }
    // Parse mock token details (format: "mock-id-token-<email>")
    const parts = idToken.split('mock-id-token-');
    const email = parts[1] || 'mock-user@fifa.com';
    const mockUid = `mock-uid-${Buffer.from(email).toString('hex').slice(0, 12)}`;
    return {
      firebaseUid: mockUid,
      email,
      emailVerified: true,
    };
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    logger.info(`[MOCK AUTH] Password reset link simulated and logged for: ${email}`);
  }
}
