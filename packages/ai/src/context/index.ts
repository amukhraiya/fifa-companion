import { ISessionContext } from '../interfaces';

export class SessionContext implements ISessionContext {
  currentUser: { id: string; email: string; role: string } | null = null;
  currentMatch: string | null = null;
  currentStadium: string | null = null;
  language: string = 'en';
  timezone: string = 'UTC';
  conversationState: Record<string, unknown> = {};
  authenticationState: boolean = false;
  fanMemory: Record<string, unknown> | null = null; // Snapshot of FanMemory, avoids repeating DB reads
  conversationId: string = '';
  executionId: string = '';
  promptVersion: string = 'v1';

  constructor(init?: Partial<ISessionContext>) {
    if (init) {
      Object.assign(this, init);
    }
  }
}
