# Presentation Guide

This guide outlines the optimal flow for demonstrating the FIFA AI Companion during judging or showcase events.

## Setup

1.  Start the application (`pnpm dev`).
2.  Ensure you are logged in (the app should auto-login as `fan@fifa.com` in demo mode).
3.  The global **DemoOverlay** should be visible in the bottom left, signifying that the app is in presentation mode.

## Demonstration Flow

### 1. The Landing Experience (Home)
*   **Focus**: Visual impact, performance, and clear value proposition.
*   **Action**: Scroll through the cinematic landing page. Highlight the glassmorphism design, fluid animations, and feature sections.
*   **Talking Points**: Emphasize the transformation from a hackathon prototype to a polished, production-ready interface.

### 2. Digital Wallet (`/wallet`)
*   **Focus**: Interactive UI and data presentation.
*   **Action**: Navigate to the Digital Wallet. Hover over the ticket cards to show the 3D-like tilt effect.
*   **Talking Points**: Explain how tickets are managed securely and presented dynamically based on match data.

### 3. Fan Statistics (`/profile/statistics`)
*   **Focus**: Gamification and personalized analytics.
*   **Action**: Show the statistics dashboard. Toggle between 'Statistics' and 'Achievements'. Watch the animated counters and progress bars load.
*   **Talking Points**: Highlight the "Fan DNA" concept—how the app tracks user preferences and milestones to personalize the experience.

### 4. Match Memories (`/memories`)
*   **Focus**: Emotional connection and media handling.
*   **Action**: Scroll through the scrapbook masonry layout. Open a memory to view details.
*   **Talking Points**: Discuss how the app stores contextual memories linked to specific matches and moments.

### 5. Live Match Companion (`/match-day`)
*   **Focus**: Real-time telemetry, accessibility, and AI integration.
*   **Action**: 
    *   Show the live scoreboard and simulator controls (Play/Pause).
    *   Demonstrate the interactive stadium map. Toggle layers (Seat, Restrooms, Heatmap, etc.).
    *   Highlight the Fan Pulse and Predictor sections.
    *   Show the Voice Assistant mock input (e.g., type "Where is my seat?").
    *   Change the Accessibility Routing preference and note how the UI adapts.
*   **Talking Points**: This is the core "companion" feature. Emphasize real-time responsiveness and accessibility tools.

### 6. Intelligent AI Chat (`/chat`)
*   **Focus**: Conversational AI, reasoning transparency, and tool integration.
*   **Action**:
    *   Send a prompt like "I want the cheapest Brazil match".
    *   Show the animated thinking timeline.
    *   Wait for the response. Click "Why this recommendation?" to show the explanation.
    *   Click "View Trace" to load the observability panel.
*   **Talking Points**: Explain how the AI Kernel parses intent, uses the Tool Registry, and provides transparent reasoning paths.

### 7. Developer Command Center (`/developer/command-center`)
*   **Focus**: Architecture observability and system health.
*   **Action**: Show the live event bus timeline updating. Point out the Agent and Tool registries.
*   **Talking Points**: Reiterate the SOLID architecture, the Event Bus pattern, and how the system is designed for extensibility and monitoring.

## Conclusion

Summarize the key achievements: a feature-complete, architecturally sound, and visually stunning AI-powered application ready for production.
