import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        <Text style={styles.logo}>Pawso</Text>

        <Text style={styles.title}>
          Smarter care for the pets you love.
        </Text>

        <Text style={styles.subtitle}>
          Keep health records, medications, reminders, and everyday care in one
          place.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F1',
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  logo: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 32,
    color: '#2F6F63',
  },

  title: {
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '700',
    color: '#1F2A27',
    marginBottom: 18,
  },

  subtitle: {
    fontSize: 18,
    lineHeight: 27,
    color: '#66736F',
  },
});