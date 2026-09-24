import { useState } from 'react';
import { Linking, Share, Text, View } from 'react-native';

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
  const [shareError, setShareError] = useState('');
  const canInvite = householdRole === 'owner';

  const invitationMessage = inviteCode
    ? `You've been invited to join ${householdName || 'a Pawso household'} as a ${inviteRole}. Open Pawso, go to Account → Household & shared care → Join with an invite code, and enter:

${inviteCode}

This one-time code expires after 7 days.`
    : '';

  async function shareInvitation() {
    if (!invitationMessage) return;
    try {
      setShareError('');
      await Share.share({
        title: 'Your Pawso invitation',
        message: invitationMessage,
      });
    } catch (error) {
      setShareError(
        error instanceof Error ? error.message : 'Could not share the invitation.'
      );
    }
  }

  async function emailInvitation() {
    if (!inviteCode) return;
    try {
      setShareError('');
      const subject = encodeURIComponent(
        `Join ${householdName || 'my household'} on Pawso`
      );
      const body = encodeURIComponent(invitationMessage);
      const recipient = inviteEmail.trim();
      const url = `mailto:${recipient}?subject=${subject}&body=${body}`;
      await Linking.openURL(url);
    } catch {
      setShareError(
        'Could not open an email app. Use Share invitation instead.'
      );
    }
  }

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

      <View style={styles.infoCard}>
        <Text style={styles.cardStrong}>Joining someone else's household?</Text>
        <Text style={styles.cardMuted}>
          Anyone can join with a valid invite code, even if Pawso already shows
          them as the owner of an empty personal household.
        </Text>
        <SecondaryButton
          title={showJoin ? 'Hide join form' : 'Join with an invite code'}
          onPress={() => setShowJoin((value) => !value)}
        />
      </View>

      {showJoin ? (
        <>
          <Text style={styles.sectionTitle}>Join another household</Text>
          <Label text="Your display name" />
          <Input
            value={memberDisplayName}
            onChangeText={setMemberDisplayName}
            placeholder="Omid"
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
          <Label text="Recipient email" />
          <Input
            value={inviteEmail}
            onChangeText={setInviteEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
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
            title={householdBusy ? 'Creating invite…' : 'Create invitation'}
            disabled={householdBusy || !inviteEmail.trim()}
            onPress={createHouseholdInvite}
          />

          {inviteCode ? (
            <View style={styles.infoCard}>
              <Text style={styles.cardStrong}>Invitation ready</Text>
              <Text selectable style={styles.inviteCodeText}>{inviteCode}</Text>
              <Text style={styles.cardMuted}>
                It expires after 7 days and can be used once. Email it directly
                or use your phone's share menu.
              </Text>
              <PrimaryButton
                title="Email invitation"
                onPress={emailInvitation}
              />
              <SecondaryButton
                title="Share invitation"
                onPress={shareInvitation}
              />
            </View>
          ) : null}
        </>
      ) : null}

      {shareError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Invitation sharing failed</Text>
          <Text style={styles.errorText}>{shareError}</Text>
        </View>
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
