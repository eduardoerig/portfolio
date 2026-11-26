export type Profile = {
  name: string;
  role: string;
  summary: string;
  openToWork: boolean;
  email: string;
  githubUrl: string;
  linkedinUrl: string;
  photoPath: string | null;
};

export type Project = {
  id: number;
  title: string;
  description: string;
  stack: string[];
  url: string | null;
  imagePath: string | null;
  metric: string | null;
};

export type Experience = {
  id: number;
  role: string;
  company: string;
  location: string;
  period: string;
  bullets: string[];
  current: boolean;
};

// null = sem rótulo.
export type SkillLevel = "learning" | "intermediate" | null;
export type Skill = { id: number; name: string; group: string; level: SkillLevel };

export type Education = {
  id: number;
  course: string;
  school: string;
  period: string;
  note: string | null;
};

export type Portfolio = {
  profile: Profile;
  projects: Project[];
  experiences: Experience[];
  skills: Skill[];
  education: Education[];
};
