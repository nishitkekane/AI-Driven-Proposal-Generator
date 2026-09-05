/** Blank starting state — user fills in their own requirements */
export const INITIAL_REQUIREMENT = {
  projectTitle: "",
  clientName: "",
  industry: "",
  description: "",
  budgetRange: "",
  deadline: "",
};

export const MOCK_AGENTS = [
  {
    id: "planner",
    name: "The Planner Agent",
    role: "The Strategist",
    description: "Reads RFPs/requirements, extracts precise structural constraints, identifies missing parameters, and generates an optimized execution roadmap.",
    icon: "Compass",
    color: "from-blue-500 to-indigo-600"
  },
  {
    id: "researcher",
    name: "The Researcher Agent",
    role: "The Intel Gathering Spy",
    description: "Scans client digital footprints, historical vendor pricing, competitor benchmarks, and AS9100 compliance standards to supply deep contextual intelligence.",
    icon: "Search",
    color: "from-cyan-400 to-blue-600"
  },
  {
    id: "executor",
    name: "The Executor Agent",
    role: "The Financial & Technical Writer",
    description: "Queries internal pricing databases, calculates 3-tier realistic cost models (Conservative, Standard, Aggressive), and drafts line-item breakdowns.",
    icon: "Cpu",
    color: "from-emerald-400 to-teal-600"
  },
  {
    id: "reflector",
    name: "The Adversarial Reflector",
    role: "The Quality Auditor",
    description: "Actively attempts to break the proposal—auditing overquoted hours, missed compliance mandates, and unaddressed client risks before final presentation.",
    icon: "ShieldAlert",
    color: "from-amber-400 to-orange-600"
  }
];

