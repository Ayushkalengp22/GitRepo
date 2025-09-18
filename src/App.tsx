import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {View, StyleSheet, Text} from 'react-native';
import {AuthProvider, useAuth} from './context/AuthContext';
import {LoadingState} from './components/HomeComponent/common/LoadingState';
import Home from '../src/screens/Home';
import Login from './screens/Login';
import AddDonator from './screens/AddDonator';
import ViewAll from './screens/Viewall';
import EditDonator from './screens/EditDonator';
import Setting from './screens/SettingScreen';
import Expense from './screens/ExpenseScreen';

// Navigation type definitions
export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  AddDonator: undefined;
  ViewAll: undefined;
  EditDonator: {donatorId: number};
};

export type BottomTabParamList = {
  Home:
    | {dataChanged?: boolean; timestamp?: number; message?: string}
    | undefined;
  Expense: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const BottomTab = createBottomTabNavigator<BottomTabParamList>();

// Bottom Tab Navigator
const BottomTabNavigator = () => {
  return (
    <BottomTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#60A5FA',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIconStyle: styles.tabBarIcon,
      }}>
      <BottomTab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({color, focused}) => (
            <Text
              style={[
                styles.tabIcon,
                {color},
                focused && styles.tabIconFocused,
              ]}>
              🏠
            </Text>
          ),
        }}
      />
      <BottomTab.Screen
        name="Expense"
        component={Expense}
        options={{
          tabBarLabel: 'Expenses',
          tabBarIcon: ({color, focused}) => (
            <Text
              style={[
                styles.tabIcon,
                {color},
                focused && styles.tabIconFocused,
              ]}>
              💸
            </Text>
          ),
        }}
      />
      <BottomTab.Screen
        name="Settings"
        component={Setting}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({color, focused}) => (
            <Text
              style={[
                styles.tabIcon,
                {color},
                focused && styles.tabIconFocused,
              ]}>
              ⚙️
            </Text>
          ),
        }}
      />
    </BottomTab.Navigator>
  );
};

// Main App Navigator Component
const AppNavigator = () => {
  const {isAuthenticated, isLoading} = useAuth();

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingState message="Initializing App..." />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!isAuthenticated ? (
          // Auth Stack - Login Screen
          <Stack.Screen
            name="Login"
            component={Login}
            options={{headerShown: false}}
          />
        ) : (
          // Main App Stack - After Login
          <>
            {/* Bottom Tab Navigator as the main screen */}
            <Stack.Screen
              name="MainTabs"
              component={BottomTabNavigator}
              options={{headerShown: false}}
            />

            {/* Stack screens that should overlay the tabs */}
            <Stack.Screen
              name="AddDonator"
              component={AddDonator}
              options={{
                headerShown: false,
                presentation: 'modal', // Optional: makes it feel more like a modal
              }}
            />
            <Stack.Screen
              name="ViewAll"
              component={ViewAll}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="EditDonator"
              component={EditDonator}
              options={{
                headerShown: false,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Main App Component with Auth Provider
const MyScreen = () => {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  // Tab Bar Styles
  tabBar: {
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.2)',
    height: 100,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  tabBarIcon: {
    marginTop: 4,
  },
  tabIcon: {
    fontSize: 20,
  },
  tabIconFocused: {
    transform: [{scale: 1.1}],
  },

  // Placeholder Screen Styles
  placeholderContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  placeholderContent: {
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 32,
    paddingVertical: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
    maxWidth: 320,
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 12,
    textAlign: 'center',
  },
  placeholderSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  placeholderNote: {
    fontSize: 14,
    color: '#60A5FA',
    fontWeight: '600',
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
});

export default MyScreen;
