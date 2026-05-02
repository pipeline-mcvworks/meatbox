import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '../theme';

import HomeScreen from '../screens/HomeScreen';
import RecordScreen from '../screens/RecordScreen';
import AnalyzeScreen from '../screens/AnalyzeScreen';
import TimelineScreen from '../screens/TimelineScreen';
import PadsScreen from '../screens/PadsScreen';
import VisualizerScreen from '../screens/VisualizerScreen';
import KitScreen from '../screens/KitScreen';
import ExportScreen from '../screens/ExportScreen';
import ProjectListScreen from '../screens/ProjectListScreen';

// ─── Param lists ────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Main: undefined;
  Visualizer: undefined;
  Export: undefined;
  ProjectList: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Record: undefined;
  Analyze: undefined;
  Timeline: undefined;
  Pads: undefined;
  Kit: undefined;
};

// ─── Navigators ─────────────────────────────────────────────────────────────

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontSize: typography.sizes.md,
          fontWeight: typography.weights.semibold,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: spacing[1],
        },
        tabBarActiveTintColor: colors.neonCyan,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: typography.sizes.xs,
        },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Record" component={RecordScreen} />
      <Tab.Screen name="Analyze" component={AnalyzeScreen} />
      <Tab.Screen name="Timeline" component={TimelineScreen} />
      <Tab.Screen name="Pads" component={PadsScreen} />
      <Tab.Screen name="Kit" component={KitScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontSize: typography.sizes.md,
          fontWeight: typography.weights.semibold,
        },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Visualizer" component={VisualizerScreen} />
      <Stack.Screen name="Export" component={ExportScreen} />
      <Stack.Screen name="ProjectList" component={ProjectListScreen} />
    </Stack.Navigator>
  );
}
