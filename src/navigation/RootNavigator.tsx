import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, Text } from 'react-native';
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
import { SmartCarePlanScreen } from '../screens/SmartCarePlanScreen';
import type {
  MainTabParamList,
  RootStackParamList,
} from './navigationRef';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const tabIcons: Record<keyof MainTabParamList, string> = {
  Today: '🏠',
  Pets: '🐾',
  Add: '＋',
  Ask: '✨',
  Care: '✓',
};

function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 8);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#2F6F63',
        tabBarInactiveTintColor: '#89928F',
        tabBarStyle: {
          height: 58 + bottomInset,
          paddingTop: 6,
          paddingBottom: bottomInset,
          borderTopColor: '#E4E8E6',
          backgroundColor: '#FFFFFF',
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarIcon: ({ color }) => (
          <Text style={{ color, fontSize: route.name === 'Add' ? 24 : 18 }}>
            {tabIcons[route.name]}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="Pets" component={PetsScreen} />
      <Tab.Screen name="Add" component={AddMenuScreen} />
      <Tab.Screen name="Ask" component={AskScreen} />
      <Tab.Screen name="Care" component={CareScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#F8F6F1' },
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
      <Stack.Screen name="SmartCarePlan" component={SmartCarePlanScreen} />
    </Stack.Navigator>
  );
}
