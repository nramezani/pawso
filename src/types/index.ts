export type Screen =
  | 'welcome'
  | 'addPet'
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
  | 'ask';

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
};

export type Medication = {
  id: string;
  name: string;
  dose: string | null;
  unit: string | null;
  instructions: string | null;
  is_active: boolean;
};

export type MedicationSchedule = {
  id: string;
  medication_id: string;
  time_of_day: string;
};

export type MedicationLog = {
  id: string;
  medication_id: string;
  schedule_id: string | null;
  scheduled_for: string;
  status: 'given' | 'skipped' | 'missed';
  logged_at: string;
  note: string | null;
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
};

export type TaskCompletion = {
  id: string;
  task_id: string;
  completed_at: string;
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

