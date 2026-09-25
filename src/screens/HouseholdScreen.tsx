import { useState } from 'react';
import { Alert, Linking, Share, Text, View } from 'react-native';

import { usePawso } from '../context/PawsoContext';
import { MetricStrip } from '../components/VisualSummary';
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
    householdId,
    householdOptions,
    switchHousehold,
    householdTimeZone,
    updateHouseholdTimeZone,
    updateHouseholdMemberRole,
    householdRole,
    accountIsAnonymous,
    householdMembers,
    householdInvitations,
    householdBusy,
    householdError,
    inviteEmail,
    setInviteEmail,
    inviteRole,
    setInviteRole,
    inviteCode,
    inviteEmailStatus,
    joinCode,
    setJoinCode,
    memberDisplayName,
    setMemberDisplayName,
    createHouseholdInvite,
    acceptHouseholdInvite,
    refreshHousehold,
    removeHouseholdMember,
    cancelHouseholdInvitation,
  } = usePawso();
  const [showJoin, setShowJoin] = useState(Boolean(joinCode));
  const [shareError, setShareError] = useState('');
  const [timeZoneDraft, setTimeZoneDraft] = useState<string | null>(null);
  const isOwner = householdRole === 'owner';
  const canInvite = isOwner && !accountIsAnonymous;
  const joinFormVisible = showJoin || Boolean(joinCode);
  const ownerCount = householdMembers.filter((member) => member.role === 'owner').length;
  const caregiverCount = householdMembers.filter(
    (member) => member.role === 'caregiver'
  ).length;
  const sitterCount = householdMembers.filter((member) => member.role === 'sitter').length;

  const invitationMessage = inviteCode
    ? `You've been invited to join ${householdName || 'a Pawso household'} as a ${inviteRole}.

Open the invitation in Pawso:
pawso://invite/${inviteCode}

If the link does not open, open Pawso → Account → People & access → Join with an invite code, and enter:

${inviteCode}

This one-time code expires after 7 days.`
    : '';

  function confirmRemoveMember(member: any) {
    Alert.alert(
      'Remove access?',
      `${member.display_name || 'This person'} will immediately lose access to this household and its pets. Existing care history will remain.`,
      [
        { text: 'Keep access', style: 'cancel' },
        {
          text: 'Remove access',
          style: 'destructive',
          onPress: () => removeHouseholdMember(member.id),
        },
      ]
    );
  }

  function confirmCancelInvitation(invitation: any) {
    Alert.alert(
      'Cancel invitation?',
      `The invite for ${invitation.invited_email || 'this recipient'} will stop working.`,
      [
        { text: 'Keep invitation', style: 'cancel' },
        {
          text: 'Cancel invitation',
          style: 'destructive',
          onPress: () => cancelHouseholdInvitation(invitation.id),
        },
      ]
    );
  }

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
      <Header title="People & access" back={() => setScreen('account')} />

      <Text style={styles.pageTitle}>{householdName || 'My Pawso Household'}</Text>
      <Text style={styles.pageSubtitle}>
        Give each caregiver their own access—no shared passwords.
      </Text>

      {householdOptions.length > 1 ? (
        <View style={styles.infoCard}>
          <Text style={styles.cardStrong}>Switch household</Text>
          <Text style={styles.cardMuted}>
            Choose which household and pets are active on this device.
          </Text>
          <View style={styles.compactActionRow}>
            {householdOptions.map((option) => (
              <OptionButton
                key={option.household_id}
                title={`${option.name} · ${option.role}`}
                selected={householdId === option.household_id}
                onPress={() => {
                  setTimeZoneDraft(null);
                  switchHousehold(option.household_id);
                }}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.infoCard}>
        <Text style={styles.cardStrong}>Your role · {householdRole || 'member'}</Text>
        <Text style={styles.cardMuted}>
          Owners manage everything. Caregivers manage routine care. Sitters can
          follow and complete assigned care.
        </Text>
        <Text style={styles.reminderFinePrint}>
          Sitters can see pet identity, emergency details, allergies, conditions,
          active medication instructions, and care tasks. They cannot see veterinary
          documents, the medical timeline, AI answers, or change health records.
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.cardStrong}>Reminder time zone</Text>
        <Text style={styles.cardMuted}>
          Medication and care times use this household time zone, including across DST and travel.
        </Text>
        {isOwner ? (
          <>
            <Input
              value={timeZoneDraft ?? householdTimeZone}
              onChangeText={setTimeZoneDraft}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="America/Vancouver"
            />
            <SecondaryButton
              title="Save time zone"
              disabled={householdBusy || !(timeZoneDraft ?? householdTimeZone).trim()}
              onPress={() => {
                updateHouseholdTimeZone((timeZoneDraft ?? householdTimeZone).trim());
                setTimeZoneDraft(null);
              }}
            />
          </>
        ) : (
          <Text style={styles.inviteCodeText}>{householdTimeZone}</Text>
        )}
      </View>

      {householdMembers.length > 0 ? (
        <MetricStrip
          accessibilityLabel={`${householdName} access overview`}
          items={[
            {
              label: 'Owners',
              value: ownerCount,
              icon: '★',
              tone: 'purple',
            },
            {
              label: 'Caregivers',
              value: caregiverCount,
              icon: '♥',
              tone: 'green',
            },
            {
              label: 'Sitters',
              value: sitterCount,
              icon: '⌂',
              tone: 'neutral',
            },
          ]}
        />
      ) : null}

      <View style={styles.infoCard}>
        <Text style={styles.cardStrong}>Joining someone else's household?</Text>
        <Text style={styles.cardMuted}>
          Paste a code here if someone invited you. When an invitation names an
          email address, you must sign in with that same address.
        </Text>
        {accountIsAnonymous ? (
          <PrimaryButton
            title="Secure account to join"
            onPress={() => setScreen('account')}
          />
        ) : (
          <SecondaryButton
            title={joinFormVisible ? 'Hide join form' : 'Join with an invite code'}
            onPress={() => {
              if (joinFormVisible) {
                setShowJoin(false);
                setJoinCode('');
              } else {
                setShowJoin(true);
              }
            }}
          />
        )}
      </View>

      {joinFormVisible && !accountIsAnonymous ? (
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
            {isOwner && member.role !== 'owner' ? (
              <>
                <View style={styles.row}>
                  <OptionButton
                    title="Caregiver"
                    selected={member.role === 'caregiver'}
                    onPress={() => updateHouseholdMemberRole(member.id, 'caregiver')}
                  />
                  <OptionButton
                    title="Sitter"
                    selected={member.role === 'sitter'}
                    onPress={() => updateHouseholdMemberRole(member.id, 'sitter')}
                  />
                </View>
                <SecondaryButton
                  title="Remove access"
                  disabled={householdBusy}
                  onPress={() => confirmRemoveMember(member)}
                />
              </>
            ) : null}
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

      {isOwner && householdInvitations.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Pending invitations</Text>
          {householdInvitations.map((invitation: any) => (
            <View key={invitation.id} style={styles.documentCard}>
              <Text style={styles.cardStrong}>
                {invitation.invited_email || 'Invitation code'}
              </Text>
              <Text style={styles.cardMuted}>
                {invitation.role} · expires {new Date(invitation.expires_at).toLocaleDateString()}
              </Text>
              <SecondaryButton
                title="Cancel invitation"
                disabled={householdBusy}
                onPress={() => confirmCancelInvitation(invitation)}
              />
            </View>
          ))}
        </>
      ) : null}

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
            disabled={householdBusy || !inviteEmail.trim().includes('@')}
            onPress={createHouseholdInvite}
          />

          {inviteCode ? (
            <View style={styles.infoCard}>
              <Text style={styles.cardStrong}>Invitation ready</Text>
              <Text selectable style={styles.inviteCodeText}>{inviteCode}</Text>
              <Text style={styles.cardMuted}>
                It expires after 7 days and can be used once. Pawso attempts
                automatic delivery first; Email and Share remain available as backups.
              </Text>
              {inviteEmailStatus ? (
                <Text style={styles.cardMuted}>{inviteEmailStatus}</Text>
              ) : null}
              <PrimaryButton
                title="Open email app (backup)"
                onPress={emailInvitation}
              />
              <SecondaryButton
                title="Share invitation"
                onPress={shareInvitation}
              />
            </View>
          ) : null}
        </>
      ) : isOwner && accountIsAnonymous ? (
        <View style={styles.infoCard}>
          <Text style={styles.cardStrong}>Secure your account to share care</Text>
          <Text style={styles.cardMuted}>
            Add your email and password before inviting a caregiver or sitter so access can be recovered safely.
          </Text>
          <PrimaryButton title="Secure account" onPress={() => setScreen('account')} />
        </View>
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
