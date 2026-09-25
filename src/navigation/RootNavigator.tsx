import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WelcomeScreen } from '../screens/WelcomeScreen';
import { AddPetScreen } from '../screens/AddPetScreen';
import { TodayScreen } from '../screens/TodayScreen';
import { PetProfileScreen } from '../screens/PetProfileScreen';
import { PetsScreen } from '../screens/PetsScreen';
import { AskScreen } from '../screens/AskScreen';
import { CareScreen } from '../screens/CareScreen';
import { ProcessingScreen } from '../screens/ProcessingScreen';
import { ReviewScreen } from '../screens/ReviewScreen';
import { AddCareTaskScreen } from '../screens/AddCareTaskScreen';
import { MedicationsScreen } from '../screens/MedicationsScreen';
import { AddMedicationScreen } from '../screens/AddMedicationScreen';
import { DocumentsScreen } from '../screens/DocumentsScreen';
import { TimelineScreen } from '../screens/TimelineScreen';
import { AddMenuScreen } from '../screens/AddMenuScreen';
import { AccountScreen } from '../screens/AccountScreen';
import { HouseholdScreen } from '../screens/HouseholdScreen';
import { VetVisitPrepScreen } from '../screens/VetVisitPrepScreen';
import { HealthCheckInScreen } from '../screens/HealthCheckInScreen';
import { HealthTrendsScreen } from '../screens/HealthTrendsScreen';
import { EmergencyCardScreen } from '../screens/EmergencyCardScreen';
import { SmartCarePlanScreen } from '../screens/SmartCarePlanScreen';
import type {
  MainTabParamList,
  RootStackParamList,
} from './navigationRef';
import { usePawso } from '../context/PawsoContext';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Vector icons (via @expo/vector-icons) instead of raw emoji: emoji glyphs
// render inconsistently across iOS/Android/OS versions and ignore the
// tabBarActiveTintColor tint (most emoji fonts render fixed multicolor
// glyphs, not tintable outlines), so the active/inactive tab color only
// ever visibly applied to the label text underneath, not the icon itself.
const tabIcons: Record<
  keyof MainTabParamList,
  { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap }
> = {
  Today: { focused: 'home', unfocused: 'home-outline' },
  Pets: { focused: 'paw', unfocused: 'paw-outline' },
  Add: { focused: 'add-circle', unfocused: 'add-circle-outline' },
  Ask: { focused: 'sparkles', unfocused: 'sparkles-outline' },
  Care: { focused: 'checkmark-circle', unfocused: 'checkmark-circle-outline' },
};

function MainTabs() {
  const insets = useSafeAreaInsets();
  const { resolvedAppearance, canViewMedical } = usePawso();
  const dark = resolvedAppearance === 'dark';
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 8);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: dark ? '#D7A5EF' : '#53166F',
        tabBarInactiveTintColor: dark ? '#BAC5C0' : '#59645F',
        tabBarStyle: {
          height: 58 + bottomInset,
          paddingTop: 6,
          paddingBottom: bottomInset,
          borderTopColor: dark ? '#39433F' : '#E4E8E6',
          backgroundColor: dark ? '#1B211E' : '#FFFFFF',
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarIcon: ({ color, focused }) => (
          <Ionicons
            name={focused ? tabIcons[route.name].focused : tabIcons[route.name].unfocused}
            size={route.name === 'Add' ? 30 : 22}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="Pets" component={PetsScreen} />
      <Tab.Screen name="Add" component={AddMenuScreen} />
      {canViewMedical ? <Tab.Screen name="Ask" component={AskScreen} /> : null}
      <Tab.Screen name="Care" component={CareScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { resolvedAppearance } = usePawso();
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: resolvedAppearance === 'dark' ? '#111512' : '#F8F6F1',
        },
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="AddPet" component={AddPetScreen} />
      <Stack.Screen name="PetProfile" component={PetProfileScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Processing" component={ProcessingScreen} />
      <Stack.Screen name="Review" component={ReviewScreen} />
      <Stack.Screen name="Timeline" component={TimelineScreen} />
      <Stack.Screen name="Documents" component={DocumentsScreen} />
      <Stack.Screen name="Medications" component={MedicationsScreen} />
      <Stack.Screen name="AddMedication" component={AddMedicationScreen} />
      <Stack.Screen name="AddCareTask" component={AddCareTaskScreen} />
      <Stack.Screen name="Account" component={AccountScreen} />
      <Stack.Screen name="Household" component={HouseholdScreen} />
      <Stack.Screen name="VetVisitPrep" component={VetVisitPrepScreen} />
      <Stack.Screen name="HealthCheckIn" component={HealthCheckInScreen} />
      <Stack.Screen name="HealthTrends" component={HealthTrendsScreen} />
      <Stack.Screen name="EmergencyCard" component={EmergencyCardScreen} />
      <Stack.Screen name="SmartCarePlan" component={SmartCarePlanScreen} />
    </Stack.Navigator>
  );
}
