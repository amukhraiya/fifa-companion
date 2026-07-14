import { env } from '@fifa/config';
import { IAuthService, FirebaseAuthService, MockAuthService } from '../services/auth.service';
import { EventBus, EventLogger, MemoryService } from '@fifa/ai';
import { prisma } from './db';

let authService: IAuthService;

// Single configuration check to instantiate the requested Strategy.
// No conditional logic is present in subsequent business logic modules.
if (env.AUTH_PROVIDER === 'firebase') {
  authService = new FirebaseAuthService();
} else {
  authService = new MockAuthService();
}

const eventBus = new EventBus();
const eventLogger = new EventLogger(prisma);
eventLogger.register(eventBus);

const memoryService = new MemoryService(prisma);

export { authService, eventBus, memoryService };
