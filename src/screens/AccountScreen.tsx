import { Text, View } from 'react-native';

import { usePawso } from '../context/PawsoContext';
import {
  Page,
  Header,
  Input,
  Label,
  PrimaryButton,
  SecondaryButton,
  styles,
} from '../components/ui';

export function AccountScreen() {
  const {
    setScreen,
    accountEmail,
    accountIsAnonymous,
    accountBusy,
    accountMessage,
    accountError,
    secureAccountEmail,
    setSecureAccountEmail,
    secureAccountPassword,
    setSecureAccountPassword,
    secureAccount,
    signOutAccount,
  } = usePawso();

  return (
    <Page scroll>
      <Header title="Account" onBack={() => setScreen('pets')} />

      <Text style={styles.pageTitle}>
        {accountIsAnonymous ? 'Protect your Pawso account' : 'Your Pawso account'}
      </Text>

      <Text style={styles.pageSubtitle}>
        {accountIsAnonymous
          ? 'Your current Pawso data is tied to a temporary anonymous account. Add an email and password without changing your Pawso user ID or losing your pet records.'
          : 'Your Pawso records are connected to your signed-in account.'}
      </Text>

      <View style={styles.infoCard}>
        <Text style={styles.cardStrong}>
          {accountIsAnonymous ? 'Temporary account' : 'Account secured ✓'}
        </Text>
        <Text style={styles.cardMuted}>
          {accountIsAnonymous
            ? 'Good for development, but not safe for a public beta because clearing app data or changing devices can make an anonymous account inaccessible.'
            : accountEmail || 'Email account'}
        </Text>
      </View>

      {accountIsAnonymous ? (
        <>
          <Label text="Email" />
          <Input
            value={secureAccountEmail}
            onChangeText={setSecureAccountEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            placeholder="you@example.com"
          />

          <Label text="Password" />
          <Input
            value={secureAccountPassword}
            onChangeText={setSecureAccountPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="At least 8 characters"
          />

          <PrimaryButton
            title={accountBusy ? 'Securing account…' : 'Secure my Pawso account'}
            disabled={accountBusy}
            onPress={secureAccount}
          />

          <Text style={styles.reminderFinePrint}>
            Pawso upgrades the existing anonymous Supabase user instead of creating
            a new user. Your existing pet records remain under the same user ID.
            Depending on your Supabase email settings, you may receive a
            verification email.
          </Text>
        </>
      ) : (
        <SecondaryButton
          title={accountBusy ? 'Signing out…' : 'Sign out'}
          onPress={signOutAccount}
        />
      )}

      {accountMessage ? (
        <View style={styles.infoCard}>
          <Text style={styles.cardStrong}>✓ {accountMessage}</Text>
        </View>
      ) : null}

      {accountError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Account update failed</Text>
          <Text style={styles.errorText}>{accountError}</Text>
        </View>
      ) : null}

      <View style={styles.infoCard}>
        <Text style={styles.cardStrong}>Next: shared household care</Text>
        <Text style={styles.cardMuted}>
          Once Pawso has stable identities, the next milestone can safely add
          household invitations, caregiver permissions, and “given by” activity.
        </Text>
      </View>
    </Page>
  );
}
