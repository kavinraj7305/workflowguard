/** Stable UUIDs for mock mode — used across routes and JWT session.sub */

export const MOCK_IDS = {
  hrUser: "10000000-0000-4000-8000-000000000001",
  employeeUser: "20000000-0000-4000-8000-000000000001",
  task: "30000000-0000-4000-8000-000000000001",
  assignment: "40000000-0000-4000-8000-000000000001",
} as const;

export const MOCK_DEMO_PASSWORD = "demo";

const createdAt = new Date("2026-04-01T10:00:00.000Z");

export const mockHrUser = {
  id: MOCK_IDS.hrUser,
  email: "hr@demo.local",
  name: "Priya Sharma",
  role: "hr" as const,
};

export const mockEmployeeUser = {
  id: MOCK_IDS.employeeUser,
  email: "employee@demo.local",
  name: "Alex Chen",
  role: "employee" as const,
};

export function resolveMockLogin(email: string, password: string) {
  if (password !== MOCK_DEMO_PASSWORD) return null;
  const e = email.toLowerCase();
  if (e === mockHrUser.email) return mockHrUser;
  if (e === mockEmployeeUser.email) return mockEmployeeUser;
  return null;
}

export function getMockTaskRow() {
  return {
    id: MOCK_IDS.task,
    title: "Fill customer intake (CRM)",
    description:
      "Complete assigned account records in the internal CRM workspace. HR expects engagement on Dashboard, Profile, and Analytics views only for this task.",
    expectedMinutes: 45,
    createdById: MOCK_IDS.hrUser,
    createdAt,
  };
}

export function getMockTasksForApi() {
  const t = getMockTaskRow();
  return [
    {
      ...t,
      createdAt: t.createdAt.toISOString(),
      allowedUrlPatterns: ["dashboard", "profile", "analytics"],
    },
  ];
}

export function getMockAssignmentsForEmployee(employeeId: string) {
  if (employeeId !== MOCK_IDS.employeeUser) return [];
  const t = getMockTaskRow();
  return [
    {
      id: MOCK_IDS.assignment,
      taskId: t.id,
      employeeId,
      status: "in_progress" as const,
      dueAt: null as string | null,
      assignedAt: createdAt.toISOString(),
      completedAt: null as string | null,
      task: {
        ...t,
        createdAt: t.createdAt.toISOString(),
        allowedUrlPatterns: ["dashboard", "profile", "analytics"],
      },
    },
  ];
}

export function getMockWorkspaceAssignment(employeeId: string, assignmentId: string) {
  if (employeeId !== MOCK_IDS.employeeUser || assignmentId !== MOCK_IDS.assignment)
    return null;
  const t = getMockTaskRow();
  return { task: { title: t.title, id: t.id }, taskId: t.id };
}

export function getMockUrlPatternsForTask(taskId: string): string[] {
  if (taskId === MOCK_IDS.task) return ["dashboard", "profile", "analytics"];
  return [];
}

export function getMockEmployees() {
  return [
    {
      id: mockEmployeeUser.id,
      email: mockEmployeeUser.email,
      name: mockEmployeeUser.name,
    },
  ];
}

export function getMockInsights() {
  const t = getMockTaskRow();
  return {
    bottlenecks: [
      {
        taskId: t.id,
        title: t.title,
        sampleSize: 8,
        avgMinutes: 52,
        expectedMinutes: t.expectedMinutes,
        slowRatio: 1.15,
        isBottleneck: false,
      },
      {
        taskId: "30000000-0000-4000-8000-000000000099",
        title: "Quarterly compliance checklist",
        sampleSize: 5,
        avgMinutes: 95,
        expectedMinutes: 60,
        slowRatio: 1.58,
        isBottleneck: true,
      },
    ],
    recentAssignments: [
      {
        id: MOCK_IDS.assignment,
        taskId: t.id,
        employeeId: MOCK_IDS.employeeUser,
        status: "in_progress",
        dueAt: null,
        assignedAt: createdAt.toISOString(),
        completedAt: null,
        employeeName: mockEmployeeUser.name,
        employeeEmail: mockEmployeeUser.email,
        taskTitle: t.title,
        taskExpectedMinutes: t.expectedMinutes,
        latestSnapshot: {
          score: 86,
          classification: "engaged",
        },
      },
      {
        id: "40000000-0000-4000-8000-000000000099",
        taskId: "30000000-0000-4000-8000-000000000099",
        employeeId: MOCK_IDS.employeeUser,
        status: "completed",
        dueAt: null,
        assignedAt: new Date("2026-03-28T09:00:00.000Z").toISOString(),
        completedAt: new Date("2026-03-28T10:20:00.000Z").toISOString(),
        employeeName: mockEmployeeUser.name,
        employeeEmail: mockEmployeeUser.email,
        taskTitle: "Quarterly compliance checklist",
        taskExpectedMinutes: 60,
        latestSnapshot: {
          score: 72,
          classification: "distracted",
        },
      },
    ],
  };
}
