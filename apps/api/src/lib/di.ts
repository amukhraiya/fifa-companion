import { env } from '@fifa/config';
import { IAuthService, FirebaseAuthService, MockAuthService } from '../services/auth.service';

let authService: IAuthService;

// Single configuration check to instantiate the requested Strategy.
// No conditional logic is present in subsequent business logic modules.
if (env.AUTH_PROVIDER === 'firebase') {
  authService = new FirebaseAuthService();
} else {
  authService = new MockAuthService();
}

export { authService };
