import { useEffect, useState } from 'react';
import { Image, Share, Text, View } from 'react-native';

import {
  Card,
  Header,
  Info,
  Page,
  PrimaryButton,
  SecondaryButton,
  styles,
} from '../components/ui';
import { usePawso } from '../context/PawsoContext';
import { supabase } from '../../lib/supabase';
import { API_BASE_URL } from '../config';

export function EmergencyCardScreen() {
  const {
    setScreen,
    currentPetId,
    petName,
    petType,
    breed,
    petDateOfBirth,
    petAge,
    petSex,
    weight,
    microchip,
    conditions,
    allergies,
    medications,
    vetClinic,
    emergencyNotes,
    emergencyContactName,
    emergencyContactPhone,
    petPhotoUrl,
    medicationList,
    householdTimeZone,
    dataRightsBusy,
    dataRightsError,
    shareCurrentEmergencyCard,
    startEditPet,
  } = usePawso();
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: householdTimeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .formatToParts(new Date())
    .reduce<Record<string, string>>((parts, item) => {
      if (item.type !== 'literal') parts[item.type] = item.value;
      return parts;
    }, {});
  const todayValue = `${today.year}-${today.month}-${today.day}`;
  const currentMedications = medicationList
    .filter(
      (item) =>
        item.is_active &&
        !item.paused_at &&
        (!item.start_date || item.start_date <= todayValue) &&
        (!item.end_date || item.end_date >= todayValue)
    )
    .map((item) => [item.name, item.dose, item.unit].filter(Boolean).join(' '))
    .join(', ');
  const [emergencyToken, setEmergencyToken] = useState('');
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkMessage, setLinkMessage] = useState('');
  const emergencyUrl = emergencyToken ? `${API_BASE_URL}/api/v1/emergency/${emergencyToken}` : '';

  useEffect(() => {
    if (!currentPetId) return;
    supabase.from('emergency_share_links').select('token').eq('pet_id', currentPetId)
      .is('revoked_at', null).order('created_at', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setEmergencyToken(data?.token ?? ''));
  }, [currentPetId]);

  async function createEmergencyLink() {
    if (!currentPetId) return;
    setLinkBusy(true);
    setLinkMessage('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLinkMessage('Sign in again to create a link.');
      setLinkBusy(false);
      return;
    }
    const { data, error } = await supabase.from('emergency_share_links')
      .insert({ pet_id: currentPetId, created_by: user.id }).select('token').single();
    if (error) setLinkMessage(error.message);
    else setEmergencyToken(data.token);
    setLinkBusy(false);
  }

  async function revokeEmergencyLink() {
    if (!emergencyToken) return;
    setLinkBusy(true);
    const { error } = await supabase.from('emergency_share_links')
      .update({ revoked_at: new Date().toISOString() }).eq('token', emergencyToken);
    setLinkMessage(error ? error.message : 'Emergency link revoked.');
    if (!error) setEmergencyToken('');
    setLinkBusy(false);
  }

  return (
    <Page scroll>
      <Header title="Emergency card" back={() => setScreen('petProfile')} />
      <Text style={styles.pageTitle}>Ready-to-share pet handoff</Text>
      <Text style={styles.pageSubtitle}>
        Review this summary before sharing it with a sitter, caregiver, or veterinary team.
      </Text>

      <View style={styles.profileHeader}>
        {petPhotoUrl ? (
          <Image source={{ uri: petPhotoUrl }} style={styles.profilePhotoImage} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>{petType === 'dog' ? '🐶' : '🐱'}</Text>
          </View>
        )}
        <Text style={styles.profileName}>{petName}</Text>
        <Text style={styles.profileMeta}>
          {petType === 'cat' ? 'Cat' : 'Dog'}{breed ? ` · ${breed}` : ''}
        </Text>
      </View>

      <Card title="Identity">
        <Info label="DOB / age" value={petDateOfBirth || petAge || 'Not provided'} />
        <Info label="Sex" value={petSex ?? 'Not provided'} />
        <Info label="Weight" value={weight || 'Not provided'} />
        <Info label="Microchip" value={microchip || 'Not provided'} />
      </Card>
      <Card title="Health handoff">
        <Info label="Conditions" value={conditions || 'None added'} />
        <Info label="Allergies" value={allergies || 'None added'} />
        <Info
          label="Current scheduled medications"
          value={currentMedications || 'None added'}
        />
        <Info label="Other medication notes" value={medications || 'None added'} />
        <Info label="Veterinary clinic" value={vetClinic || 'Not provided'} />
      </Card>
      <Card title="Emergency contact">
        <Info label="Name" value={emergencyContactName || 'Not provided'} />
        <Info label="Phone" value={emergencyContactPhone || 'Not provided'} />
        <Info label="Notes" value={emergencyNotes || 'None added'} />
      </Card>

      <View style={styles.warningCard}>
        <Text style={styles.warningTitle}>Confirm before sharing</Text>
        <Text style={styles.warningText}>
          This is a convenience summary, not medical advice. Contact a veterinarian for emergencies.
        </Text>
      </View>
      {dataRightsError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Could not share card</Text>
          <Text style={styles.errorText}>{dataRightsError}</Text>
        </View>
      ) : null}
      <PrimaryButton
        title={dataRightsBusy ? 'Preparing PDF…' : 'Share emergency card PDF'}
        disabled={dataRightsBusy}
        onPress={shareCurrentEmergencyCard}
      />
      <Card title="Limited emergency QR">
        <Text style={styles.cardMuted}>
          This revocable link shows only the emergency card above. It does not expose documents, household access, or your Pawso account.
        </Text>
        {emergencyUrl ? (
          <>
            <Image source={{ uri: `${emergencyUrl}/qr` }} style={{ width: 220, height: 220, alignSelf: 'center', marginVertical: 16 }} accessibilityLabel="Emergency card QR code" />
            <PrimaryButton title="Share emergency link" onPress={() => Share.share({ message: `${petName}'s Pawso emergency card: ${emergencyUrl}` })} />
            <SecondaryButton title={linkBusy ? 'Revoking…' : 'Revoke link'} disabled={linkBusy} onPress={revokeEmergencyLink} />
          </>
        ) : (
          <PrimaryButton title={linkBusy ? 'Creating…' : 'Create emergency QR'} disabled={linkBusy} onPress={createEmergencyLink} />
        )}
        {linkMessage ? <Text style={styles.cardMuted}>{linkMessage}</Text> : null}
      </Card>
      <SecondaryButton title="Edit pet details" onPress={startEditPet} />
    </Page>
  );
}
