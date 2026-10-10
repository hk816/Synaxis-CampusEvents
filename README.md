# Synaxis – Campus Event Management Platform

Synaxis is a campus event management platform designed to simplify event discovery, student registration, event management, and participation tracking within universities.

The project aims to provide students and event organizers with a centralized platform for managing campus events, streamlining registration, verifying attendance, and understanding student participation.

## Problem Statement

Campus event organizers often find it difficult to estimate actual student participation before an event. Students may register but fail to attend, making attendance and participation difficult to predict. Event information and communication may also be scattered across different channels, including messaging groups, posters, and emails.

Synaxis aims to address these challenges by providing a centralized platform where students can discover events and organizers can manage registrations and monitor participation.

## Objectives

- Centralize campus event discovery and registration.
- Provide students with a convenient way to explore and participate in campus events.
- Support event creation and management for organizers.
- Improve visibility into student registrations and attendance.
- Explore barcode-based attendance verification.
- Help organizers understand student participation and plan future events more effectively.

## Features

- **Event Discovery:** Browse and explore campus events.
- **Student Registration:** Register for campus events through the platform.
- **Event Management:** Support event creation and management for organizers.
- **Participation Tracking:** Track student registrations and event attendance.
- **Organizer Dashboard:** Provide organizers with an interface for managing events and monitoring participation.
- **Attendance Verification:** Explore barcode-based attendance tracking for event participants.
- **Role-Based Registration:** Provide separate registration flows for students and organizers.

Feature availability depends on the current application implementation and backend configuration.

## User Roles

### Students

Students can register for an account using their Woxsen University email address, provide their student details, and use the platform to discover and register for campus events.

Student registration includes:
- Full name
- Woxsen University email address
- Roll number
- Department
- Year of study
- Phone number
- Password

Student email addresses must end with `@woxsen.edu.in`, and the roll number must follow the format used by the application.

### Organizers

Organizers can register through a separate registration flow by providing their personal and organizational details.

Organizer registration includes:
- Full name
- Email address
- Department
- Organization
- Phone number
- Password

The availability of organizer features depends on the corresponding backend configuration.

## Technology Stack

- **Framework:** React Native
- **Development Platform:** Expo
- **Language:** TypeScript and JavaScript
- **Navigation:** Expo Router
- **Backend and Authentication:** Supabase
- **Database:** PostgreSQL
- **Version Control:** Git and GitHub

## Project Structure

The repository is organized around the Expo application, reusable components, configuration, and supporting resources.

```text
Synaxis-CampusEvents/
├── .claude/
├── .vscode/
├── assets/
│   └── images/
├── scripts/
├── src/
│   ├── app/
│   ├── components/
│   ├── constants/
│   ├── hooks/
│   ├── lib/
│   ├── theme/
│   └── global.css
├── .gitignore
├── AGENTS.md
├── app.json
├── eas.json
├── package.json
├── package-lock.json
├── tsconfig.json
├── LICENSE
└── README.md
```

## Getting Started

### Prerequisites

Before running the project, ensure you have the following:

- [Node.js](https://nodejs.org/) and npm
- [Git](https://git-scm.com/)
- [Expo Go](https://expo.dev/go/) for testing on a compatible mobile device, or an appropriate emulator/development environment
- Access to a Supabase project configured for Synaxis

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/hk816/Synaxis-CampusEvents.git
   ```

2. Navigate to the project directory:

   ```bash
   cd Synaxis-CampusEvents
   ```

3. Install the dependencies:

   ```bash
   npm install
   ```

### Environment Configuration

Synaxis uses environment variables to connect to Supabase.

1. Create a file named `.env` in the root directory of the project, alongside `package.json`.

2. Add the following variables using your own Supabase project details:

   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
   ```

3. Replace the placeholder values with the Supabase project URL and publishable key from your project's API settings.

The application reads these values to initialize the Supabase client.

**Important:** The `.env` file is excluded from Git using `.gitignore`. Do not commit your actual environment file, passwords, service-role keys, or other server-side secrets.

Variables prefixed with `EXPO_PUBLIC_` are available to the client application. Never put private server-side credentials in these variables.

### Run the Application

Start the Expo development server:

```bash
npx expo start
```

After the server starts:

- Scan the displayed QR code with Expo Go on a compatible mobile device.
- Alternatively, use the available terminal options to launch the application in a supported emulator or development environment.

The application requires compatible dependencies, valid environment variables, and a correctly configured backend for features that depend on Supabase.

## Backend Configuration

Synaxis uses Supabase for backend services, including authentication-related operations and database access.

The application invokes the following Supabase Edge Functions during registration and login-related flows:

- `student-register`
- `organizer-register`
- `student-login`
- `organizer-login`

These functions must exist in the connected Supabase project and implement the expected request and response formats.

The backend must also have the required database tables, authentication configuration, access policies, and other supporting resources set up for the application's features.

**Backend setup is separate from installing the frontend dependencies.** The repository's frontend code and environment variables alone do not automatically create the required Supabase database schema or deploy the Edge Functions.

Refer to the Supabase documentation for project configuration and deployment instructions:

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Database](https://supabase.com/docs/guides/database)

## Security Considerations

- Keep the actual `.env` file out of version control.
- Never expose Supabase service-role keys or other privileged credentials in client-side code.
- Configure appropriate database access policies before using real student or organizer data.
- Validate and authorize sensitive operations on the backend rather than relying exclusively on frontend validation.
- Use test accounts and non-sensitive data during development.

## Current Status and Limitations

Synaxis is a campus event management project built with React Native, Expo, and Supabase.

The repository contains the application source code and configuration files. Running the project successfully requires the appropriate local environment and backend configuration.

The availability of registration, login, event management, attendance tracking, and other backend-dependent functionality depends on the corresponding Supabase functions, database schema, access policies, and application implementation.

The repository documentation does not claim that every feature or backend operation has been independently tested.

## Future Scope

Potential areas for further development include:

- Improving event recommendations and discovery.
- Enhancing attendance verification and participation analytics.
- Expanding organizer reporting and event-management capabilities.
- Improving event communication and student engagement.
- Extending the platform based on student and organizer feedback.

## License

See the [LICENSE](https://github.com/hk816/Synaxis-CampusEvents/blob/main/LICENSE) file in this repository for licensing information.
