import { NavigationContainer } from '@react-navigation/native';

import { PawsoProvider } from './src/context/PawsoContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/navigationRef';

export default function App() {
  return (
    <NavigationContainer ref={navigationRef}>
      <PawsoProvider>
        <RootNavigator />
      </PawsoProvider>
    </NavigationContainer>
  );
}
