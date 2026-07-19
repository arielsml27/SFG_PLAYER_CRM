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
  "birth",
  "body",
  "position",
  "club",
  "bio",
  "goals",
  "family",
  "links",
  "video",
] as const;
