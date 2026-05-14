"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

type SetupStats = {
  signupAvailable?: boolean;
  organizationCount?: number;
  userCount?: number;
};

export default function SetupPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<SetupStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(async () => {
      try {
        const res = await fetch("/api/setup");
        const data = (await res.json()) as SetupStats;
        if (!cancelled) setStats(data);
      } catch {
        if (!cancelled) setStats({});
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName,
          adminName,
          adminEmail,
          adminPassword,
        }),
      });
      const data = (await res.json()) as { error?: string; detail?: string; code?: string };
      if (!res.ok) {
        setError(data.detail ?? data.error ?? "Setup failed");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  const otherOrgs =
    typeof stats?.organizationCount === "number" && stats.organizationCount > 0;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(245, 158, 11, 0.16), transparent 25%), linear-gradient(180deg, #020617 0%, #111827 100%)",
        py: { xs: 5, md: 10 },
      }}
    >
      <Container maxWidth="sm">
        <Card sx={{ bgcolor: "rgba(15, 23, 42, 0.94)" }}>
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={1} sx={{ mb: 3 }}>
              <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: 3 }}>
                WorkFlowGuard
              </Typography>
              <Typography variant="h4">Create your organization</Typography>
              <Typography sx={{ color: "grey.300" }}>
                Multi-tenant onboarding: each submission creates a <strong>new</strong> organization and its first HR
                account on this server. Data is isolated by organization. Use a <strong>unique email</strong> that is
                not already registered — then use{" "}
                <Link href="/login" style={{ color: "inherit", textDecoration: "underline" }}>
                  Sign in
                </Link>
                .
              </Typography>
            </Stack>

            {otherOrgs ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                Onboarding new Organization... 
              </Alert>
            ) : null}

            <Box component="form" onSubmit={onSubmit} sx={{ display: "grid", gap: 2 }}>
              <TextField
                label="Organization name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />
              <TextField
                label="HR admin name"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                required
              />
              <TextField
                label="HR admin email (login)"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
                helperText="Must be unique across all organizations on this server."
              />
              <TextField
                label="Password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
                helperText="Minimum 8 characters."
              />
              {error ? <Alert severity="error">{error}</Alert> : null}
              <Button type="submit" variant="contained" size="large" disabled={loading}>
                {loading ? "Creating organization…" : "Create organization & sign in"}
              </Button>
              <Button component={Link} href="/login" variant="text">
                Already have an account? Sign in
              </Button>
            </Box>

            <Alert severity="info" sx={{ mt: 3 }}>
              After creation you are signed in as HR for the new org. Add managers, developers, testers, and tickets
              from the admin console.
            </Alert>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
