export const seedQuestions = [
  // Behavioral Questions (STAR Method)
  {
    category: 'Behavioral',
    text: 'Tell me about a time you handled a difficult conflict with a coworker or team member.',
    difficulty: 'Medium',
    sampleAnswer: 'In my previous project, a teammate and I disagreed on database indexing strategy (Situation). We needed to finalize schema before launch (Task). I scheduled a 30-minute benchmark session comparing query latency (Action). We found the compound index reduced latency by 45%, aligned on the data, and shipped on time (Result).',
  },
  {
    category: 'Behavioral',
    text: 'Describe a situation where a project failed or didn’t go as planned. What did you learn?',
    difficulty: 'Hard',
    sampleAnswer: 'During a release cycle, our automated tests missed an edge case in third-party auth (Situation). We needed to resolve the production outage immediately (Task). I initiated a quick rollback, hotfixed the bug, and set up end-to-end integration tests (Action). We restored 100% uptime within 20 minutes and prevented future regressions (Result).',
  },
  {
    category: 'Behavioral',
    text: 'Give an example of a time you had to work under intense pressure or a tight deadline.',
    difficulty: 'Medium',
    sampleAnswer: 'Our primary payment gateway announced a mandatory API deprecation with two weeks notice (Situation). I had to migrate our billing service without transaction downtime (Task). I scoped the minimal critical migration path, worked through a phased canary rollout, and ran parallel tests (Action). We completed migration 3 days ahead of deadline with zero payment failures (Result).',
  },
  {
    category: 'Behavioral',
    text: 'Tell me about a time you went above and beyond your defined job responsibilities.',
    difficulty: 'Easy',
    sampleAnswer: 'While working as a junior developer, I noticed onboarding new engineers took nearly a week due to undocumented dev environments (Situation). I wanted to streamline this for future hires (Task). Over a weekend, I containerized the entire local stack using Docker and wrote an interactive onboarding guide (Action). Onboarding time dropped from 5 days to 2 hours (Result).',
  },
  {
    category: 'Behavioral',
    text: 'Describe a time you received critical or negative feedback. How did you handle it?',
    difficulty: 'Medium',
    sampleAnswer: 'In a code review, a senior engineer noted that my PR was too large and lacked sufficient unit tests (Situation). I needed to adapt my development workflow (Task). I thanked the reviewer, broke down the PR into three smaller logical PRs, and increased test coverage to 85% (Action). The code was approved swiftly and my future PR review velocity doubled (Result).',
  },
  {
    category: 'Behavioral',
    text: 'Tell me about a time you had to persuade stakeholders to adopt your technical recommendation.',
    difficulty: 'Hard',
    sampleAnswer: 'Our product team wanted to build an in-house real-time notification engine, which would take 3 months (Situation). I believed using an established managed solution would save cost and time (Task). I built a quick prototype over two days showing cost projections, latency guarantees, and maintenance overhead (Action). Stakeholders agreed, saving the company approximately 2 months of engineering hours (Result).',
  },

  // Technical-lite Questions
  {
    category: 'Technical-lite',
    text: 'How do you approach debugging a high-latency issue or performance bottleneck in a web application?',
    difficulty: 'Medium',
    sampleAnswer: 'I start by isolating the problem through measurement rather than guessing: checking server metrics, database slow query logs, and browser network waterfalls. Once identified, I profile memory/CPU, apply indexing or caching, and verify with load tests.',
  },
  {
    category: 'Technical-lite',
    text: 'Explain the difference between SQL (relational) and NoSQL (document) databases, and how you choose between them.',
    difficulty: 'Easy',
    sampleAnswer: 'SQL databases are structured, ACID-compliant, and excel at complex joins and relational integrity. NoSQL databases offer flexible schemas and horizontal scalability, ideal for unstructured data or rapidly evolving models. I choose based on schema rigidity, consistency requirements, and query access patterns.',
  },
  {
    category: 'Technical-lite',
    text: 'What strategies do you use to ensure your REST or GraphQL APIs are secure and resilient?',
    difficulty: 'Medium',
    sampleAnswer: 'I enforce authentication via JWT/OAuth, rate limiting to stop abuse, strict input validation and sanitization, HTTPS encryption, CORS policies, and structured error handling that avoids leaking stack traces.',
  },
  {
    category: 'Technical-lite',
    text: 'Can you walk me through your understanding of how browser caching and HTTP cache-control headers work?',
    difficulty: 'Medium',
    sampleAnswer: 'Browsers cache resources based on headers like Cache-Control (max-age, no-cache, no-store), ETag, and Last-Modified. Static hashed assets can be cached aggressively (immutable), while dynamic API responses use validation tokens or no-store.',
  },
  {
    category: 'Technical-lite',
    text: 'How do you design an application to handle intermittent third-party API failures gracefully?',
    difficulty: 'Hard',
    sampleAnswer: 'I implement the circuit breaker pattern, exponential backoff retries with jitter, asynchronous queuing (e.g. BullMQ/RabbitMQ) for deferred execution, and sensible fallbacks or user-friendly status notifications.',
  },

  // Situational & Leadership
  {
    category: 'Situational',
    text: 'If you were assigned a task with ambiguous or contradictory requirements, what steps would you take?',
    difficulty: 'Medium',
    sampleAnswer: 'I first list out the ambiguities, outline hypothetical user flows and edge cases, then schedule a targeted alignment discussion with the product manager to clarify goals and establish acceptance criteria before writing code.',
  },
  {
    category: 'Situational',
    text: 'Imagine your team is divided 50/50 on two competing architectural approaches. How do you help break the stalemate?',
    difficulty: 'Hard',
    sampleAnswer: 'I suggest listing objective decision criteria (latency, developer ergonomics, maintenance, cost), building minimal POCs for both options, and evaluating against concrete performance numbers and team familiarity.',
  },
  {
    category: 'Situational',
    text: 'How do you prioritize your work when everything on your plate is marked as high-priority or urgent?',
    difficulty: 'Medium',
    sampleAnswer: 'I assess impact vs effort, consult engineering leadership on critical business blockers, communicate trade-offs transparently, and focus on delivering highest-value outcomes sequentially rather than context-switching.',
  },
  {
    category: 'Situational',
    text: 'You discover a critical security vulnerability right before a scheduled feature release. What do you do?',
    difficulty: 'Hard',
    sampleAnswer: 'I immediately halt the release, notify the engineering lead and security team with reproducible details, assess the exploitability severity, patch or mitigate the vulnerability, and only proceed once verified safe.',
  },
];

export default seedQuestions;
