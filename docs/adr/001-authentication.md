# ADR 001: Authentication and Identity Management

## Status
Approved

## Context
The FIFA AI Companion requires a secure, production-grade identity layer supporting both OAuth (Google) and Email/Password credentials. Additionally, to maximize user engagement during the tournament, fans must be allowed to try key features (like AI chat, match browsing, and travel schedules) anonymously without initial registration, while maintaining a seamless path to upgrade to a full account later.

---

## Decision

We chose a hybrid architecture combining **Firebase Authentication** on the client side with custom **JWT + Refresh Token Rotation** managed by our backend Express API.

### 1. Why Firebase Authentication?
*   **Encapsulation of Complexity:** Firebase manages user storage, Google OAuth credential exchanges, secure password storage, forgot-password email flows, and verification codes out-of-the-box.
*   **Client SDK Security:** Offloads client OAuth credentials handling, reducing risk of exposing secrets.
*   **Migration Stability:** Firebase represents a industry-standard gateway that can be swapped or extended without altering database relationships (which hook into `User.firebaseUid`).

### 2. Why Custom JWT + Refresh Token Rotation?
Instead of passing Firebase tokens directly to every downstream service, the backend acts as a security gate, verifying Firebase credentials on login/register and issuing its own custom JWTs:
*   **Decoupled Authentication:** The custom backend tokens decouple our internal microservices and database relations from Firebase SDK constraints.
*   **Security Control:** By issuing a short-lived Access Token (20 minutes) and a long-lived Refresh Token (30 days) stored in a secure cookie, we limit the impact of compromised tokens.
*   **Secure Rotation:** Whenever a token is refreshed, the backend rotates the refresh token. If a token is reused (indicating a potential breach), the backend revokes all tokens descended from that family.
*   **Database Cryptography:** Refresh tokens are hashed using SHA-256 before being saved to the database. A database leak will not compromise active sessions.

### 3. Why Guest Mode?
*   **Frictionless Onboarding:** Fans can immediately test the application, build their Fan DNA profile, and plan trips without signing up.
*   **Upgradability:** Guest user profiles are persisted as standard database `User` entities with a `role: 'Guest'` setting. When guests sign up or log in via Google later, their existing preferences, conversations, and plans are dynamically linked to their new full account, and the temporary guest row is cleaned up.

### 4. Security Measures Implemented
*   **HTTP-Only Cookies:** Refresh tokens are delivered via `httpOnly`, `secure`, `sameSite: 'strict'` cookies to prevent XSS theft.
*   **Role-Based Access Control (RBAC):** Middlewares enforce permissions (`Guest`, `Fan`, `Volunteer`, `Organizer`, `Admin`). Guests are blocked from seat reservation, ticket booking, and payments.
*   **Auditing:** Audit logs record all identity events (Logins, Registration, Refreshes, Guest logins, Guest upgrades, Failures).

---

## Trade-offs and Alternatives Considered

### Alternative A: Firebase Token Verification on every request
*   *Pros:* Zero backend token database maintenance.
*   *Cons:* Couples every route execution to Firebase Admin verification calls. Limits custom metadata addition (like RBAC roles) unless custom claims are pushed to Firebase, adding round-trip delays.

### Alternative B: Complete Custom Backend Password Authentication (e.g. Passport/Bcrypt)
*   *Pros:* Total database independence.
*   *Cons:* Requires manual management of OAuth integration, email sending services, verification codes, and security updates for password reset forms. This would increase development time and security maintenance overhead.
