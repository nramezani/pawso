import { Text, View } from 'react-native';

import { usePawso } from '../context/PawsoContext';
import {
  Page,
  Header,
  Input,
  Label,
  OptionButton,
  PrimaryButton,
  SecondaryButton,
  styles,
} from '../components/ui';

export function HouseholdScreen() {
  const {
    setScreen,
    householdName,
    householdRole,
    householdMembers,
    householdBusy,
    householdError,
    inviteEmail,
    setInviteEmail,
    inviteRole,
    setInviteRole,
    inviteCode,
    joinCode,
    setJoinCode,
    memberDisplayName,
    setMemberDisplayName,
    createHouseholdInvite,
    acceptHouseholdInvite,
    refreshHousehold,
  } = usePawso();

  const canInvite = householdRole === 'owner';

  return (
    <Page scroll>
      <Header title="Household" onBack={() => setScreen('account')} />

      <Text style={styles.pageTitle}>{householdName || 'My Pawso Household'}</Text>
      <Text style={styles.pageSubtitle}>
        Share pet care without sharing passwords. Each caregiver uses their own
        Pawso account.
      </Text>

      <View style={styles.infoCard}>
        <Text style={styles.cardStrong}>Your role · {householdRole || 'member'}</Text>
        <Text style={styles.cardMuted}>
          Owner manages pet and medical records. Caregiver can manage routine care.
          Sitter can follow assigned care without editing medical records.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Members</Text>
      {householdMembers.map((member: any) => (
        <View key={member.id} style={styles.documentCard}>
          <Text style={styles.cardStrong}>{member.display_name}</Text>
          <Text style={styles.cardMuted}>{member.role}</Text>
        </View>
      ))}

      <SecondaryButton
        title={householdBusy ? 'Refreshing…' : 'Refresh members'}
        onPress={refreshHousehold}
      />

      {canInvite ? (
        <>
          <Text style={styles.sectionTitle}>Invite a caregiver</Text>
          <Label text="Email (optional for now)" />
          <Input
            value={inviteEmail}
            onChangeText={setInviteEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="caregiver@example.com"
          />

          <Label text="Role" />
          <Text style={styles.cardMuted}>
            Caregiver can manage routine care. Sitter can follow and complete assigned care only.
          </Text>
          <View style={styles.optionRow}>
            <OptionButton
              title="Caregiver"
              selected={inviteRole === 'caregiver'}
              onPress={() => setInviteRole('caregiver')}
            />
            <OptionButton
              title="Sitter"
              selected={inviteRole === 'sitter'}
              onPress={() => setInviteRole('sitter')}
            />
          </View>

          <PrimaryButton
            title={householdBusy ? 'Creating invite…' : 'Create invite code'}
            disabled={householdBusy}
            onPress={createHouseholdInvite}
          />

          {inviteCode ? (
            <View style={styles.infoCard}>
              <Text style={styles.cardStrong}>Invite code</Text>
              <Text selectable style={styles.inviteCodeText}>
                {inviteCode}
              </Text>
              <Text style={styles.cardMuted}>
                Share this code privately. It expires after 7 days and can be
                accepted once.
              </Text>
            </View>
          ) : null}
        </>
      ) : null}

      <Text style={styles.sectionTitle}>Join a household</Text>
      <Label text="Your display name" />
      <Input
        value={memberDisplayName}
        onChangeText={setMemberDisplayName}
        placeholder="Nara"
      />

      <Label text="Invite code" />
      <Input
        value={joinCode}
        onChangeText={setJoinCode}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Paste invite code"
      />

      <PrimaryButton
        title={householdBusy ? 'Joining…' : 'Join household'}
        disabled={householdBusy}
        onPress={acceptHouseholdInvite}
      />

      {householdError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Household error</Text>
          <Text style={styles.errorText}>{householdError}</Text>
        </View>
      ) : null}

      <View style={styles.infoCard}>
        <Text style={styles.cardStrong}>Privacy note</Text>
        <Text style={styles.cardMuted}>
          This milestone uses invite codes rather than automated email delivery.
          Do not post an invite code publicly.
        </Text>
      </View>
    </Page>
  );
}
