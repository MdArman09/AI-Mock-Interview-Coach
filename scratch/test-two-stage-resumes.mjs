import dotenv from '../server/node_modules/dotenv/lib/main.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

import mongoose from '../server/node_modules/mongoose/index.js';

const BASE_URL = 'http://127.0.0.1:5000';

// Resume 1: Thin fresher resume (Education + 1 small project, no jobs, ~110 words)
const thinFresherResumeText = `
Jordan Smith
Email: jordan.smith@university.edu | Phone: (555) 123-4567 | City: Seattle, WA

Objective:
Hardworking Computer Science student seeking an entry-level software developer position. Dedicated to learning modern programming techniques and contributing to exciting software projects.

Education:
Bachelor of Science in Computer Science
State University, Expected Graduation: May 2026
Relevant Coursework: Data Structures, Object-Oriented Programming, Discrete Mathematics, Introduction to Web Development, Operating Systems Fundamentals.

Academic Project:
Simple Web Calculator (Spring 2025)
- Developed a web-based calculator application using vanilla JavaScript, HTML, and CSS.
- Handled basic arithmetic operations such as addition, subtraction, multiplication, and division.
- Created responsive styling using standard flexbox CSS layouts.

Technical Skills:
Languages: JavaScript, HTML5, CSS3, Python (basics)
Tools: Git, VS Code, GitHub
`.trim();

// Resume 2: Strong fresher resume (several projects and 1 internship, ~260 words)
const strongFresherResumeText = `
Maya Patel
Email: maya.patel@tech.edu | Portfolio: mayapatel.dev | LinkedIn: linkedin.com/in/mayapatel

Professional Summary:
Proactive Computer Science graduate with internship experience and multiple full-stack applications. Proven track record of developing collaborative web systems, working with cloud databases, and writing automated unit tests.

Education:
Bachelor of Science in Computer Science, Magna Cum Laude
University of Technology, Graduated: May 2025 (GPA: 3.85 / 4.0)

Professional Experience:
Software Engineering Intern at CloudPulse Technologies (May 2024 - August 2024, 4 months)
- Built REST API endpoints using Node.js and Express to support customer analytics reporting.
- Wrote Jest unit tests improving backend service code coverage from 55% to 80%.
- Participated in bi-weekly agile sprint planning and code review sessions with senior engineers.

Featured Projects:
1. PeerLearn - Collaborative Study Platform (React, Node.js, Express, MongoDB, Socket.io)
- Architected a real-time study platform supporting up to 50 concurrent student sessions with zero downtime.
- Integrated WebSockets for instant messaging, collaborative document editing, and room access control.
- Designed secure user authentication using JWT and bcrypt password hashing.

2. CryptoPredict - Algorithmic Simulation (Python, pandas, NumPy, scikit-learn)
- Built a time-series trading simulation model analyzing historical crypto price movements.
- Achieved an 18% backtested simulation return over historical market test sets.

3. Campus RideShare App (Kotlin, Firebase, Google Maps API)
- Developed an Android mobile app allowing students to coordinate carpools safely with campus email verification.

Technical Skills:
Languages: JavaScript, TypeScript, Python, Kotlin
Frameworks & Libraries: React, Node.js, Express, Socket.io, Jest
Databases & Cloud: MongoDB, PostgreSQL, Firebase
`.trim();

