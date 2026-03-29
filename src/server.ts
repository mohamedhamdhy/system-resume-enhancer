import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import dotenv from "dotenv";
import { parseJD } from "./JDparser";
import { optimizeResume } from "./resumeOptimizer";
import {
  listProfiles, getProfile, saveProfile, deleteProfile,
  listVersions, getVersion,
  listApplications, getApplication, createApplication, updateAppStatus, deleteApplication,
  compareVersions,
} from "./store";
import { createDefaultProfile, uid } from "./utils";
import { OptimizationRequest, AppStatus } from "./types";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "../public")));

function seedIfEmpty() {
  const profiles = listProfiles();
  if (profiles.length === 0) {
    ["fullstack", "backend", "frontend"].forEach(t => {
      const p = createDefaultProfile(t as any);
      saveProfile(p);
    });
    console.log("[RESUMESYS] Seeded 3 default profiles");
  }
}
seedIfEmpty();

app.get("/api/profiles", (_req, res) => res.json(listProfiles()));
app.get("/api/profiles/:id", (req, res) => {
  const p = getProfile(req.params.id);
  p ? res.json(p) : res.status(404).json({ error: "Not found" });
});
app.post("/api/profiles", (req, res) => {
  const profile = { ...req.body, id: uid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  saveProfile(profile);
  res.json(profile);
});
app.put("/api/profiles/:id", (req, res) => {
  const profile = { ...req.body, id: req.params.id };
  saveProfile(profile);
  res.json(profile);
});
app.delete("/api/profiles/:id", (req, res) => {
  deleteProfile(req.params.id);
  res.json({ success: true });
});

app.post("/api/parse-jd", async (req, res) => {
  const { text, url } = req.body;
  if (!text && !url) { res.status(400).json({ error: "Provide text or url" }); return; }
  try {
    const jd = await parseJD(text || "", url);
    res.json(jd);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/optimize", async (req, res) => {
  const request: OptimizationRequest = req.body;
  const profile = getProfile(request.profileId);
  if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }

  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  const log = (msg: string) => { res.write(msg + "\n"); console.log(`[RESUMESYS] ${msg}`); };

  try {
    log(`PROFILE: ${profile.name} | MODE: ${request.mode}`);
    log("PARSING JOB DESCRIPTION...");
    const jd = await parseJD(request.jdText, request.jdUrl);
    log(`JD: ${jd.requiredSkills.length} required skills · ${jd.keywords.length} keywords`);

    if (!request.includedExperienceIds?.length) {
      request.includedExperienceIds = profile.experience.map(e => e.id);
    }
    if (!request.includedProjectIds?.length) {
      request.includedProjectIds = profile.projects.map(p => p.id);
    }
    if (!request.maxBulletChars) request.maxBulletChars = 180;

    log("STARTING OPTIMIZATION ENGINE...");
    const optimized = await optimizeResume(profile, jd, request, log);
    log("SAVING VERSION & APPLICATION...");
    const app_ = createApplication(optimized, request.jdUrl);
    log(`APPLICATION ID: ${app_.id}`);

    io.emit("optimization-complete", { optimized, application: app_ });

    log("──────────────────────────────────────");
    log(`✅ DONE — ATS: ${optimized.atsScore}/100 · ${optimized.bulletChanges.length} bullets changed`);
    res.end("DONE");
  } catch (err: any) {
    log(`❌ ERROR: ${err.message}`);
    res.end("ERROR");
  }
});

app.get("/api/applications", (_req, res) => res.json(listApplications()));
app.get("/api/applications/:id", (req, res) => {
  const a = getApplication(req.params.id);
  a ? res.json(a) : res.status(404).json({ error: "Not found" });
});
app.patch("/api/applications/:id/status", (req, res) => {
  const { status, note } = req.body;
  const a = updateAppStatus(req.params.id, status as AppStatus, note);
  a ? res.json(a) : res.status(404).json({ error: "Not found" });
});
app.delete("/api/applications/:id", (req, res) => {
  deleteApplication(req.params.id);
  res.json({ success: true });
});

app.get("/api/versions", (_req, res) => res.json(listVersions()));
app.get("/api/versions/:id", (req, res) => {
  const v = getVersion(req.params.id);
  v ? res.json(v) : res.status(404).json({ error: "Not found" });
});
app.get("/api/compare/:idA/:idB", (req, res) => {
  const result = compareVersions(req.params.idA, req.params.idB);
  result ? res.json(result) : res.status(404).json({ error: "Versions not found" });
});

app.post("/api/download", (req, res) => {
  const { content, filename } = req.body;
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Type", "text/plain");
  res.send(content);
});

io.on("connection", () => console.log("[RESUMESYS] Dashboard connected"));

server.listen(PORT, () => console.log(`[RESUMESYS] Server → http://localhost:${PORT}`));