# FIFA AI Companion (Release Candidate)

Welcome to the **FIFA AI Companion**, an intelligent operating system for matchday, booking, travel, and statistics for the FIFA World Cup 2026. This project is a comprehensive showcase built for the Google AI Hackathon.

## Features

*   **Cinematic Landing Experience**: A visually stunning introduction to the platform using glassmorphism, fluid animations, and a cohesive design system.
*   **Digital Wallet & Ticketing**: Manage and view match tickets with interactive, responsive 3D-like cards.
*   **Match Memories Scrapbook**: Relive past matches with a beautiful, masonry-style photo gallery and contextual match data.
*   **Fan Statistics Dashboard**: Track your World Cup journey, from matches attended and distance traveled to carbon footprint savings and prediction accuracy.
*   **Live Matchday Telemetry**: A real-time companion for matches, featuring live stats, interactive stadium maps with heatmaps, fan pulse metrics, and accessibility routing.
*   **Intelligent AI Chat**: An interactive agent interface that provides contextual recommendations, analyzes Fan DNA, and uses reasoning execution traces for transparency.
*   **AI Command Center**: A developer-focused observability dashboard for monitoring the AI kernel, event bus, discovered agents, and active tools in real-time.

## Technology Stack

*   **Framework**: Next.js 15 (App Router)
*   **Styling**: Tailwind CSS & Vanilla CSS (Glassmorphism design system)
*   **Icons**: Lucide React
*   **Architecture**: Monorepo structure, SOLID principles, Dependency Injection, Strategy & Registry Patterns, Event-Driven AI Kernel

## Getting Started

1.  Ensure you have Node.js and `pnpm` installed.
2.  Install dependencies:
    ```bash
    pnpm install
    ```
3.  Start the development server:
    ```bash
    pnpm dev
    ```
4.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## Documentation

*   [Architecture Guide](./ARCHITECTURE.md) - Details on the SOLID architecture, dependency injection, and core patterns.
*   [AI Implementation](./AI.md) - Overview of the AI Kernel, Event Bus, and Agent behaviors.
*   [Presentation Guide](./PRESENTATION_GUIDE.md) - Script and flow for demonstrating the application.

## License

This project is built for demonstration purposes as part of the Google AI Hackathon.
