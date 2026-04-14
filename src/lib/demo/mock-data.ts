export type DemoOrg = { id: string; name: string; slug: string };
export type DemoUser = {
  id: string;
  orgId: string;
  email: string;
  name: string;
  role: "hr" | "manager" | "developer" | "tester";
};
export type DemoTicket = {
  id: string;
  title: string;
  description: string;
  type: "task" | "bug";
  status: "open" | "in_progress" | "testing" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  allowedApps: string[];
  assignedDeveloperId: string | null;
  testerId: string | null;
  blockedUrlPatterns: string[];
};

export const demoOrgs: DemoOrg[] = [
  { id: "org-demo-1", name: "Nova Labs", slug: "nova-labs" },
];

export const demoUsers: DemoUser[] = [
  {
    id: "user-hr-1",
    orgId: "org-demo-1",
    email: "hr@novalabs.local",
    name: "Priya Sharma",
    role: "hr",
  },
  {
    id: "user-mgr-1",
    orgId: "org-demo-1",
    email: "manager@novalabs.local",
    name: "Rahul Menon",
    role: "manager",
  },
  {
    id: "user-dev-1",
    orgId: "org-demo-1",
    email: "dev.sana@novalabs.local",
    name: "Sana Khan",
    role: "developer",
  },
  {
    id: "user-dev-2",
    orgId: "org-demo-1",
    email: "dev.arun@novalabs.local",
    name: "Arun Patel",
    role: "developer",
  },
  {
    id: "user-test-1",
    orgId: "org-demo-1",
    email: "qa.maya@novalabs.local",
    name: "Maya Joseph",
    role: "tester",
  },
];

export const demoTickets: DemoTicket[] = [
  {
    id: "ticket-demo-1",
    title: "Implement auth dashboard cards",
    description:
      "Add role-based stats and visual metrics for admin homepage.",
    type: "task",
    status: "in_progress",
    priority: "high",
    allowedApps: ["dashboard", "profile", "analytics"],
    assignedDeveloperId: "user-dev-1",
    testerId: "user-test-1",
    blockedUrlPatterns: ["youtube.com", "instagram.com"],
  },
  {
    id: "ticket-demo-2",
    title: "Fix mobile layout overlap in login",
    description: "Buttons overlap on small screens under 360px width.",
    type: "bug",
    status: "testing",
    priority: "urgent",
    allowedApps: ["dashboard", "analytics"],
    assignedDeveloperId: "user-dev-2",
    testerId: "user-test-1",
    blockedUrlPatterns: [],
  },
  {
    id: "ticket-demo-3",
    title: "Add ticket timeline animations",
    description: "Show progression from open to closed with smooth transitions.",
    type: "task",
    status: "open",
    priority: "medium",
    allowedApps: ["dashboard", "profile"],
    assignedDeveloperId: "user-dev-1",
    testerId: null,
    blockedUrlPatterns: ["facebook.com"],
  },
  {
    id: "ticket-demo-4",
    title: "Close screenshot rendering issue",
    description: "Uploaded images should render instantly in analytics handoff.",
    type: "bug",
    status: "closed",
    priority: "low",
    allowedApps: ["analytics"],
    assignedDeveloperId: "user-dev-2",
    testerId: "user-test-1",
    blockedUrlPatterns: [],
  },
];

