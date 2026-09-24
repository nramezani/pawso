import { Alert, Linking, Text, View } from 'react-native';

import { usePawso } from '../context/PawsoContext';
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '../config';
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
  function confirmDeleteAccount(onConfirm: () => void) {
    Alert.alert(
      'Delete Pawso account?',
      'This permanently deletes your account and access to Pawso data. This cannot be undone.',
      [
        { text: 'Keep account', style: 'cancel' },
        { text: 'Delete permanently', style: 'destructive', onPress: onConfirm },
      ]
    );
  }

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
    accountAuthMode,
    setAccountAuthMode,
    signInEmail,
    setSignInEmail,
    signInPassword,
    setSignInPassword,
    signInAccount,
    requestPasswordReset,
    accountRecoveryMode,
    recoveryPassword,
    setRecoveryPassword,
    completePasswordRecovery,
    secureAccount,
    deleteAccount,
    signOutAccount,
  } = usePawso();

  return (
    <Page scroll>
      <Header title="Account" back={() => setScreen('pets')} />

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

      {accountRecoveryMode ? (
        <>
          <Label text="New password" />
          <Input
            value={recoveryPassword}
            onChangeText={setRecoveryPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="At least 8 characters"
          />
          <Text style={styles.reminderFinePrint}>
            {recoveryPassword.length === 0
              ? 'Use at least 8 characters.'
              : recoveryPassword.length < 8
              ? `${8 - recoveryPassword.length} more character${8 - recoveryPassword.length === 1 ? '' : 's'} needed.`
              : '✓ Password length is ready.'}
          </Text>
          <PrimaryButton
            title={accountBusy ? 'Updating password…' : 'Update password'}
            disabled={accountBusy || recoveryPassword.length < 8}
            onPress={completePasswordRecovery}
          />
        </>
      ) : accountIsAnonymous && accountAuthMode === 'signin' ? (
        <>
          <Label text="Email" />
          <Input
            value={signInEmail}
            onChangeText={setSignInEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            placeholder="you@example.com"
          />

          <Label text="Password" />
          <Input
            value={signInPassword}
            onChangeText={setSignInPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Your Pawso password"
          />

          <PrimaryButton
            title={accountBusy ? 'Signing in…' : 'Sign in'}
            disabled={accountBusy}
            onPress={signInAccount}
          />
          <SecondaryButton
            title={accountBusy ? 'Sending…' : 'Forgot password'}
            disabled={accountBusy}
            onPress={requestPasswordReset}
          />
          <SecondaryButton
            title="Create a new Pawso account"
            disabled={accountBusy}
            onPress={() => {
              setAccountAuthMode('secure');
              setSecureAccountEmail(signInEmail);
            }}
          />
        </>
      ) : accountIsAnonymous ? (
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
          <SecondaryButton
            title="I already have a Pawso account"
            disabled={accountBusy}
            onPress={() => {
              setAccountAuthMode('signin');
              setSignInEmail(secureAccountEmail);
            }}
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

      {!accountIsAnonymous ? (
        <PrimaryButton
          title="People & access"
          onPress={() => setScreen('household')}
        />
      ) : (
        <View style={styles.infoCard}>
          <Text style={styles.cardStrong}>Secure your account first</Text>
          <Text style={styles.cardMuted}>
            Household invitations require a persistent Pawso identity.
          </Text>
        </View>
      )}

      {PRIVACY_POLICY_URL || TERMS_OF_USE_URL ? (
        <>
          <Text style={styles.sectionTitle}>Legal & privacy</Text>
          {PRIVACY_POLICY_URL ? (
            <SecondaryButton
              title="Privacy Policy"
              onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
            />
          ) : null}
          {TERMS_OF_USE_URL ? (
            <SecondaryButton
              title="Terms of Use"
              onPress={() => Linking.openURL(TERMS_OF_USE_URL)}
            />
          ) : null}
        </>
      ) : null}

      {!accountIsAnonymous ? (
        <>
          <Text style={styles.sectionTitle}>Account data</Text>
          <Text style={styles.cardMuted}>
            Account deletion is permanent. Export any records you need first.
          </Text>
          <SecondaryButton
            title={accountBusy ? 'Deleting account…' : 'Delete my account'}
            disabled={accountBusy}
            onPress={() => confirmDeleteAccount(deleteAccount)}
          />
        </>
      ) : null}
    </Page>
  );
}
