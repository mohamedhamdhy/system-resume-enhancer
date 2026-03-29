import axios from "axios";
import { JDAnalysis, JDKeyword } from "./types";
import { uid } from "./utils";

const TECH_SKILLS = new Set([
  "javascript", "typescript", "python", "java", "go", "rust", "c++", "c#", "php", "ruby", "swift", "kotlin",
  "react", "vue", "angular", "svelte", "next.js", "nuxt", "gatsby",
  "node.js", "express", "fastapi", "django", "flask", "spring", "laravel", "rails",
  "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "dynamodb", "sqlite",
  "aws", "gcp", "azure", "docker", "kubernetes", "terraform", "ansible", "ci/cd", "github actions",
  "graphql", "rest", "grpc", "websocket", "microservices", "kafka", "rabbitmq",
  "git", "linux", "nginx", "jenkins", "datadog", "prometheus", "grafana",
  "html", "css", "sass", "tailwind", "webpack", "vite", "babel",
  "sql", "nosql", "orm", "prisma", "sequelize", "mongoose", "typeorm",
  "jwt", "oauth", "oauth2", "ssl", "tls", "bcrypt",
  "jest", "mocha", "cypress", "playwright", "unit testing", "tdd", "bdd",
  "agile", "scrum", "jira", "figma", "postman", "swagger",
  "machine learning", "ai", "nlp", "tensorflow", "pytorch", "pandas", "numpy",
  "socket.io", "websockets", "graphql", "apollo", "trpc",
]);

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "from",
  "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "will", "would", "could",
  "should", "may", "might", "shall", "can", "this", "that", "these", "those", "it", "we", "they",
  "our", "your", "their", "as", "if", "then", "than", "when", "where", "which", "who", "what",
  "how", "not", "no", "so", "all", "any", "each", "both", "more", "most", "other", "some", "such",
  "very", "just", "also", "well", "new", "good", "great", "strong", "able", "using", "work",
  "experience", "knowledge", "skills", "ability", "understanding", "team", "must", "required",
  "preferred", "years", "year", "least", "least", "minimum", "job", "role", "position", "candidate",
]);

async function fetchJDFromURL(url: string): Promise<string> {
  const res = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    timeout: 10000,
  });
  return (res.data as string)
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/\s{3,}/g, "\n")
    .trim();
}

function extractSkills(text: string): { required: string[]; niceToHave: string[] } {
  const lower = text.toLowerCase();
  const required: string[] = [];
  const niceToHave: string[] = [];
  const reqSection = lower.match(/(?:required|must.have|mandatory)[\s\S]{0,800}/i)?.[0] || "";
  const nthSection = lower.match(/(?:nice.to.have|preferred|bonus|plus|desired)[\s\S]{0,500}/i)?.[0] || "";

  for (const skill of TECH_SKILLS) {
    const inReq = reqSection.includes(skill);
    const inNth = nthSection.includes(skill);
    const inText = lower.includes(skill);
    if (inReq) required.push(skill);
    else if (inNth) niceToHave.push(skill);
    else if (inText) required.push(skill);
  }

  const yearPatterns = [...lower.matchAll(/(\d+)\+?\s*years?\s+(?:of\s+)?([a-z.+#]+)/gi)];
  for (const m of yearPatterns) {
    const skill = m[2].toLowerCase();
    if (skill.length > 1 && !required.includes(skill)) required.push(skill);
  }

  return { required: [...new Set(required)], niceToHave: [...new Set(niceToHave)] };
}

function extractKeywords(text: string, requiredSkills: string[], niceToHave: string[]): JDKeyword[] {
  const words = text.toLowerCase()
    .replace(/[^a-z0-9.\s\-+#]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));

  const freq: Record<string, number> = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;

  const rawWords = text.replace(/[^a-zA-Z0-9.+#\s\-]/g, " ").split(/\s+/).filter(w => w.length > 1);
  for (let i = 0; i < rawWords.length - 1; i++) {
    const bg = `${rawWords[i].toLowerCase()} ${rawWords[i + 1].toLowerCase()}`;
    freq[bg] = (freq[bg] || 0) + 1;
  }

  const keywords: JDKeyword[] = [];
  const added = new Set<string>();

  for (const skill of [...requiredSkills, ...niceToHave]) {
    if (!added.has(skill)) {
      keywords.push({
        term: skill,
        frequency: freq[skill] || 1,
        category: niceToHave.includes(skill) ? "nice-to-have" : "required",
        found: false,
      });
      added.add(skill);
    }
  }

  const sorted = Object.entries(freq)
    .filter(([w, c]) => c >= 2 && !STOP_WORDS.has(w) && !added.has(w) && w.length > 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  for (const [term, frequency] of sorted) {
    keywords.push({ term, frequency, category: "general", found: false });
    added.add(term);
  }

  return keywords;
}

function extractResponsibilities(text: string): string[] {
  const lines = text.split("\n");
  const resp: string[] = [];

  let inSection = false;
  for (const line of lines) {
    const t = line.trim();
    if (/responsibilities|what you.ll do|role|duties|you will/i.test(t)) {
      inSection = true; continue;
    }
    if (/requirements|qualifications|skills|about you/i.test(t) && inSection) {
      inSection = false;
    }
    if (inSection && t.length > 20 && t.length < 300) {
      resp.push(t.replace(/^[-•*·▪]\s*/, ""));
    }
  }

  return resp.slice(0, 15);
}

function detectMeta(text: string): { company?: string; role?: string } {
  const roleMatch = text.match(/(?:job title|position|role)[:\s]+([^\n]{5,60})/i);
  const compMatch = text.match(/(?:company|employer|at|join)[:\s]+([A-Z][a-zA-Z\s]{2,40})/);
  return {
    role: roleMatch?.[1]?.trim(),
    company: compMatch?.[1]?.trim(),
  };
}

export async function parseJD(text: string, url?: string): Promise<JDAnalysis> {
  let rawText = text;
  if (!rawText && url) {
    rawText = await fetchJDFromURL(url);
  }

  const { required, niceToHave } = extractSkills(rawText);
  const keywords = extractKeywords(rawText, required, niceToHave);
  const responsibilities = extractResponsibilities(rawText);
  const meta = detectMeta(rawText);
  const expMatch = rawText.match(/(\d+)\+?\s*(?:-\s*\d+)?\s*years?\s+(?:of\s+)?(?:experience|exp)/i);

  return {
    id: uid(),
    rawText,
    company: meta.company,
    role: meta.role,
    requiredSkills: required,
    niceToHaveSkills: niceToHave,
    keywords,
    responsibilities,
    experienceRequired: expMatch ? expMatch[0] : undefined,
    analyzedAt: new Date().toISOString(),
  };
}