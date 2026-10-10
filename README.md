# Synaxis – Campus Event Management Platform

Synaxis is a campus event management platform designed to simplify event discovery, student registration, and participation tracking within universities.

The project aims to provide students and event organizers with a centralized platform for managing campus events and understanding student participation.

## Features

- **Event Discovery:** Browse and explore campus events.
- **Student Registration:** Register for events through the platform.
- **Event Management:** Support event creation and management for organizers.
- **Participation Tracking:** Track student registrations and event attendance.
- **Organizer Dashboard:** Provide organizers with an interface for managing events and monitoring participation.
- **Attendance Verification:** Explore barcode-based attendance tracking for event participants.

## Technology Stack

- React Native
- Expo
- TypeScript
- Supabase
- PostgreSQL



## Getting Started

### Prerequisites

- Node.js and npm
- Expo Go or an appropriate development environment

### Installation

1. Clone the repository.
2. Navigate to the project directory.
3. Install the dependencies.
4. Create a local `.env` file in the project root.
5. Add the following environment variables using your own Supabase project details:
6. Start the Expo development server:

   ```bash
   npx expo start
   ```

7. Follow the Expo instructions to run the application on a compatible device or emulator.

## Backend Configuration

Synaxis uses Supabase for authentication and database operations. The required database tables, access policies, and Edge Functions must be configured in the corresponding Supabase project.

Do not commit your actual `.env` file or any service-role keys.
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key

   ```bash
   npm install
