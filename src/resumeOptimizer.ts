import axios from "axios";
import {
  ResumeProfile, JDAnalysis, OptimizationRequest, OptimizedResume,
  ATSBreakdown, SkillGap, KeywordMapEntry, BulletChange, ResumeBullet
} from "./types";
import { uid, deepClone } from "./utils";

function trimBullet(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const trimmed = text.substring(0, maxChars - 3);
  const lastSpace = trimmed.lastIndexOf(" ");
  return (lastSpace > maxChars * 0.7 ? trimmed.substring(0, lastSpace) : trimmed) + "...";
}

function rewriteBulletHeuristic(
  bullet: string,
  keywords: string[],
  mode: "minimal" | "balanced" | "aggressive",
  maxChars: number
): string {
  let result = bullet;

  if (mode === "minimal") {
    const actionVerbs = ["Built", "Developed", "Implemented", "Designed", "Optimized", "Led", "Created", "Integrated", "Delivered", "Improved"];
    const startsWithVerb = actionVerbs.some(v => result.trimStart().startsWith(v));
    if (!startsWithVerb) {
      result = "Developed " + result.charAt(0).toLowerCase() + result.slice(1);
    }
    for (const kw of keywords.slice(0, 3)) {
      if (!result.toLowerCase().includes(kw.toLowerCase())) {
        result = result.replace(/\.$/, "") + ` using ${kw}.`;
        break;
      }
    }
  } else if (mode === "balanced") {
    let added = 0;
    for (const kw of keywords.slice(0, 6)) {
      if (!result.toLowerCase().includes(kw.toLowerCase()) && added < 2) {
        result = result.replace(/\.$/, "") + ` with ${kw}`;
        added++;
      }
    }
    if (!result.endsWith(".")) result += ".";
  } else {
    const actionVerbs = ["Engineered", "Architected", "Spearheaded", "Optimized", "Delivered", "Implemented", "Integrated", "Developed", "Led", "Automated"];
    const verb = actionVerbs[Math.floor(Math.random() * actionVerbs.length)];
    const core = result.replace(/^[A-Z][a-z]+\s+/, "").replace(/\.$/, "");
    const kws = keywords.slice(0, 4).filter(k => !core.toLowerCase().includes(k.toLowerCase()));
    result = `${verb} ${core}` + (kws.length > 0 ? `, leveraging ${kws.slice(0, 2).join(" and ")}` : "") + ".";
  }

  return trimBullet(result, maxChars);
}

async function rewriteBulletAI(
  bullet: string,
  keywords: string[],
  mode: string,
  maxChars: number,
  context: string
): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return "";

  const modeInstructions: Record<string, string> = {
    minimal: "Make minimal changes. Keep the same meaning. Add 1 relevant keyword naturally.",
    balanced: "Rewrite to be more impactful. Add 2-3 keywords naturally. Start with an action verb.",
    aggressive: "Maximize ATS score. Inject as many relevant keywords as possible while keeping it truthful. Use strong action verbs and quantify impact.",
  };

  const prompt = `You are a professional resume writer. Rewrite this resume bullet point for a job application.

Context: ${context}
Mode: ${mode} — ${modeInstructions[mode]}
Target keywords to include (use naturally): ${keywords.slice(0, 8).join(", ")}
Max characters: ${maxChars}

Original bullet: "${bullet}"

Rules:
- Output ONLY the rewritten bullet. No quotes, no explanation.
- MUST be under ${maxChars} characters
- Keep factual accuracy — do not invent metrics or technologies not implied
- Start with a strong action verb
- Do not change the fundamental meaning`;

  try {
    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      { model: "gpt-3.5-turbo", messages: [{ role: "user", content: prompt }], max_tokens: 120, temperature: 0.4 },
      { headers: { Authorization: `Bearer ${key}` } }
    );
    const result = res.data.choices[0].message.content.trim().replace(/^["']|["']$/g, "");
    return trimBullet(result, maxChars);
  } catch (_) { return ""; }
}

async function rewriteSummaryAI(
  summary: string,
  jd: JDAnalysis,
  mode: string,
  role: string
): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return summary;

  const prompt = `Rewrite this professional resume summary for a ${role} position.
Mode: ${mode}
Required skills from JD: ${jd.requiredSkills.slice(0, 8).join(", ")}
JD role/company: ${jd.role || role} at ${jd.company || "the company"}

Original: "${summary}"

Rules: 3-4 sentences max. Start with title/experience. Include relevant keywords naturally. Professional tone. Output ONLY the rewritten summary.`;

  try {
    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      { model: "gpt-3.5-turbo", messages: [{ role: "user", content: prompt }], max_tokens: 200, temperature: 0.5 },
      { headers: { Authorization: `Bearer ${key}` } }
    );
    return res.data.choices[0].message.content.trim().replace(/^["']|["']$/g, "");
  } catch (_) { return summary; }
}

