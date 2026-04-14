import { count } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import Link from "next/link";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

export default async function HomePage() {
  const userCount = await db()
    .select({ total: count() })
    .from(users)
    .then((rows) => rows[0]?.total ?? 0);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(34, 211, 238, 0.22), transparent 32%), linear-gradient(180deg, #020617 0%, #0f172a 48%, #111827 100%)",
        color: "white",
        position: "relative",
        overflow: "hidden",
        py: { xs: 5, md: 9 },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          opacity: 0.2,
          pointerEvents: "none",
        }}
      />
        <Container sx={{ position: "relative", zIndex: 1 }} maxWidth="xl">
          <Stack spacing={5} sx={{ maxWidth: 1320, mx: "auto" }}>
            <Stack
              direction={{ xs: "column", lg: "row" }}
              spacing={4}
              sx={{ alignItems: "center" }}
            >
              <Stack spacing={2} sx={{ flex: 1, maxWidth: 700 }}>
                <Chip
                  label="Human-centered work system"
                  color="primary"
                  variant="outlined"
                  sx={{ alignSelf: "flex-start" }}
                />
                <Typography variant="h1" sx={{ fontSize: { xs: 46, md: 76 }, lineHeight: 0.94 }}>
                  Start with sign in and organization onboarding
                </Typography>
                <Typography variant="h6" sx={{ color: "grey.300", maxWidth: 820, fontWeight: 400, lineHeight: 1.55 }}>
                  WorkFlowGuard helps teams set up an organization, invite HR, managers, developers, and testers, define productive apps, and keep each ticket moving with clear ownership and a calm handoff.
                </Typography>

                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", pt: 1 }}>
                  {[
                    "HR",
                    "Manager",
                    "Developer",
                    "Tester",
                    "Organization onboarding",
                  ].map((label) => (
                    <Chip key={label} label={label} color="primary" variant="outlined" />
                  ))}
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ pt: 2 }}>
                  <Button href="/login" variant="contained" size="large">
                    Sign in
                  </Button>
                  <Button
                    href={userCount === 0 ? "/setup" : "/admin"}
                    variant="outlined"
                    color="primary"
                    size="large"
                  >
                    {userCount === 0 ? "Start onboarding" : "Open admin dashboard"}
                  </Button>
                </Stack>

                <Stack direction="row" spacing={4} sx={{ pt: 2, color: "grey.400" }}>
                  <Box>
                    <Typography variant="h5" color="white">{userCount}</Typography>
                    <Typography variant="body2">accounts ready</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h5" color="white">3</Typography>
                    <Typography variant="body2">clear steps</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h5" color="white">1</Typography>
                    <Typography variant="body2">shared purpose</Typography>
                  </Box>
                </Stack>
              </Stack>

              <Card
                sx={{
                  flex: 1,
                  maxWidth: 620,
                  bgcolor: "rgba(15, 23, 42, 0.88)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 30px 90px rgba(2, 6, 23, 0.55)",
                  overflow: "hidden",
                }}
              >
                <Box
                  component="img"
                  src="https://images.pexels.com/photos/5257005/pexels-photo-5257005.jpeg?cs=srgb&dl=pexels-thirdman-5257005.jpg&fm=jpg"
                  alt="A collaborative team discussing work around a table"
                  sx={{ width: "100%", display: "block", aspectRatio: "4 / 3", objectFit: "cover" }}
                />
              </Card>
            </Stack>

            <Stack spacing={3}>
              <Typography variant="overline" sx={{ color: "primary.main", letterSpacing: 3 }}>
                How it works
              </Typography>
              <Card sx={{ bgcolor: "rgba(15, 23, 42, 0.84)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <CardContent sx={{ p: 0 }}>
                  <Box
                    component="img"
                    src="https://images.pexels.com/photos/8636603/pexels-photo-8636603.jpeg?cs=srgb&dl=pexels-kampus-8636603.jpg&fm=jpg"
                    alt="A team discussion that reflects the onboarding and handoff flow"
                    sx={{ width: "100%", display: "block", aspectRatio: "16 / 9", objectFit: "cover" }}
                  />
                </CardContent>
              </Card>
            </Stack>

            <Stack spacing={3}>
              <Typography variant="overline" sx={{ color: "primary.main", letterSpacing: 3 }}>
                AI-assisted work
              </Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
                {[
                  {
                    src: "https://images.pexels.com/photos/8849295/pexels-photo-8849295.jpeg?cs=srgb&dl=pexels-tara-winstead-8849295.jpg&fm=jpg",
                    alt: "AI illustration on a wall with a modern technology feel",
                    title: "AI insight",
                    body: "A visual that fits the intelligence and automation side of the product.",
                  },
                  {
                    src: "https://images.pexels.com/photos/16380906/pexels-photo-16380906.jpeg?cs=srgb&dl=pexels-sanketgraphy-16380906.jpg&fm=jpg",
                    alt: "A smartphone showing an AI chatbot interface",
                    title: "AI support",
                    body: "Useful for showing smart assistance, workflow guidance, and searchable help.",
                  },
                  {
                    src: "https://images.pexels.com/photos/8386437/pexels-photo-8386437.jpeg?cs=srgb&dl=pexels-tara-winstead-8386437.jpg&fm=jpg",
                    alt: "A robotic hand against a blue background",
                    title: "Automation",
                    body: "A strong image for permissioning, tracking, and automated productivity flows.",
                  },
                ].map((item) => (
                  <Card
                    key={item.title}
                    sx={{ flex: 1, bgcolor: "rgba(15, 23, 42, 0.82)", border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}
                  >
                    <Box
                      component="img"
                      src={item.src}
                      alt={item.alt}
                      sx={{ width: "100%", display: "block", aspectRatio: "4 / 3", objectFit: "cover" }}
                    />
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        {item.title}
                      </Typography>
                      <Typography sx={{ color: "grey.300" }}>{item.body}</Typography>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
              <Card sx={{ flex: 1, bgcolor: "rgba(15, 23, 42, 0.82)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" gutterBottom>
                    Sign in
                  </Typography>
                  <Typography sx={{ color: "grey.300", mb: 3 }}>
                    Role-based entry for HR, manager, developer, and tester accounts.
                  </Typography>
                  <Button href="/login" variant="contained" size="large" fullWidth>
                    Go to sign in
                  </Button>
                </CardContent>
              </Card>

              <Card sx={{ flex: 1, bgcolor: "rgba(15, 23, 42, 0.82)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" gutterBottom>
                    Organization onboarding
                  </Typography>
                  <Typography sx={{ color: "grey.300", mb: 3 }}>
                    Create the first organization and HR account when the database is empty, then bring the rest of the team in.
                  </Typography>
                  <Button
                    href={userCount === 0 ? "/setup" : "/admin"}
                    variant="outlined"
                    color="primary"
                    size="large"
                    fullWidth
                  >
                    {userCount === 0 ? "Start onboarding" : "Open admin dashboard"}
                  </Button>
                </CardContent>
              </Card>
            </Stack>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />

            <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
              {[
                {
                  title: "What this app does",
                  body: "WorkFlowGuard keeps work organized around people, tickets, and simple handoffs. HR defines the org, productive apps, roles, tickets, blocked URLs, and the focus flow. Developers work inside the approved workspace, attach screenshots when they are done, and testers close the ticket after verification.",
                },
                {
                  title: "Purpose",
                  body: "Make the day-to-day flow clearer for teams without turning work into surveillance. The system gives structure, context, and a better handoff between HR, developers, and testers.",
                },
              ].map((item) => (
                <Card key={item.title} sx={{ flex: 1, bgcolor: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" gutterBottom>
                      {item.title}
                    </Typography>
                    <Typography sx={{ color: "grey.300" }}>{item.body}</Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>

            <Card sx={{ bgcolor: "rgba(15, 23, 42, 0.82)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <CardContent sx={{ p: 4 }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ justifyContent: "space-between" }}>
                  <Box sx={{ maxWidth: 640 }}>
                    <Typography variant="h5" gutterBottom>
                      About us
                    </Typography>
                    <Typography sx={{ color: "grey.300" }}>
                      WorkFlowGuard is built for teams that want a calmer, clearer way to move work from request to delivery. It keeps each role focused on the next step and keeps the process visible for everyone involved.
                    </Typography>
                  </Box>
                  <Stack spacing={1} sx={{ minWidth: 240 }}>
                    <Button href="/setup" variant="outlined" color="primary">Organization onboarding</Button>
                    <Button href="/login" variant="contained">Sign in</Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between", pb: 2 }}>
              <Typography sx={{ color: "grey.500" }}>Contact: support@workflowguard.local</Typography>
              <Stack direction="row" spacing={2}>
                <Button href="#" variant="text" sx={{ color: "grey.300" }}>Terms and conditions</Button>
                <Button href="#" variant="text" sx={{ color: "grey.300" }}>Contact</Button>
                <Button href="#" variant="text" sx={{ color: "grey.300" }}>About us</Button>
              </Stack>
            </Stack>
          </Stack>
      </Container>
    </Box>
  );
}
