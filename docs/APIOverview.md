# API Overview

The FIFA AI Companion follows a minimal, conversational-first API design. A single conversational gateway endpoint handles most user requests. Supplementary REST endpoints handle authentication, direct dashboard lookups, ticket views, and diagnostic checks.

---

## 1. Global JSON Envelope

All APIs respond with a consistent JSON shape defined in `@fifa/shared-types`:

### 1.1 Success Response Shape
```json
{
  "success": true,
  "data": {
    // Response payload
  }
}
```

### 1.2 Error Response Shape
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Human readable description of the error."
  }
}
```

---

## 2. API Endpoints Reference

### 2.1 Health Check (Implemented in Milestone 0)
*   **Path:** `GET /api/v1/health`
*   **Purpose:** Verifies backend server availability, uptime metrics, environment configurations, and database connectivity.
*   **Response Payload (`data`):**
    ```json
    {
      "status": "OK",
      "uptime": 124.56,
      "environment": "development",
      "database": "CONNECTED" // or "DISCONNECTED"
    }
    ```
*   **HTTP Status Codes:**
    *   `200 OK` - Both server and database connection are verified.
    *   `500 Internal Server Error` - Database is unreachable or configuration checks failed.

### 2.2 Conversational Gateway (Milestone 5)
*   **Path:** `POST /api/v1/chat`
*   **Purpose:** Passes user queries to the Master Agent to drive chats, execute commands, update preferences, and return responses.
*   **Request Body:**
    ```json
    {
      "message": "Book the cheapest Category 2 ticket for France vs Argentina and plan my day",
      "conversationId": "uuid-string-optional-for-existing-threads"
    }
    ```
*   **Response Payload (`data`):**
    ```json
    {
      "response": "I've locked Category 2 Seat A-3 for the final match and set up your day...",
      "agentTrace": ["MasterAgent", "BookingAgent", "TravelAgent"],
      "payload": {
        "ticket": {
          "id": "ticket-uuid",
          "section": "Category 2",
          "row": "A",
          "number": "3"
        },
        "itinerary": {
          "id": "itinerary-uuid",
          "stops": []
        }
      }
    }
    ```

### 2.3 User Authentication (Milestone 1)
*   `POST /api/v1/auth/register`: Creates a new user profile.
*   `POST /api/v1/auth/login`: Authenticates user credentials and returns tokens. Sets an HTTP-only Cookie for security.
*   `POST /api/v1/auth/refresh`: Issues a new short-term access token using rolling refresh tokens.
*   `POST /api/v1/auth/logout`: Revokes active tokens and clears cookies.

### 2.4 User Dashboard (Milestone 9)
*   `GET /api/v1/dashboard`: Fetches aggregated user settings, travel itineraries, tickets, and next-match events for narration by the Master Agent.

### 2.5 Tickets (Milestones 6 & 9)
*   `GET /api/v1/tickets/:id`: Retrieves ticket details.
*   `GET /api/v1/tickets/:id/verify`: Verifies offline ticket QR codes using cryptographic signature gates.