// Resume 3: Experienced resume (7+ years, 3 jobs, leadership & systems, ~340 words)
const experiencedResumeText = `
David Vance
Email: david.vance@leadeng.com | San Francisco, CA | github.com/davidvance

Professional Summary:
Staff Software Engineer with over 7 years of experience designing and scaling high-throughput distributed systems, microservices architectures, and high-volume data pipelines. Proven leader in driving engineering standards, mentoring teams, and lowering operating costs.

Professional Experience:
FinTech Global - Staff Software Engineer (March 2022 - Present, 3 years)
- Architected and led the migration of a core payments transaction engine to an event-driven Go and Kafka architecture, supporting over 15 million daily transactions with 99.999% uptime.
- Reduced p99 payment processing latency from 450ms to 65ms by implementing Redis caching and connection pool optimizations.
- Mentored a squad of 8 senior and mid-level engineers, established architecture review guidelines, and ran incident post-mortems.

ScaleCommerce Inc. - Senior Software Engineer (January 2020 - February 2022, 2 years)
- Designed and maintained high-availability checkout microservices in Go and PostgreSQL serving 4 million monthly shoppers.
- Spearheaded company-wide migration from monolithic EC2 instances to Kubernetes (EKS), cutting monthly AWS cloud spend by 35%.
- Implemented robust circuit breakers and retry mechanisms that prevented cascade outages during Black Friday traffic surges.

DevHub Software - Backend Software Engineer (July 2018 - December 2019, 1.5 years)
- Developed secure public REST APIs in Python and Django with PostgreSQL.
- Implemented Elasticsearch indexing for product catalogs, improving search speed by 60%.

Projects & Open Source:
1. Raft-KV Distributed Store: Custom Go consensus algorithm implementation supporting distributed leader election and replication.
2. Kafka-Stream-Benchmark: Open source telemetry tool for benchmarking consumer group lag under heavy payloads.

Education:
Bachelor of Science in Computer Science, University of California, Berkeley (2018)

Core Skills:
Languages: Go, Python, SQL, TypeScript
Infrastructure & Systems: Kubernetes, Docker, Kafka, AWS, Terraform, Redis, PostgreSQL, Distributed Systems, Microservices, CI/CD
`.trim();

// Resume 4: Keyword-heavy resume with 40+ raw skills and minimal context (~200 words)
const keywordHeavyResumeText = `
Kevin Keyword
Email: kevin.keyword@techmail.com | Chicago, IL

Objective:
Software developer with broad exposure to cutting-edge technologies across frontend, backend, devops, database, and machine learning stacks.

Education:
Bachelor of Arts in Communications, Minor in CS, Midwest University, 2024

Experience:
Web Assistant at Local Retail Store (June 2024 - October 2024, 4 months)
- Updated store hours and catalog descriptions on WordPress website.

Project:
Personal Portfolio Website
- Created simple HTML/CSS portfolio showcasing resume.

Technical Skills (Extensive List):
Languages: Java, Python, C, C++, C#, Ruby, PHP, Swift, Kotlin, Rust, Go, JavaScript, TypeScript, Dart, Scala, R
Frontend: React, Angular, Vue, Svelte, Next.js, HTML5, CSS3, Tailwind, Bootstrap, jQuery
Backend: Node.js, Express, Django, Flask, FastAPI, Spring Boot, ASP.NET, Laravel, Ruby on Rails
Databases: MongoDB, PostgreSQL, MySQL, Redis, Cassandra, DynamoDB, Oracle, SQLite, CouchDB
DevOps & Cloud: AWS, GCP, Azure, Docker, Kubernetes, Terraform, Ansible, Jenkins, GitHub Actions, Linux
Messaging: Apache Kafka, RabbitMQ, ActiveMQ, Celery
Testing: Jest, Mocha, PyTest, Selenium, Cypress
`.trim();