function calcATSScore(profile: ResumeProfile, jd: JDAnalysis): ATSBreakdown {
  const fullText = [
    profile.summary,
    ...profile.skills.flatMap(s => s.items),
    ...profile.experience.flatMap(e => e.bullets.map(b => b.optimized || b.text)),
    ...profile.projects.flatMap(p => p.bullets.map(b => b.optimized || b.text)),
  ].join(" ").toLowerCase();

  const totalKw = jd.requiredSkills.length;
  const matchedKw = jd.requiredSkills.filter(s => fullText.includes(s.toLowerCase())).length;
  const keywordMatch = totalKw > 0 ? Math.round((matchedKw / totalKw) * 100) : 75;
  const totalSkills = [...jd.requiredSkills, ...jd.niceToHaveSkills].length;
  const matchedSkills = [...jd.requiredSkills, ...jd.niceToHaveSkills]
    .filter(s => fullText.includes(s.toLowerCase())).length;
  const skillAlignment = totalSkills > 0 ? Math.round((matchedSkills / totalSkills) * 100) : 70;

  let completeness = 0;
  if (profile.summary?.length > 50) completeness += 20;
  if (profile.skills.length > 0) completeness += 20;
  if (profile.experience.length > 0) completeness += 25;
  if (profile.projects.length > 0) completeness += 15;
  if (profile.education.length > 0) completeness += 10;
  if (profile.contact.email) completeness += 5;
  if (profile.contact.linkedin || profile.contact.github) completeness += 5;

  const formatScore = 80;

  const overall = Math.round(
    keywordMatch * 0.35 + skillAlignment * 0.30 + completeness * 0.25 + formatScore * 0.10
  );

  const suggestions: string[] = [];
  if (keywordMatch < 60) suggestions.push("Add more JD keywords to experience bullets");
  if (skillAlignment < 60) suggestions.push("Include missing required skills in skills section");
  if (!profile.summary) suggestions.push("Add a professional summary section");
  if (matchedKw < totalKw * 0.5) suggestions.push(`Include: ${jd.requiredSkills.filter(s => !fullText.includes(s)).slice(0, 3).join(", ")}`);

  return { keywordMatch, skillAlignment, sectionCompleteness: completeness, formatScore, overall, suggestions };
}

function analyzeSkillGaps(profile: ResumeProfile, jd: JDAnalysis): SkillGap[] {
  const resumeText = [
    ...profile.skills.flatMap(s => s.items),
    ...profile.experience.flatMap(e => e.bullets.map(b => b.text)),
  ].join(" ").toLowerCase();

  const gaps: SkillGap[] = [];

  for (const skill of jd.requiredSkills) {
    if (!resumeText.includes(skill.toLowerCase())) {
      gaps.push({
        skill,
        type: "required",
        suggestion: `Add "${skill}" to skills section or mention in relevant experience bullet`,
        addable: true,
      });
    }
  }

  for (const skill of jd.niceToHaveSkills) {
    if (!resumeText.includes(skill.toLowerCase())) {
      gaps.push({
        skill,
        type: "nice-to-have",
        suggestion: `Consider adding "${skill}" if you have any exposure`,
        addable: false,
      });
    }
  }

  return gaps;
}

function buildKeywordMap(profile: ResumeProfile, jd: JDAnalysis): KeywordMapEntry[] {
  const sectionTexts: Record<string, string> = {
    summary: profile.summary,
    skills: profile.skills.flatMap(s => s.items).join(" "),
    experience: profile.experience.flatMap(e => e.bullets.map(b => b.optimized || b.text)).join(" "),
    projects: profile.projects.flatMap(p => p.bullets.map(b => b.optimized || b.text)).join(" "),
  };

  return [...jd.requiredSkills, ...jd.niceToHaveSkills.slice(0, 5)].map(req => {
    const lower = req.toLowerCase();
    for (const [section, text] of Object.entries(sectionTexts)) {
      if (text.toLowerCase().includes(lower)) {
        const words = text.toLowerCase().split(/\s+/);
        const matchIdx = words.findIndex(w => w.includes(lower.split(" ")[0]));
        const matchPhrase = words.slice(Math.max(0, matchIdx - 1), matchIdx + 2).join(" ");
        return { jdRequirement: req, resumeMatch: matchPhrase || req, status: "matched" as const, section };
      }
    }
    const firstWord = lower.split(" ")[0];
    for (const [section, text] of Object.entries(sectionTexts)) {
      if (text.toLowerCase().includes(firstWord)) {
        return { jdRequirement: req, resumeMatch: firstWord, status: "partial" as const, section };
      }
    }
    return { jdRequirement: req, resumeMatch: null, status: "missing" as const };
  });
}

