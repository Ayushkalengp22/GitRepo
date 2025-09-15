import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {ActivityIndicator, View, StyleSheet} from 'react-native';
import {AuthProvider, useAuth} from './context/AuthContext';
import Details from './screens/Details';
import Home from '../src/screens/Home';
import Login from './screens/Login';
import AddDonator from './screens/AddDonator';
import ViewAll from './screens/Viewall';
import EditDonator from './screens/EditDonator';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Details: undefined;
  AddDonator: undefined;
  ViewAll: undefined;
  EditDonator: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Main App Navigator Component
const AppNavigator = () => {
  const {isAuthenticated, isLoading} = useAuth();

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#60A5FA" />
      </View>
    );
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
            <Stack.Screen
              name="Home"
              component={Home}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="Details"
              component={Details}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="AddDonator"
              component={AddDonator}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="ViewAll"
              component={ViewAll}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="EditDonator"
              component={EditDonator}
              options={{headerShown: false}}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
});

export default MyScreen;
