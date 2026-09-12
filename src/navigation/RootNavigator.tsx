import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import { WelcomeScreen } from '../screens/WelcomeScreen';
import { AddPetScreen } from '../screens/AddPetScreen';
import { TodayScreen } from '../screens/TodayScreen';
import { PetProfileScreen } from '../screens/PetProfileScreen';
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
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#2F6F63',
        tabBarInactiveTintColor: '#89928F',
        tabBarStyle: {
          height: 66,
          paddingTop: 6,
          paddingBottom: 8,
          borderTopColor: '#E4E8E6',
          backgroundColor: '#FFFFFF',
        },
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
      <Tab.Screen name="Pets" component={PetProfileScreen} />
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
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Processing" component={ProcessingScreen} />
      <Stack.Screen name="Review" component={ReviewScreen} />
      <Stack.Screen name="Timeline" component={TimelineScreen} />
      <Stack.Screen name="Documents" component={DocumentsScreen} />
      <Stack.Screen name="Medications" component={MedicationsScreen} />
      <Stack.Screen name="AddMedication" component={AddMedicationScreen} />
      <Stack.Screen name="AddCareTask" component={AddCareTaskScreen} />
    </Stack.Navigator>
  );
}
