import { NavigationContainer } from '@react-navigation/native';

import { PawsoProvider } from './src/context/PawsoContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import { ErrorBoundary } from './src/components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <NavigationContainer ref={navigationRef}>
        <PawsoProvider>
          <RootNavigator />
        </PawsoProvider>
      </NavigationContainer>
    </ErrorBoundary>
  );
}
