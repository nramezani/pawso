import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Pawso screen error:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.logo}>Pawso</Text>
          <Text style={styles.title}>This screen could not open.</Text>
          <Text style={styles.message}>
            Your saved records are unchanged. Try opening the screen again. If the
            problem continues, restart Pawso.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Try opening Pawso again"
            style={styles.button}
            onPress={() => this.setState({ error: null })}
          >
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F8F6F1',
  },
  card: {
    borderRadius: 20,
    padding: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E9E7',
  },
  logo: {
    color: '#53166F',
    fontSize: 18,
    fontWeight: '900',
  },
  title: {
    marginTop: 16,
    color: '#1F2A27',
    fontSize: 24,
    fontWeight: '800',
  },
  message: {
    marginTop: 10,
    color: '#56645F',
    fontSize: 16,
    lineHeight: 24,
  },
  button: {
    minHeight: 52,
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#53166F',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
