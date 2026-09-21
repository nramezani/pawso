import { useState } from 'react';
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
  const [showJoin, setShowJoin] = useState(false);
  const canInvite = householdRole === 'owner';

  return (
    <Page scroll keyboard>
      <Header title="Household" back={() => setScreen('account')} />

      <Text style={styles.pageTitle}>{householdName || 'My Pawso Household'}</Text>
      <Text style={styles.pageSubtitle}>
        Give each caregiver their own access—no shared passwords.
      </Text>

      <View style={styles.infoCard}>
        <Text style={styles.cardStrong}>Your role · {householdRole || 'member'}</Text>
        <Text style={styles.cardMuted}>
          Owners manage everything. Caregivers manage routine care. Sitters can
          follow and complete assigned care.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>People with access</Text>
      {householdMembers.length ? (
        householdMembers.map((member: any) => (
          <View key={member.id} style={styles.documentCard}>
            <Text style={styles.cardStrong}>{member.display_name || 'Pawso member'}</Text>
            <Text style={styles.cardMuted}>{member.role}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.cardMuted}>No household members found yet.</Text>
      )}

      <SecondaryButton
        title={householdBusy ? 'Refreshing…' : 'Refresh members'}
        disabled={householdBusy}
        onPress={refreshHousehold}
      />

      {canInvite ? (
        <>
          <Text style={styles.sectionTitle}>Invite someone</Text>
          <Label text="Email (optional)" />
          <Input
            value={inviteEmail}
            onChangeText={setInviteEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="caregiver@example.com"
          />

          <Label text="Access level" />
          <View style={styles.row}>
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
          <Text style={styles.cardMuted}>
            Choose caregiver for regular help or sitter for temporary task access.
          </Text>

          <PrimaryButton
            title={householdBusy ? 'Creating invite…' : 'Create invite code'}
            disabled={householdBusy}
            onPress={createHouseholdInvite}
          />

          {inviteCode ? (
            <View style={styles.infoCard}>
              <Text style={styles.cardStrong}>Share this invite code privately</Text>
              <Text selectable style={styles.inviteCodeText}>{inviteCode}</Text>
              <Text style={styles.cardMuted}>It expires after 7 days and can be used once.</Text>
            </View>
          ) : null}
        </>
      ) : null}

      <SecondaryButton
        title={showJoin ? 'Hide join form' : 'Have an invite code?'}
        onPress={() => setShowJoin((value) => !value)}
      />

      {showJoin ? (
        <>
          <Text style={styles.sectionTitle}>Join another household</Text>
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
            disabled={householdBusy || !joinCode.trim()}
            onPress={acceptHouseholdInvite}
          />
        </>
      ) : null}

      {householdError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Household error</Text>
          <Text style={styles.errorText}>{householdError}</Text>
        </View>
      ) : null}
    </Page>
  );
}
