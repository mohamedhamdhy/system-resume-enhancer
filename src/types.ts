export interface ResumeBullet {
  id: string;
  text: string;
  optimized?: string;
  changed?: boolean;
  charCount: number;
}

export interface ResumeExperience {
  id: string;
  company: string;
  role: string;
  period: string;
  location?: string;
  bullets: ResumeBullet[];
  included: boolean;
}

export interface ResumeProject {
  id: string;
  name: string;
  tech: string[];
  description: string;
  bullets: ResumeBullet[];
  url?: string;
  included: boolean;
}

export interface ResumeProfile {
  id: string;
  name: string;
  title: string;
  summary: string;
  contact: {
    email: string;
    phone?: string;
    linkedin?: string;
    github?: string;
    location?: string;
    website?: string;
  };
  skills: {
    category: string;
    items: string[];
  }[];
  experience: ResumeExperience[];
  projects: ResumeProject[];
  education: {
    degree: string;
    institution: string;
    period: string;
    gpa?: string;
  }[];
  certifications?: string[];
  languages?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface JDKeyword {
  term: string;
  frequency: number;
  category: "required" | "nice-to-have" | "responsibility" | "general";
  found: boolean;
  foundIn?: string[];
}

export interface JDAnalysis {
  id: string;
  rawText: string;
  company?: string;
  role?: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  keywords: JDKeyword[];
  responsibilities: string[];
  experienceRequired?: string;
  analyzedAt: string;
}

export type RewriteMode = "minimal" | "balanced" | "aggressive";

export interface OptimizationRequest {
  profileId: string;
  jdText: string;
  jdUrl?: string;
  mode: RewriteMode;
  includedExperienceIds: string[];
  includedProjectIds: string[];
  maxBulletChars: number;
  company?: string;
  role?: string;
}

export interface OptimizedResume {
  id: string;
  profileId: string;
  profileName: string;
  originalProfile: ResumeProfile;
  optimizedProfile: ResumeProfile;
  jdAnalysis: JDAnalysis;
  mode: RewriteMode;
  atsScore: number;
  atsBreakdown: ATSBreakdown;
  skillGaps: SkillGap[];
  keywordMap: KeywordMapEntry[];
  bulletChanges: BulletChange[];
  company: string;
  role: string;
  createdAt: string;
}

export interface ATSBreakdown {
  keywordMatch: number;
  skillAlignment: number;
  sectionCompleteness: number;
  formatScore: number;
  overall: number;
  suggestions: string[];
}

export interface SkillGap {
  skill: string;
  type: "required" | "nice-to-have";
  suggestion: string;
  addable: boolean;
}

export interface KeywordMapEntry {
  jdRequirement: string;
  resumeMatch: string | null;
  status: "matched" | "partial" | "missing";
  section?: string;
}

export interface BulletChange {
  experienceId: string;
  company: string;
  bulletIndex: number;
  original: string;
  optimized: string;
  keywordsAdded: string[];
  charDelta: number;
}

export interface ResumeVersion {
  id: string;
  applicationId: string;
  optimizedResumeId: string;
  company: string;
  role: string;
  atsScore: number;
  mode: RewriteMode;
  createdAt: string;
  snapshotPath: string;
}

export type AppStatus =
  | "applied"
  | "viewed"
  | "shortlisted"
  | "interview"
  | "offer"
  | "rejected";

export interface ApplicationEntry {
  id: string;
  company: string;
  role: string;
  jdUrl?: string;
  profileId: string;
  profileName: string;
  versionId: string;
  atsScore: number;
  missingSkills: string[];
  status: AppStatus;
  appliedAt: string;
  updatedAt: string;
  notes?: string;
  timeline: { status: AppStatus; date: string; note?: string }[];
}

export interface ComparisonResult {
  versionA: ResumeVersion;
  versionB: ResumeVersion;
  atsDelta: number;
  bulletChanges: BulletChange[];
  keywordsAdded: string[];
  keywordsRemoved: string[];
  summaryChanged: boolean;
}

export type SourceType = "url" | "text" | "file" | "pdf";

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface ReportKeyword {
  term: string;
  frequency: number;
}

export interface ResearchReport {
  id: string;
  title: string;
  source: string;
  sourceType: SourceType;
  summary: string;
  keywords: ReportKeyword[];
  wordCount: number;
  flashcards: Flashcard[];
  readabilityScore: number; 
  processedAt: string;      
}

export interface LibraryEntry {
  id: string;
  reportId: string;
  title: string;
  source: string;
  sourceType: SourceType;
  summary: string;      
  keywords: string[];    
  wordCount: number;
  flashcardCount: number;
  processedAt: string;   
  grade: "A" | "B" | "C" | "D";
}