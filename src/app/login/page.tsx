"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as {
        error?: string;
        user?: { role: string };
      };
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      if (data.user?.role === "hr" || data.user?.role === "manager") {
        router.push("/admin");
      } else if (data.user?.role === "tester") {
        router.push("/tester");
      } else {
        router.push("/employee");
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(34, 211, 238, 0.16), transparent 28%), linear-gradient(180deg, #020617 0%, #0f172a 50%, #111827 100%)",
        py: { xs: 5, md: 10 },
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={3} sx={{ mb: 3 }}>
          <Typography variant="overline" sx={{ color: "primary.main", letterSpacing: 3 }}>
            WorkFlowGuard
          </Typography>
          <Typography variant="h3" sx={{ fontSize: { xs: 34, md: 52 } }}>
            Sign in to the workflow
          </Typography>
          <Typography sx={{ color: "grey.300", maxWidth: 840 }}>
            Role-based access for HR, manager, developer, and tester accounts.
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
            {["hr", "manager", "developer", "tester"].map((role) => (
              <Chip key={role} label={role} color="primary" variant="outlined" />
            ))}
          </Stack>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
          <Card sx={{ flex: 1, bgcolor: "rgba(15, 23, 42, 0.92)" }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" gutterBottom>
                Sign in
              </Typography>
              <Typography sx={{ color: "grey.300", mb: 3 }}>
                Use your email and password, then the app routes you to the right role.
              </Typography>

              <Box component="form" onSubmit={onSubmit} sx={{ display: "grid", gap: 2 }}>
                <TextField
                  label="Email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <TextField
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {error ? <Alert severity="error">{error}</Alert> : null}
                <Button type="submit" variant="contained" size="large" disabled={loading}>
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </Box>

              <Typography sx={{ mt: 2, color: "grey.400", fontSize: 14 }}>
                New team? Create another organization (unique HR email) from onboarding.
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: 0.92, bgcolor: "rgba(15, 23, 42, 0.82)" }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" gutterBottom>
                Need an organization?
              </Typography>
              <Typography sx={{ color: "grey.300", mb: 3 }}>
                Register a new organization and HR admin, or add another tenant alongside existing ones — each org is
                isolated; HR email must be unique on this server.
              </Typography>
              <Button component={Link} href="/setup" variant="outlined" color="primary" fullWidth size="large">
                Organization onboarding
              </Button>
              <Button component={Link} href="/" variant="text" fullWidth sx={{ mt: 1 }}>
                Back to home
              </Button>
              <Alert severity="info" sx={{ mt: 3 }}>
                Supported roles: HR, manager, developer, tester.
              </Alert>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}
