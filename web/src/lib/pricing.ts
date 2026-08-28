/**
 * ConnectDots is not a hosted SaaS — there is no dashboard subscription, no
 * usage metering, no tiers. The software is MIT-licensed and you can run the
 * whole thing yourself today. What is "priced" here is the developer behind
 * it: custom builds, deployments and operational work, quoted per engagement.
 */
export interface Engagement {
  id: string;
  name: string;
  tag: string;
  amount: string;
  unit: string;
  blurb: string;
  cta: string;
  featured: boolean;
  features: string[];
}

export const ENGAGEMENTS: Engagement[] = [
  {
    id: "self-host",
    name: "Self-host",
    tag: "10 · 001",
    amount: "$0",
    unit: "MIT license",
    blurb: "The entire product, free forever — you run it.",
    cta: "Read the quickstart",
    featured: false,
    features: [
      "Full source, MIT licensed",
      "L1/L2 caching & streaming engine",
      "All six link types",
      "Docker Compose or PM2 cluster",
      "16-page documentation",
    ],
  },
  {
    id: "custom-build",
    name: "Custom build",
    tag: "10 · 002",
    amount: "Quote",
    unit: "per engagement",
    blurb: "I design, deploy and operate a ConnectDots-class system for you.",
    cta: "Start a conversation",
    featured: true,
    features: [
      "L1 RAM + L2 ElastiCache Cluster",
      "Scoped to your traffic and budget",
      "Turnkey setup on your AWS account",
      "800k+ RPS load-test verification",
      "Production runbook + ops handover",
    ],
  },
  {
    id: "consulting",
    name: "Consulting",
    tag: "10 · 003",
    amount: "Custom",
    unit: "per project",
    blurb: "Performance work, capacity planning, or reviews of an existing system.",
    cta: "Talk to me",
    featured: false,
    features: [
      "Node.js & caching architecture audit",
      "AWS cost & capacity optimization",
      "Postgres / Redis cluster scaling",
      "High-concurrency load test design",
    ],
  },
];

export const FAQS = [
  {
    q: "Why custom pricing instead of monthly tiers?",
    a: "Because this isn't a hosted service. ConnectDots is software you self-host on your own infrastructure, so there is nothing to meter or subscribe to. When you hire me, the price depends on what we build together — traffic targets, infrastructure, timeline — and a flat quote beats a surprise invoice.",
  },
  {
    q: "Can you run it for me?",
    a: "Yes — that's the Custom build engagement. I design the topology, deploy on your AWS account (EC2/ECS + ElastiCache Cluster), load-test it to saturation, and hand over the runbook. You own the account, the data and the bill.",
  },
  {
    q: "Why is there no public demo?",
    a: "The production environment ran on AWS EC2, and keeping a public demo online means paying for infrastructure around the clock for something the source already proves. Every claim on this site is reproducible: clone the repo, run it locally, and the 16-page docs walk you through the exact commands.",
  },
  {
    q: "How is this 800k+ requests/second figure real?",
    a: "It's a measured autocannon result against our Cpeak + multi-tier caching engine — the same code that handles /:id redirects. The read path resolves in V8 process RAM (<0.05ms) or Redis cluster (<0.40ms) with zero filesystem disk I/O, rather than scanning a relational database.",
  },
  {
    q: "What does a custom build actually cost?",
    a: "It depends on scope. A single-box deployment of this exact stack is measured in days; a hardened multi-node deployment with load-testing and monitoring takes longer. Email me with your traffic target and constraints and you'll get a fixed quote — no hourly drift.",
  },
  {
    q: "Do you store the long URL or logs?",
    a: "On a self-hosted deployment, you do — the database and logs stay entirely on your infrastructure. On an engagement, I hand over everything and retain nothing. It is MIT-licensed either way.",
  },
] as const;