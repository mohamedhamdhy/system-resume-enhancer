import fs from "fs";
import path from "path";
import {
  ResumeProfile, OptimizedResume, ResumeVersion,
  ApplicationEntry, AppStatus, ComparisonResult
} from "./types";
import { uid } from "./utils";

const BASE = path.join(__dirname, "../../data");
const PROFILES_DIR = path.join(BASE, "profiles");
const VERSIONS_DIR = path.join(BASE, "versions");
const APPLICATIONS_DIR = path.join(BASE, "applications");

function ensure() {
  [PROFILES_DIR, VERSIONS_DIR, APPLICATIONS_DIR].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });
}

export function listProfiles(): ResumeProfile[] {
  ensure();
  return fs.readdirSync(PROFILES_DIR)
    .filter(f => f.endsWith(".json"))
    .map(f => JSON.parse(fs.readFileSync(path.join(PROFILES_DIR, f), "utf-8")));
}

export function getProfile(id: string): ResumeProfile | null {
  ensure();
  const p = path.join(PROFILES_DIR, `${id}.json`);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf-8")) : null;
}

export function saveProfile(profile: ResumeProfile): void {
  ensure();
  profile.updatedAt = new Date().toISOString();
  fs.writeFileSync(path.join(PROFILES_DIR, `${profile.id}.json`), JSON.stringify(profile, null, 2));
}

export function deleteProfile(id: string): void {
  ensure();
  const p = path.join(PROFILES_DIR, `${id}.json`);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

export function saveVersion(opt: OptimizedResume, applicationId: string): ResumeVersion {
  ensure();
  const version: ResumeVersion = {
    id: uid(),
    applicationId,
    optimizedResumeId: opt.id,
    company: opt.company,
    role: opt.role,
    atsScore: opt.atsScore,
    mode: opt.mode,
    createdAt: opt.createdAt,
    snapshotPath: path.join(VERSIONS_DIR, `${opt.id}.json`),
  };

  fs.writeFileSync(version.snapshotPath, JSON.stringify(opt, null, 2));
  fs.writeFileSync(path.join(VERSIONS_DIR, `${version.id}.meta.json`), JSON.stringify(version, null, 2));
  return version;
}

export function getVersion(id: string): OptimizedResume | null {
  ensure();
  const metaPath = path.join(VERSIONS_DIR, `${id}.meta.json`);
  if (!fs.existsSync(metaPath)) return null;
  const meta: ResumeVersion = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
  return fs.existsSync(meta.snapshotPath)
    ? JSON.parse(fs.readFileSync(meta.snapshotPath, "utf-8")) : null;
}

export function listVersions(): ResumeVersion[] {
  ensure();
  return fs.readdirSync(VERSIONS_DIR)
    .filter(f => f.endsWith(".meta.json"))
    .map(f => JSON.parse(fs.readFileSync(path.join(VERSIONS_DIR, f), "utf-8")))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function listApplications(): ApplicationEntry[] {
  ensure();
  return fs.readdirSync(APPLICATIONS_DIR)
    .filter(f => f.endsWith(".json"))
    .map(f => JSON.parse(fs.readFileSync(path.join(APPLICATIONS_DIR, f), "utf-8")))
    .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
}

export function getApplication(id: string): ApplicationEntry | null {
  ensure();
  const p = path.join(APPLICATIONS_DIR, `${id}.json`);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf-8")) : null;
}

export function createApplication(opt: OptimizedResume, jdUrl?: string): ApplicationEntry {
  ensure();
  const appId = uid();
  const version = saveVersion(opt, appId);
  const now = new Date().toISOString();

  const app: ApplicationEntry = {
    id: appId,
    company: opt.company,
    role: opt.role,
    jdUrl,
    profileId: opt.profileId,
    profileName: opt.profileName,
    versionId: version.id,
    atsScore: opt.atsScore,
    missingSkills: opt.skillGaps.filter(g => g.type === "required").map(g => g.skill),
    status: "applied",
    appliedAt: now,
    updatedAt: now,
    timeline: [{ status: "applied", date: now }],
  };

  fs.writeFileSync(path.join(APPLICATIONS_DIR, `${appId}.json`), JSON.stringify(app, null, 2));
  return app;
}

export function updateAppStatus(id: string, status: AppStatus, note?: string): ApplicationEntry | null {
  ensure();
  const app = getApplication(id);
  if (!app) return null;
  app.status = status;
  app.updatedAt = new Date().toISOString();
  app.timeline.push({ status, date: app.updatedAt, note });
  fs.writeFileSync(path.join(APPLICATIONS_DIR, `${id}.json`), JSON.stringify(app, null, 2));
  return app;
}

export function deleteApplication(id: string): void {
  ensure();
  const p = path.join(APPLICATIONS_DIR, `${id}.json`);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

export function compareVersions(idA: string, idB: string): ComparisonResult | null {
  const versions = listVersions();
  const metaA = versions.find(v => v.id === idA);
  const metaB = versions.find(v => v.id === idB);
  if (!metaA || !metaB) return null;

  const optA = getVersion(idA);
  const optB = getVersion(idB);
  if (!optA || !optB) return null;

  const textA = [optA.optimizedProfile.summary,
  ...optA.optimizedProfile.experience.flatMap(e => e.bullets.map(b => b.optimized || b.text))].join(" ").toLowerCase();
  const textB = [optB.optimizedProfile.summary,
  ...optB.optimizedProfile.experience.flatMap(e => e.bullets.map(b => b.optimized || b.text))].join(" ").toLowerCase();

  const kwA = new Set(optA.jdAnalysis.keywords.filter(k => textA.includes(k.term)).map(k => k.term));
  const kwB = new Set(optB.jdAnalysis.keywords.filter(k => textB.includes(k.term)).map(k => k.term));
  const added = [...kwB].filter(k => !kwA.has(k));
  const removed = [...kwA].filter(k => !kwB.has(k));

  return {
    versionA: metaA,
    versionB: metaB,
    atsDelta: metaB.atsScore - metaA.atsScore,
    bulletChanges: optB.bulletChanges,
    keywordsAdded: added,
    keywordsRemoved: removed,
    summaryChanged: optA.optimizedProfile.summary !== optB.optimizedProfile.summary,
  };
}