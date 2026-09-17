import {
  createNavigationContainerRef,
  type NavigatorScreenParams,
} from '@react-navigation/native';

import type { Screen } from '../types';

export type MainTabParamList = {
  Today: undefined;
  Pets: undefined;
  Add: undefined;
  Ask: undefined;
  Care: undefined;
};

export type RootStackParamList = {
  Welcome: undefined;
  AddPet: undefined;
  PetProfile: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Processing: undefined;
  Review: undefined;
  Timeline: undefined;
  Documents: undefined;
  Medications: undefined;
  AddMedication: undefined;
  AddCareTask: undefined;
  Account: undefined;
  Household: undefined;
  VetVisitPrep: undefined;
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

function navigateWhenReady(
  name: keyof RootStackParamList,
  params?: RootStackParamList[keyof RootStackParamList],
  attempt = 0
) {
  if (navigationRef.isReady()) {
    (navigationRef.navigate as any)(name, params);
    return;
  }

  if (attempt < 20) {
    setTimeout(() => navigateWhenReady(name, params, attempt + 1), 50);
  }
}

export function navigateToScreen(screen: Screen) {
  switch (screen) {
    case 'welcome':
      navigateWhenReady('Welcome');
      return;
    case 'addPet':
      navigateWhenReady('AddPet');
      return;
    case 'pets':
      navigateWhenReady('MainTabs', { screen: 'Pets' });
      return;
    case 'today':
      navigateWhenReady('MainTabs', { screen: 'Today' });
      return;
    case 'petProfile':
      navigateWhenReady('PetProfile');
      return;
    case 'ask':
      navigateWhenReady('MainTabs', { screen: 'Ask' });
      return;
    case 'care':
      navigateWhenReady('MainTabs', { screen: 'Care' });
      return;
    case 'processing':
      navigateWhenReady('Processing');
      return;
    case 'review':
      navigateWhenReady('Review');
      return;
    case 'timeline':
      navigateWhenReady('Timeline');
      return;
    case 'documents':
      navigateWhenReady('Documents');
      return;
    case 'medications':
      navigateWhenReady('Medications');
      return;
    case 'addMedication':
      navigateWhenReady('AddMedication');
      return;
    case 'addCareTask':
      navigateWhenReady('AddCareTask');
      return;
    case 'account':
      navigateWhenReady('Account');
      return;
    case 'household':
      navigateWhenReady('Household');
      return;
    case 'vetVisitPrep':
      navigateWhenReady('VetVisitPrep');
      return;
  }
}