function reorderSkills(profile: ResumeProfile, jd: JDAnalysis): ResumeProfile {
  const clone = deepClone(profile);
  const jdSkills = new Set([...jd.requiredSkills, ...jd.niceToHaveSkills].map(s => s.toLowerCase()));

  clone.skills = clone.skills.map(cat => ({
    ...cat,
    items: [
      ...cat.items.filter(s => jdSkills.has(s.toLowerCase())),
      ...cat.items.filter(s => !jdSkills.has(s.toLowerCase())),
    ],
  }));

  return clone;
}

export async function optimizeResume(
  profile: ResumeProfile,
  jd: JDAnalysis,
  req: OptimizationRequest,
  log: (msg: string) => void
): Promise<OptimizedResume> {
  const optimized = deepClone(profile);
  const bulletChanges: BulletChange[] = [];
  const hasAI = !!process.env.OPENAI_API_KEY;

  log(`MODE: ${req.mode.toUpperCase()} | AI: ${hasAI ? "ENABLED" : "DISABLED (heuristic)"}`);

  optimized.experience = optimized.experience.filter(e => req.includedExperienceIds.includes(e.id));
  optimized.projects = optimized.projects.filter(p => req.includedProjectIds.includes(p.id));

  log("REORDERING SKILLS BY JD MATCH...");
  const reordered = reorderSkills(optimized, jd);
  optimized.skills = reordered.skills;

  log("REWRITING SUMMARY...");
  const newSummary = hasAI
    ? await rewriteSummaryAI(optimized.summary, jd, req.mode, req.role || jd.role || profile.title)
    : optimized.summary;
  optimized.summary = newSummary;

  const topKeywords = jd.keywords
    .filter(k => k.category === "required" || k.category === "nice-to-have")
    .map(k => k.term);

  let bulletsDone = 0;
  const totalBullets = optimized.experience.reduce((s, e) => s + e.bullets.length, 0);

  for (const exp of optimized.experience) {
    log(`OPTIMIZING: ${exp.company} — ${exp.bullets.length} bullets`);

    const originalBullets = [...exp.bullets];
    const newBullets: ResumeBullet[] = [];

    for (let i = 0; i < originalBullets.length; i++) {
      const orig = originalBullets[i];
      const context = `${exp.role} at ${exp.company} (${exp.period})`;

      let rewritten = "";

      if (hasAI) {
        rewritten = await rewriteBulletAI(orig.text, topKeywords, req.mode, req.maxBulletChars, context);
      }

      if (!rewritten) {
        rewritten = rewriteBulletHeuristic(orig.text, topKeywords, req.mode, req.maxBulletChars);
      }

      const changed = rewritten !== orig.text;
      const kws = topKeywords.filter(k => rewritten.toLowerCase().includes(k.toLowerCase()) && !orig.text.toLowerCase().includes(k.toLowerCase()));

      if (changed) {
        bulletChanges.push({
          experienceId: exp.id,
          company: exp.company,
          bulletIndex: i,
          original: orig.text,
          optimized: rewritten,
          keywordsAdded: kws,
          charDelta: rewritten.length - orig.text.length,
        });
      }

      newBullets.push({
        ...orig,
        optimized: rewritten,
        changed,
        charCount: rewritten.length,
      });

      bulletsDone++;
      if (bulletsDone % 5 === 0) log(`BULLETS PROCESSED: ${bulletsDone}/${totalBullets}`);
    }

    if (newBullets.length !== originalBullets.length) {
      throw new Error(`BULLET COUNT MISMATCH: ${exp.company} — in:${originalBullets.length} out:${newBullets.length}`);
    }

    exp.bullets = newBullets;
  }

  log(`BULLETS COMPLETE: ${bulletsDone} processed · ${bulletChanges.length} changed`);

  log("CALCULATING ATS SCORE...");
  const fullText = [optimized.summary, ...optimized.skills.flatMap(s => s.items),
  ...optimized.experience.flatMap(e => e.bullets.map(b => b.optimized || b.text))].join(" ").toLowerCase();
  jd.keywords.forEach(k => {
    k.found = fullText.includes(k.term.toLowerCase());
  });

  const atsBreakdown = calcATSScore(optimized, jd);
  log(`ATS SCORE: ${atsBreakdown.overall}/100`);
  log("ANALYZING SKILL GAPS...");
  const skillGaps = analyzeSkillGaps(optimized, jd);
  log(`SKILL GAPS: ${skillGaps.filter(g => g.type === "required").length} required · ${skillGaps.filter(g => g.type === "nice-to-have").length} optional`);

  const keywordMap = buildKeywordMap(optimized, jd);

  return {
    id: uid(),
    profileId: profile.id,
    profileName: profile.name,
    originalProfile: profile,
    optimizedProfile: optimized,
    jdAnalysis: jd,
    mode: req.mode,
    atsScore: atsBreakdown.overall,
    atsBreakdown,
    skillGaps,
    keywordMap,
    bulletChanges,
    company: req.company || jd.company || "Unknown",
    role: req.role || jd.role || profile.title,
    createdAt: new Date().toISOString(),
  };
}