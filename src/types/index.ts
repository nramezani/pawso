export type Screen =
  | 'welcome'
  | 'addPet'
  | 'pets'
  | 'petProfile'
  | 'today'
  | 'processing'
  | 'review'
  | 'timeline'
  | 'documents'
  | 'medications'
  | 'addMedication'
  | 'care'
  | 'addCareTask'
  | 'ask'
  | 'vetVisitPrep'
  | 'healthCheckIn'
  | 'healthTrends'
  | 'emergencyCard'
  | 'smartCarePlan'
  | 'account'
  | 'household';

export type PetType = 'cat' | 'dog';
export type PetSex = 'female' | 'male';
export type AlteredStatus = 'yes' | 'no' | 'notSure';

export type TimelineEvent = {
  id: string;
  date: string;
  type: string;
  title: string;
  detail: string;
  source: string;
};

export type PetDocument = {
  id: string;
  filename: string;
  content_type: string | null;
  size_bytes: number | null;
  status: string;
  storage_path: string | null;
  created_at: string;
  linked_events: number;
  archived_at?: string | null;
};

export type Medication = {
  id: string;
  name: string;
  dose: string | null;
  unit: string | null;
  instructions: string | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  refills_remaining: number | null;
  refill_due_date: string | null;
  paused_at: string | null;
};

export type MedicationSchedule = {
  id: string;
  medication_id: string;
  time_of_day: string;
  snoozed_until: string | null;
};

export type MedicationLog = {
  id: string;
  user_id: string | null;
  medication_id: string;
  schedule_id: string | null;
  scheduled_for: string;
  status: 'given' | 'skipped';
  logged_at: string;
  note: string | null;
  actor_name?: string | null;
  corrected_at?: string | null;
  correction_reason?: string | null;
};

export type TodayMedicationDose = {
  medication: Medication;
  schedule: MedicationSchedule;
  scheduledFor: Date;
  log: MedicationLog | null;
};

export type CareTask = {
  id: string;
  title: string;
  notes: string | null;
  due_at: string;
  task_type: string;
  is_active: boolean;
  series_id: string;
  recurrence_frequency: 'none' | 'daily' | 'weekly' | 'monthly';
  recurrence_interval: number;
  recurrence_ends_on: string | null;
  occurrence_number: number;
  paused_at: string | null;
  snoozed_until: string | null;
};

export type TaskCompletion = {
  id: string;
  task_id: string;
  completed_at: string;
  actor_name?: string | null;
  outcome?: 'completed' | 'skipped';
};

export type HouseholdSummary = {
  household_id: string;
  name: string;
  role: 'owner' | 'caregiver' | 'sitter';
  time_zone: string;
};

export type SymptomEntry = {
  id: string;
  pet_id: string;
  observed_on: string;
  category: string;
  severity: 1 | 2 | 3 | 4 | 5;
  frequency: 'single' | 'intermittent' | 'frequent' | 'constant';
  duration_minutes: number | null;
  notes: string | null;
  created_at: string;
};

export type LabResult = {
  id: string;
  pet_id: string;
  document_id: string | null;
  collected_on: string;
  test_name: string;
  numeric_value: number | null;
  text_value: string | null;
  unit: string | null;
  reference_low: number | null;
  reference_high: number | null;
  reference_text: string | null;
  notes: string | null;
  created_at: string;
};

export type HouseholdMember = {
  id: string;
  household_id: string;
  user_id: string;
  display_name: string;
  role: 'owner' | 'caregiver' | 'sitter';
  created_at: string;
};

export type AskSource = {
  id: string;
  label: string;
  source_type: string;
  date?: string | null;
  text: string;
};

export type AskAnswer = {
  answer: string;
  source_ids: string[];
  answer_type: 'record_summary' | 'record_lookup' | 'general_guidance' | 'insufficient_information';
  safety_category: 'normal' | 'medical_caution' | 'urgent';
};

export type VetVisitPrep = {
  overview: string;
  priority_concerns: string[];
  current_medications: string[];
  recent_history: string[];
  follow_up_items: string[];
  questions_for_vet: string[];
  missing_information: string[];
  source_ids: string[];
};

export type SmartCareSuggestion = {
  title: string;
  reason: string;
  notes: string;
  task_type: 'follow_up' | 'monitoring' | 'routine_care';
  source_ids: string[];
};



export type PetSummary = {
  id: string;
  household_id?: string | null;
  name: string;
  species: PetType;
  breed: string | null;
  approximate_age: string | null;
  date_of_birth: string | null;
  sex: PetSex | null;
  spayed_neutered: boolean | null;
  weight_kg: number | null;
  microchip_number: string | null;
  conditions: string | null;
  allergies: string | null;
  medications: string | null;
  vet_clinic: string | null;
  photo_path: string | null;
  photo_url?: string | null;
  archived_at: string | null;
  emergency_notes: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  created_at: string;
};

export type PetTodaySummary = {
  pet_id: string;
  name: string;
  species: PetType;
  care_due_today: number;
  medication_doses_today: number;
  medication_doses_pending: number;
  overdue_count: number;
};
