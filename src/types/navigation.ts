// types/navigation.ts
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  Details: undefined;
  AddDonator: undefined;
};

export type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

// Screen-specific navigation props
export type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;
export type AddDonatorScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AddDonator'
>;
export type DetailsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Details'
>;
