# mouthbeat-machine

A dark/neon music-machine app built with Expo + React Native + TypeScript.

## Tech Stack

- **Expo** ~51 (managed workflow)
- **React Native** 0.74
- **TypeScript** ~5.3 (strict mode)
- **React Navigation** v6 (native stack + bottom tabs)
- **Zustand** v4 (state management)
- **react-native-reanimated** ~3.10 (animations)
- **react-native-gesture-handler** ~2.16 (gestures)
- **@shopify/react-native-skia** ~1.3 (canvas/visualizer)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli` (or use `npx expo`)
- iOS Simulator (Xcode) or Android Emulator (Android Studio)

### Install dependencies

```bash
npm install
```

### Run the app

```bash
# Start Expo dev server
npx expo start

# Open on iOS simulator
npx expo start --ios

# Open on Android emulator
npx expo start --android
```

### Type-check

```bash
npm run ts:check
```

## Project Structure

```
mouthbeat-machine/
├── App.tsx                  # Root component (NavigationContainer + GestureHandler)
├── index.ts                 # Expo entry point
├── app.json                 # Expo config
├── babel.config.js          # Babel config (reanimated plugin)
├── tsconfig.json            # TypeScript config (strict)
├── src/
│   ├── app/
│   │   └── Navigation.tsx   # Root stack + bottom tab navigators
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── RecordScreen.tsx
│   │   ├── AnalyzeScreen.tsx
│   │   ├── TimelineScreen.tsx
│   │   ├── PadsScreen.tsx
│   │   ├── VisualizerScreen.tsx
│   │   ├── KitScreen.tsx
│   │   ├── ExportScreen.tsx
│   │   └── ProjectListScreen.tsx
│   └── theme/
│       ├── colors.ts        # Dark/neon color palette
│       ├── spacing.ts       # 4px-base spacing scale
│       ├── typography.ts    # Font sizes, weights, line heights
│       └── index.ts         # Re-exports
```

## Navigation Structure

```
RootStack
├── Main (headerShown: false)
│   └── MainTabs (bottom tabs)
│       ├── Home
│       ├── Record
│       ├── Analyze
│       ├── Timeline
│       ├── Pads
│       └── Kit
├── Visualizer
├── Export
└── ProjectList
```

## Theme

The app uses a dark/neon music-machine aesthetic:

- **Background**: `#0a0a0f` (near-black)
- **Surface**: `#12121a`
- **Neon Cyan**: `#00f5ff` (primary accent)
- **Neon Pink**: `#ff2d78`
- **Neon Green**: `#39ff14`
- **Neon Yellow**: `#ffe600`
- **Neon Purple**: `#bf5fff`
- **Neon Orange**: `#ff6b00`
