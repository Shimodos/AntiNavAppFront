# Antinavigator Frontend

Mobile application for Antinavigator - navigation with interesting routes through POIs.

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation
- **State**: Zustand
- **Maps**: react-native-maps
- **HTTP Client**: Axios

## Project Structure

```
Frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── screens/         # Screen components
│   ├── navigation/      # Navigation configuration
│   ├── store/           # Zustand stores
│   ├── api/             # API client and services
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript types
│   └── utils/           # Utility functions
├── assets/              # Images, fonts, etc.
├── app.json             # Expo configuration
├── package.json
└── tsconfig.json
```

## Getting Started

```bash
# Install dependencies
npm install

# Start Expo development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## Backend API

The app connects to the Antinavigator Backend API.
Configure the API URL in the environment settings.

## Key Features

- Interactive map with route visualization
- POI discovery and filtering by categories
- Route generation based on interests
- Real-time navigation
- Offline map caching
