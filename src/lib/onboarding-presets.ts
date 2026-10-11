// ============================================================================
// onboarding-presets.ts
// ----------------------------------------------------------------------------
// Preset class levels + subjects for the post-registration onboarding wizard.
//
// Kenya uses CBE (Competency-Based Education), the successor to the 8-4-4
// system. The structure is:
//   - Pre-Primary: PP1, PP2 (2 years)
//   - Primary: Grade 1-6 (Lower + Upper Primary)
//   - Junior School: Grade 7-9 (formerly "Junior Secondary")
//   - Senior School: Grade 10-12 (formerly "Form 1-4" under 8-4-4)
//
// NOTE: many Secondary schools still use "Form 1-4" naming for familiarity
// while CBE Senior School (Grade 10-12) rolls out. We support BOTH presets
// so schools can pick whichever naming matches their current cohort.
// ============================================================================

export type SchoolLevel = 'primary' | 'secondary' | 'mixed'

export interface PresetClassLevel {
  name: string
  stage: string
  order: number
  defaultStreams: string[]
}

export interface PresetSubject {
  name: string
  code: string
  category: 'Core' | 'Optional' | 'Co-curricular'
}

// ---------------------------------------------------------------------------
// Class level presets
// ---------------------------------------------------------------------------

export const PRIMARY_CLASS_LEVELS: PresetClassLevel[] = [
  { name: 'PP1', stage: 'Pre-Primary', order: 1, defaultStreams: ['East', 'West'] },
  { name: 'PP2', stage: 'Pre-Primary', order: 2, defaultStreams: ['East', 'West'] },
  { name: 'Grade 1', stage: 'Lower Primary', order: 3, defaultStreams: ['East', 'West'] },
  { name: 'Grade 2', stage: 'Lower Primary', order: 4, defaultStreams: ['East', 'West'] },
  { name: 'Grade 3', stage: 'Lower Primary', order: 5, defaultStreams: ['East', 'West'] },
  { name: 'Grade 4', stage: 'Upper Primary', order: 6, defaultStreams: ['East', 'West'] },
  { name: 'Grade 5', stage: 'Upper Primary', order: 7, defaultStreams: ['East', 'West'] },
  { name: 'Grade 6', stage: 'Upper Primary', order: 8, defaultStreams: ['East', 'West'] },
  { name: 'Grade 7', stage: 'Junior School', order: 9, defaultStreams: ['East', 'West', 'North'] },
  { name: 'Grade 8', stage: 'Junior School', order: 10, defaultStreams: ['East', 'West', 'North'] },
  { name: 'Grade 9', stage: 'Junior School', order: 11, defaultStreams: ['East', 'West', 'North'] },
]

export const SECONDARY_CLASS_LEVELS: PresetClassLevel[] = [
  { name: 'Form 1', stage: 'Senior School', order: 1, defaultStreams: ['East', 'West', 'North', 'South'] },
  { name: 'Form 2', stage: 'Senior School', order: 2, defaultStreams: ['East', 'West', 'North', 'South'] },
  { name: 'Form 3', stage: 'Senior School', order: 3, defaultStreams: ['East', 'West', 'North', 'South'] },
  { name: 'Form 4', stage: 'Senior School', order: 4, defaultStreams: ['East', 'West', 'North', 'South'] },
]

// Mixed schools cover both Pre-Primary → Junior School + Senior School
export const MIXED_CLASS_LEVELS: PresetClassLevel[] = [
  ...PRIMARY_CLASS_LEVELS,
  ...SECONDARY_CLASS_LEVELS,
]

export function getPresetClassLevels(level: SchoolLevel): PresetClassLevel[] {
  switch (level) {
    case 'primary':
      return PRIMARY_CLASS_LEVELS
    case 'secondary':
      return SECONDARY_CLASS_LEVELS
    case 'mixed':
    default:
      return MIXED_CLASS_LEVELS
  }
}

// ---------------------------------------------------------------------------
// Subject presets
// ---------------------------------------------------------------------------

// Primary (CBE-aligned): per the KICD curriculum, Pre-Primary and Primary
// integrate most learning areas as "Activities" rather than discrete subjects.
export const PRIMARY_SUBJECTS: PresetSubject[] = [
  { name: 'Mathematics', code: 'MAT', category: 'Core' },
  { name: 'English', code: 'ENG', category: 'Core' },
  { name: 'Kiswahili', code: 'KIS', category: 'Core' },
  { name: 'Environmental Activities', code: 'EVA', category: 'Core' },
  { name: 'Creative Activities', code: 'CRA', category: 'Core' },
  { name: 'Religious Education', code: 'RE', category: 'Core' },
  { name: 'Social Studies', code: 'SST', category: 'Core' },
  { name: 'Integrated Science', code: 'ISC', category: 'Core' },
  { name: 'Agriculture and Nutrition', code: 'AGN', category: 'Core' },
  { name: 'Health Education', code: 'HED', category: 'Core' },
  { name: 'Creative Arts', code: 'CART', category: 'Core' },
  { name: 'Physical and Health Education', code: 'PHE', category: 'Co-curricular' },
  { name: 'Indigenous Languages', code: 'IND', category: 'Optional' },
  { name: 'French', code: 'FRE', category: 'Optional' },
  { name: 'German', code: 'GER', category: 'Optional' },
  { name: 'Computer Science', code: 'CSC', category: 'Optional' },
  { name: 'Pre-Braille and Braille Literacy', code: 'BRL', category: 'Optional' },
  { name: 'Kenyan Sign Language', code: 'KSL', category: 'Optional' },
]

