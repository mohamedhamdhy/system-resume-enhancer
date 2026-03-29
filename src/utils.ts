import { ResumeProfile } from "./types";

export function uid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function createDefaultProfile(type: "fullstack" | "backend" | "frontend"): ResumeProfile {
  const now = new Date().toISOString();
  const id = uid();

  const profiles: Record<string, Partial<ResumeProfile>> = {
    fullstack: {
      name: "Full-Stack",
      title: "Full Stack Developer",
      summary: "Experienced Full Stack Developer with 3+ years building scalable web applications using React, Node.js, and TypeScript. Proficient in designing RESTful APIs, optimizing database performance, and deploying cloud-native applications. Passionate about clean code, system architecture, and delivering impactful user experiences.",
      skills: [
        { category: "Frontend", items: ["React", "TypeScript", "JavaScript", "HTML5", "CSS3", "Tailwind CSS", "Next.js"] },
        { category: "Backend", items: ["Node.js", "Express", "REST APIs", "GraphQL", "Python", "FastAPI"] },
        { category: "Database", items: ["PostgreSQL", "MongoDB", "Redis", "MySQL", "Prisma"] },
        { category: "DevOps", items: ["Docker", "AWS", "CI/CD", "GitHub Actions", "Nginx", "Linux"] },
        { category: "Tools", items: ["Git", "Jest", "Postman", "Figma", "Jira", "VS Code"] },
      ],
      experience: [
        {
          id: uid(), company: "TechCorp Solutions", role: "Full Stack Developer",
          period: "Jan 2022 – Present", location: "Dubai, UAE", included: true,
          bullets: [
            { id: uid(), text: "Built and maintained React-based dashboard with real-time data updates using WebSockets, serving 10,000+ daily active users.", charCount: 0, changed: false },
            { id: uid(), text: "Designed and implemented RESTful APIs in Node.js/Express handling 500K+ requests per day with 99.9% uptime.", charCount: 0, changed: false },
            { id: uid(), text: "Optimized PostgreSQL queries reducing average response time by 60% through indexing and query restructuring.", charCount: 0, changed: false },
            { id: uid(), text: "Containerized applications using Docker and deployed to AWS ECS, reducing deployment time by 40%.", charCount: 0, changed: false },
            { id: uid(), text: "Collaborated with product team on feature planning and delivered 15+ features across 6 product sprints.", charCount: 0, changed: false },
          ].map(b => ({ ...b, charCount: b.text.length })),
        },
        {
          id: uid(), company: "StartupXYZ", role: "Junior Developer",
          period: "Jun 2021 – Dec 2021", location: "Remote", included: true,
          bullets: [
            { id: uid(), text: "Developed reusable React components reducing frontend codebase by 30% while improving consistency.", charCount: 0, changed: false },
            { id: uid(), text: "Integrated third-party payment APIs (Stripe) and authentication (OAuth2/JWT) into existing platform.", charCount: 0, changed: false },
            { id: uid(), text: "Wrote unit and integration tests using Jest achieving 80% code coverage across core modules.", charCount: 0, changed: false },
          ].map(b => ({ ...b, charCount: b.text.length })),
        },
      ],
      projects: [
        {
          id: uid(), name: "E-Commerce Platform", tech: ["React", "Node.js", "PostgreSQL", "Redis", "Docker"],
          description: "Full-stack e-commerce solution with real-time inventory and payment processing.",
          url: "https://github.com/mohamedalhamdhy/ecommerce", included: true,
          bullets: [
            { id: uid(), text: "Architected microservices backend with Node.js serving 50K+ concurrent users with sub-200ms latency.", charCount: 0, changed: false },
            { id: uid(), text: "Implemented Redis caching layer reducing database load by 70% on high-traffic product pages.", charCount: 0, changed: false },
          ].map(b => ({ ...b, charCount: b.text.length })),
        },
        {
          id: uid(), name: "Task Management SaaS", tech: ["Next.js", "TypeScript", "MongoDB", "Socket.IO"],
          description: "Real-time collaborative task management platform for distributed teams.",
          url: "https://github.com/mohamedalhamdhy/tasksaas", included: true,
          bullets: [
            { id: uid(), text: "Built real-time collaboration features using Socket.IO enabling live updates for 500+ concurrent users.", charCount: 0, changed: false },
            { id: uid(), text: "Designed MongoDB schema with optimized indexing supporting complex team-hierarchy queries.", charCount: 0, changed: false },
          ].map(b => ({ ...b, charCount: b.text.length })),
        },
      ],
      education: [{
        degree: "Bachelor of Science in Computer Science",
        institution: "University of Technology",
        period: "2018 – 2022",
        gpa: "3.7/4.0",
      }],
      certifications: ["AWS Certified Developer – Associate", "MongoDB Certified Developer"],
      languages: ["English (Fluent)", "Arabic (Native)"],
    },
    backend: {
      name: "Backend",
      title: "Backend Engineer",
      summary: "Backend Engineer with 3+ years specializing in building scalable APIs, microservices, and distributed systems using Node.js, Python, and Go. Deep expertise in database optimization, message queues, and cloud infrastructure.",
      skills: [
        { category: "Languages", items: ["Node.js", "Python", "TypeScript", "Go", "SQL"] },
        { category: "Frameworks", items: ["Express", "FastAPI", "NestJS", "Django"] },
        { category: "Database", items: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch"] },
        { category: "Infrastructure", items: ["AWS", "Docker", "Kubernetes", "Kafka", "RabbitMQ", "Terraform"] },
        { category: "Tools", items: ["Git", "Jest", "Postman", "Datadog", "Prometheus", "Linux"] },
      ],
      experience: [
        {
          id: uid(), company: "TechCorp Solutions", role: "Backend Engineer",
          period: "Jan 2022 – Present", location: "Dubai, UAE", included: true,
          bullets: [
            { id: uid(), text: "Designed and maintained Node.js microservices architecture handling 2M+ daily API requests with 99.99% uptime.", charCount: 0, changed: false },
            { id: uid(), text: "Optimized PostgreSQL database with advanced indexing and query tuning, reducing p99 latency from 800ms to 120ms.", charCount: 0, changed: false },
            { id: uid(), text: "Implemented Kafka-based event streaming pipeline processing 100K+ events per second for real-time analytics.", charCount: 0, changed: false },
            { id: uid(), text: "Built Redis caching strategy reducing database load by 65% and cutting infrastructure costs by $8K/month.", charCount: 0, changed: false },
            { id: uid(), text: "Led migration from monolith to microservices, coordinating across 3 teams and zero downtime deployment.", charCount: 0, changed: false },
          ].map(b => ({ ...b, charCount: b.text.length })),
        },
      ],
      projects: [
        {
          id: uid(), name: "API Gateway Service", tech: ["Node.js", "Redis", "PostgreSQL", "Docker"],
          description: "High-performance API gateway with rate limiting and auth.",
          included: true,
          bullets: [
            { id: uid(), text: "Built custom API gateway supporting 50K req/sec with JWT authentication and Redis-based rate limiting.", charCount: 0, changed: false },
            { id: uid(), text: "Implemented distributed tracing with OpenTelemetry reducing MTTR by 45% in production incidents.", charCount: 0, changed: false },
          ].map(b => ({ ...b, charCount: b.text.length })),
        },
      ],
      education: [{
        degree: "Bachelor of Science in Computer Science",
        institution: "University of Technology",
        period: "2018 – 2022",
      }],
    },
    frontend: {
      name: "Frontend",
      title: "Frontend Developer",
      summary: "Frontend Developer with 3+ years crafting performant, accessible, and visually compelling web applications using React, TypeScript, and modern CSS. Experienced in design systems, performance optimization, and cross-browser compatibility.",
      skills: [
        { category: "Core", items: ["React", "TypeScript", "JavaScript (ES2022)", "HTML5", "CSS3"] },
        { category: "Frameworks", items: ["Next.js", "Vue.js", "Svelte", "Vite", "Webpack"] },
        { category: "Styling", items: ["Tailwind CSS", "Styled Components", "SASS/SCSS", "Figma", "Framer Motion"] },
        { category: "Testing", items: ["Jest", "React Testing Library", "Cypress", "Playwright"] },
        { category: "Tools", items: ["Git", "Storybook", "GraphQL", "REST APIs", "Lighthouse", "WebPack"] },
      ],
      experience: [
        {
          id: uid(), company: "TechCorp Solutions", role: "Frontend Developer",
          period: "Jan 2022 – Present", location: "Dubai, UAE", included: true,
          bullets: [
            { id: uid(), text: "Led migration of legacy jQuery codebase to React, improving Lighthouse performance score from 42 to 94.", charCount: 0, changed: false },
            { id: uid(), text: "Built reusable component library with 60+ components using TypeScript and Storybook, adopted across 5 products.", charCount: 0, changed: false },
            { id: uid(), text: "Implemented code-splitting and lazy loading reducing initial bundle size by 55% and TTI by 2.3 seconds.", charCount: 0, changed: false },
            { id: uid(), text: "Collaborated with UX designers in Figma to deliver pixel-perfect responsive designs with WCAG 2.1 AA compliance.", charCount: 0, changed: false },
          ].map(b => ({ ...b, charCount: b.text.length })),
        },
      ],
      projects: [
        {
          id: uid(), name: "Design System", tech: ["React", "TypeScript", "Storybook", "Tailwind"],
          description: "Enterprise design system with accessibility-first components.",
          included: true,
          bullets: [
            { id: uid(), text: "Designed and built 80+ accessible React components following WCAG 2.1 with full TypeScript coverage.", charCount: 0, changed: false },
            { id: uid(), text: "Automated visual regression testing with Chromatic, preventing UI regressions across 20+ deployments.", charCount: 0, changed: false },
          ].map(b => ({ ...b, charCount: b.text.length })),
        },
      ],
      education: [{
        degree: "Bachelor of Science in Computer Science",
        institution: "University of Technology",
        period: "2018 – 2022",
      }],
    },
  };

  const p = profiles[type];
  return {
    id,
    name: p.name!,
    title: p.title!,
    summary: p.summary!,
    contact: {
      email: "mohamedalhamdhy@gmail.com",
      phone: "+971-XX-XXX-XXXX",
      linkedin: "linkedin.com/in/mohamedalhamdhy",
      github: "github.com/mohamedalhamdhy",
      location: "Dubai, UAE",
      website: "mohamedalhamdhy.com",
    },
    skills: p.skills!,
    experience: p.experience!,
    projects: p.projects!,
    education: p.education!,
    certifications: p.certifications,
    languages: p.languages,
    createdAt: now,
    updatedAt: now,
  };
}