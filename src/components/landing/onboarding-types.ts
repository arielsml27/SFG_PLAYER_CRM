export type PlayerData = {
  firstName: string;
  lastName: string;
  photo: File | null;
  email: string;
  phone: string;

  dob: string;
  nationality: string;
  secondNationality: string;

  height: string;
  weight: string;
  strongFoot: string;

  position: string | null;
  secondaryPositions: string[];

  clubName: string;
  noClub: boolean;
  currentLeague: string;
  currentCountry: string;

  startingPlace: string;
  startingAge: string;
  previousClubs: string;
  trainingFrequency: string;
  playerComparison: string;

  nutritionDiscipline: string;
  extraTraining: string;
  externalProfessionals: string;

  familyFootballBackground: string;
  educationStatus: string;
  languagesSpoken: string;
  injuryHistory: string;
  willingToRelocate: string | null;

  shortDescription: string;
  strengths: string;
  weaknesses: string;
  playingStyle: string;
  idealRole: string;
  targetLevel: string | null;

  goals: string[];

  familyContactName: string;
  familyContactPhone: string;
  familyContactEmail: string;
  address: string;

  statsLink: string;
  socialLink: string;

  video: File | null;
};

export const EMPTY_PLAYER_DATA: PlayerData = {
  firstName: "",
  lastName: "",
  photo: null,
  email: "",
  phone: "",
  dob: "",
  nationality: "",
  secondNationality: "",
  height: "",
  weight: "",
  strongFoot: "",
  position: null,
  secondaryPositions: [],
  clubName: "",
  noClub: false,
  currentLeague: "",
  currentCountry: "",
  startingPlace: "",
  startingAge: "",
  previousClubs: "",
  trainingFrequency: "",
  playerComparison: "",
  nutritionDiscipline: "",
  extraTraining: "",
  externalProfessionals: "",
  familyFootballBackground: "",
  educationStatus: "",
  languagesSpoken: "",
  injuryHistory: "",
  willingToRelocate: null,
  shortDescription: "",
  strengths: "",
  weaknesses: "",
  playingStyle: "",
  idealRole: "",
  targetLevel: null,
  goals: [],
  familyContactName: "",
  familyContactPhone: "",
  familyContactEmail: "",
  address: "",
  statsLink: "",
  socialLink: "",
  video: null,
};

export const ONBOARDING_STEPS = [
  "name",
  "birthBody",
  "position",
  "clubBackground",
  "bio",
  "habits",
  "lifeBackground",
  "goals",
  "familyLinks",
  "video",
] as const;