// Secondary (KCSE + CBE-aligned Senior School): the traditional 8-4-4 set
// plus the new CBE Senior School pathways.
export const SECONDARY_SUBJECTS: PresetSubject[] = [
  { name: 'Mathematics', code: 'MAT', category: 'Core' },
  { name: 'English', code: 'ENG', category: 'Core' },
  { name: 'Kiswahili', code: 'KIS', category: 'Core' },
  { name: 'Chemistry', code: 'CHE', category: 'Core' },
  { name: 'Biology', code: 'BIO', category: 'Core' },
  { name: 'Physics', code: 'PHY', category: 'Core' },
  { name: 'History', code: 'HIS', category: 'Core' },
  { name: 'Geography', code: 'GEO', category: 'Core' },
  { name: 'Christian Religious Education', code: 'CRE', category: 'Core' },
  { name: 'Islamic Religious Education', code: 'IRE', category: 'Optional' },
  { name: 'Hindu Religious Education', code: 'HRE', category: 'Optional' },
  { name: 'Home Science', code: 'HSC', category: 'Optional' },
  { name: 'Business Studies', code: 'BST', category: 'Core' },
  { name: 'Computer Studies', code: 'CST', category: 'Optional' },
  { name: 'Agriculture', code: 'AGR', category: 'Optional' },
  { name: 'Aviation Technology', code: 'AVT', category: 'Optional' },
  { name: 'Wood Work', code: 'WWW', category: 'Optional' },
  { name: 'Metal Work', code: 'MTW', category: 'Optional' },
  { name: 'Building Construction', code: 'BCN', category: 'Optional' },
  { name: 'Electricity', code: 'ELC', category: 'Optional' },
  { name: 'Drawing and Design', code: 'DAD', category: 'Optional' },
  { name: 'Arabic', code: 'ARB', category: 'Optional' },
  { name: 'French', code: 'FRE', category: 'Optional' },
  { name: 'German', code: 'GER', category: 'Optional' },
  { name: 'Mandarin', code: 'MAN', category: 'Optional' },
  { name: 'Music', code: 'MUS', category: 'Optional' },
  { name: 'Physical Education', code: 'PED', category: 'Co-curricular' },
]

// Mixed schools get the union of both (deduplicated by name)
export const MIXED_SUBJECTS: PresetSubject[] = (() => {
  const seen = new Set<string>()
  const out: PresetSubject[] = []
  for (const s of [...PRIMARY_SUBJECTS, ...SECONDARY_SUBJECTS]) {
    if (seen.has(s.name)) continue
    seen.add(s.name)
    out.push(s)
  }
  return out
})()

export function getPresetSubjects(level: SchoolLevel): PresetSubject[] {
  switch (level) {
    case 'primary':
      return PRIMARY_SUBJECTS
    case 'secondary':
      return SECONDARY_SUBJECTS
    case 'mixed':
    default:
      return MIXED_SUBJECTS
  }
}

// ---------------------------------------------------------------------------
// Convenience: which "level" labels to show in the wizard dropdown
// ---------------------------------------------------------------------------

export const SCHOOL_LEVEL_OPTIONS: Array<{ value: SchoolLevel; label: string; description: string }> = [
  {
    value: 'primary',
    label: 'Primary (Pre-Primary → Junior School)',
    description: 'PP1, PP2, Grade 1-9 — Competency-Based Education (CBE)',
  },
  {
    value: 'secondary',
    label: 'Secondary (Form 1-4)',
    description: 'Senior School — KCSE / 8-4-4 style or CBE Senior School',
  },
  {
    value: 'mixed',
    label: 'Mixed (Primary + Secondary)',
    description: 'All grades from PP1 to Form 4 — Pre-Primary, Junior, and Senior School',
  },
]

// Sentinel value used to mark step 4 as "skipped by user" so it doesn't
// keep re-appearing on every login. The status endpoint treats this value
// as "skipped" (so step 4 counts as completed) but does NOT consider the
// M-Pesa config actually ready (so the Finance module still nudges them
// to configure properly).
export const MPESA_SKIPPED_SENTINEL = '__SKIPPED__'