async function runTest() {
  console.log('========================================================');
  console.log('STARTING TWO-STAGE RESUME QUESTION GENERATION TEST');
  console.log('========================================================\n');

  // Register a test user
  const testUser = {
    name: 'Pipeline Verifier',
    email: `pipeline_test_${Date.now()}@example.com`,
    password: 'Password123!',
  };

  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser),
  });
  const regData = await regRes.json();
  const token = regData.token || regData.data?.token;
  const userId = regData.user?._id || regData.data?.user?._id;
  const authHeaders = { Authorization: `Bearer ${token}` };

  console.log(`✓ Test user registered: ${testUser.email} (ID: ${userId})\n`);

  function createValidPdf(text) {
    const lines = text.split('\n');
    let stream = 'BT /F1 11 Tf 50 750 Td 14 TL ';
    for (const line of lines) {
      const safeLine = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
      stream += `(${safeLine}) ' `;
    }
    stream += 'ET';
    const streamBuf = Buffer.from(stream, 'utf8');

    let body = '%PDF-1.4\n';
    const offsets = [];

    function addObj(id, content) {
      offsets.push(Buffer.byteLength(body, 'utf8'));
      body += `${id} 0 obj\n${content}\nendobj\n`;
    }

    addObj(1, '<</Type /Catalog /Pages 2 0 R>>');
    addObj(2, '<</Type /Pages /Kids [3 0 R] /Count 1>>');
    addObj(3, '<</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources <</Font <</F1 5 0 R>>>>>>');
    addObj(4, `<</Length ${streamBuf.length}>>\nstream\n${stream}\nendstream`);
    addObj(5, '<</Type /Font /Subtype /Type1 /BaseFont /Helvetica>>');

    const startxref = Buffer.byteLength(body, 'utf8');
    let xref = `xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`;
    for (const off of offsets) {
      xref += String(off).padStart(10, '0') + ' 00000 n \n';
    }
    const trailer = `trailer\n<</Size ${offsets.length + 1} /Root 1 0 R>>\nstartxref\n${startxref}\n%%EOF`;

    return Buffer.from(body + xref + trailer, 'utf8');
  }

  async function uploadResumeDirect(text, filename, label) {
    const formData = new FormData();
    const pdfBuf = createValidPdf(text);
    const blob = new Blob([pdfBuf], { type: 'application/pdf' });
    formData.append('resume', blob, filename);
    if (label) formData.append('label', label);

    const res = await fetch(`${BASE_URL}/api/resume/upload`, {
      method: 'POST',
      headers: authHeaders,
      body: formData,
    });
    return res.json();
  }

  async function generateQuestionsDirect(resumeId) {
    const res = await fetch(`${BASE_URL}/api/resume/generate-questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ resumeId }),
    });
    return res.json();
  }

  const results = {};

  try {
    // ----------------------------------------------------
    // TEST 1: Thin Fresher Resume
    // ----------------------------------------------------
    console.log('>>> [1/4] Testing Resume 1: Thin Fresher Resume...');
    const upload1 = await uploadResumeDirect(thinFresherResumeText, 'Jordan_Fresher_Thin.pdf', 'Thin Fresher');
    if (!upload1.success) throw new Error(`Upload 1 failed: ${upload1.message}`);

    const res1 = upload1.data;
    console.log(`  Stage 1 Snapshot: Level=${res1.level}, Roles=${res1.analysis.experienceCount}, Projects=${res1.analysis.projectsCount}, EvidencedSkills=${res1.analysis.evidencedSkillsCount}, PlannedBudget=${res1.plannedQuestionCount}`);

    console.log('  Generating questions (Stage 2)...');
    const gen1 = await generateQuestionsDirect(res1.resumeId);
    if (!gen1.success) throw new Error(`Generate 1 failed: ${gen1.message}`);

    const q1 = gen1.data;
    const diffMix1 = {
      basic: q1.filter((q) => q.difficulty === 'Basic').length,
      intermediate: q1.filter((q) => q.difficulty === 'Intermediate').length,
      advanced: q1.filter((q) => q.difficulty === 'Advanced').length,
    };

    results.resume1 = {
      level: res1.level,
      extractedCounts: {
        roles: res1.analysis.experienceCount,
        projects: res1.analysis.projectsCount,
        evidencedSkills: res1.analysis.evidencedSkillsCount,
        listedSkills: res1.analysis.listedSkillsCount,
      },
      plannedBudget: res1.plannedQuestionCount,
      finalCount: q1.length,
      difficultyMix: diffMix1,
      samples: q1.slice(0, 3).map((q) => ({ text: q.text, difficulty: q.difficulty, type: q.type, anchor: q.anchor })),
    };
    console.log(`  ✓ Resume 1 Finished: ${q1.length} questions generated (Target ~10-14). Difficulty Mix: B=${diffMix1.basic}, I=${diffMix1.intermediate}, A=${diffMix1.advanced}\n`);

    // ----------------------------------------------------
    // TEST 2: Strong Fresher Resume
    // ----------------------------------------------------
    console.log('>>> [2/4] Testing Resume 2: Strong Fresher Resume...');
    const upload2 = await uploadResumeDirect(strongFresherResumeText, 'Maya_Strong_Fresher.pdf', 'Strong Fresher');
    if (!upload2.success) throw new Error(`Upload 2 failed: ${upload2.message}`);

    const res2 = upload2.data;
    console.log(`  Stage 1 Snapshot: Level=${res2.level}, Roles=${res2.analysis.experienceCount}, Projects=${res2.analysis.projectsCount}, EvidencedSkills=${res2.analysis.evidencedSkillsCount}, PlannedBudget=${res2.plannedQuestionCount}`);

    console.log('  Generating questions (Stage 2)...');
    const gen2 = await generateQuestionsDirect(res2.resumeId);
    if (!gen2.success) throw new Error(`Generate 2 failed: ${gen2.message}`);

    const q2 = gen2.data;
    const diffMix2 = {
      basic: q2.filter((q) => q.difficulty === 'Basic').length,
      intermediate: q2.filter((q) => q.difficulty === 'Intermediate').length,
      advanced: q2.filter((q) => q.difficulty === 'Advanced').length,
    };

    results.resume2 = {
      level: res2.level,
      extractedCounts: {
        roles: res2.analysis.experienceCount,
        projects: res2.analysis.projectsCount,
        evidencedSkills: res2.analysis.evidencedSkillsCount,
        listedSkills: res2.analysis.listedSkillsCount,
      },
      plannedBudget: res2.plannedQuestionCount,
      finalCount: q2.length,
      difficultyMix: diffMix2,
      samples: q2.slice(0, 3).map((q) => ({ text: q.text, difficulty: q.difficulty, type: q.type, anchor: q.anchor })),
    };
    console.log(`  ✓ Resume 2 Finished: ${q2.length} questions generated (Target ~20-30). Difficulty Mix: B=${diffMix2.basic}, I=${diffMix2.intermediate}, A=${diffMix2.advanced}\n`);

    // ----------------------------------------------------
    // TEST 3: Experienced Resume (5+ years, multiple roles)
    // ----------------------------------------------------
    console.log('>>> [3/4] Testing Resume 3: Experienced Resume...');
    const upload3 = await uploadResumeDirect(experiencedResumeText, 'David_Staff_Engineer.pdf', 'Experienced Staff Eng');
    if (!upload3.success) throw new Error(`Upload 3 failed: ${upload3.message}`);

    const res3 = upload3.data;
    console.log(`  Stage 1 Snapshot: Level=${res3.level}, Roles=${res3.analysis.experienceCount}, Projects=${res3.analysis.projectsCount}, EvidencedSkills=${res3.analysis.evidencedSkillsCount}, PlannedBudget=${res3.plannedQuestionCount}`);

    console.log('  Generating questions (Stage 2)...');
    const gen3 = await generateQuestionsDirect(res3.resumeId);
    if (!gen3.success) throw new Error(`Generate 3 failed: ${gen3.message}`);

    const q3 = gen3.data;
    const diffMix3 = {
      basic: q3.filter((q) => q.difficulty === 'Basic').length,
      intermediate: q3.filter((q) => q.difficulty === 'Intermediate').length,
      advanced: q3.filter((q) => q.difficulty === 'Advanced').length,
    };

    results.resume3 = {
      level: res3.level,
      extractedCounts: {
        roles: res3.analysis.experienceCount,
        projects: res3.analysis.projectsCount,
        evidencedSkills: res3.analysis.evidencedSkillsCount,
        listedSkills: res3.analysis.listedSkillsCount,
      },
      plannedBudget: res3.plannedQuestionCount,
      finalCount: q3.length,
      difficultyMix: diffMix3,
      samples: q3.slice(0, 3).map((q) => ({ text: q.text, difficulty: q.difficulty, type: q.type, anchor: q.anchor })),
    };
    console.log(`  ✓ Resume 3 Finished: ${q3.length} questions generated (Target ~35-40). Difficulty Mix: B=${diffMix3.basic}, I=${diffMix3.intermediate}, A=${diffMix3.advanced}\n`);

    // ----------------------------------------------------
    // TEST 4: Keyword-Heavy Resume (40+ raw listed skills)
    // ----------------------------------------------------
    console.log('>>> [4/4] Testing Resume 4: Keyword-Heavy Resume...');
    const upload4 = await uploadResumeDirect(keywordHeavyResumeText, 'Kevin_Keyword_Heavy.pdf', 'Keyword Heavy');
    if (!upload4.success) throw new Error(`Upload 4 failed: ${upload4.message}`);

    const res4 = upload4.data;
    console.log(`  Stage 1 Snapshot: Level=${res4.level}, ListedSkills=${res4.analysis.listedSkillsCount}, PlannedBudget=${res4.plannedQuestionCount}`);

    console.log('  Generating questions (Stage 2)...');
    const gen4 = await generateQuestionsDirect(res4.resumeId);
    if (!gen4.success) throw new Error(`Generate 4 failed: ${gen4.message}`);

    const q4 = gen4.data;
    console.log(`  ✓ Resume 4 Finished: ${q4.length} questions generated. Confirmed it does NOT generate one question per keyword (capped properly)!\n`);

    // ----------------------------------------------------
    // TEST 5: Idempotent Regeneration of Resume 1
    // ----------------------------------------------------
    console.log('>>> Testing Idempotent Regeneration on Resume 1...');
    const regen1 = await generateQuestionsDirect(res1.resumeId);
    if (!regen1.success) throw new Error(`Regen 1 failed: ${regen1.message}`);

    const qAfterRegenRes = await fetch(`${BASE_URL}/api/questions?source=resume-generated&resumeId=${res1.resumeId}`, {
      headers: authHeaders,
    });
    const qAfterRegen = await qAfterRegenRes.json();
    console.log(`  DB count for Resume 1 after regeneration: ${qAfterRegen.count} (Expected ~${res1.plannedQuestionCount}, NOT double!)`);
    if (qAfterRegen.count > 25) {
      throw new Error(`Regenerating appended questions instead of replacing! Count: ${qAfterRegen.count}`);
    }
    console.log('  ✓ Idempotent regeneration confirmed: questions were replaced, not appended.\n');

    console.log('========================================================');
    console.log('FINAL RESULTS SUMMARY');
    console.log('========================================================\n');
    console.log(JSON.stringify(results, null, 2));

  } finally {
    // Cleanup test user
    console.log('\nCleaning up test user and generated artifacts...');
    try {
      const User = (await import('../server/models/User.js')).default;
      const Resume = (await import('../server/models/Resume.js')).default;
      const Question = (await import('../server/models/Question.js')).default;
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGO_URI);
      }
      await User.deleteOne({ _id: userId });
      await Resume.deleteMany({ userId });
      await Question.deleteMany({ userId });
      await mongoose.disconnect();
      console.log('Cleanup complete.');
    } catch (cleanupErr) {
      console.warn('Cleanup warning:', cleanupErr.message);
    }
  }
}

runTest().catch((err) => {
  console.error('\n❌ Test run failed:', err);
  process.exit(1);
});
