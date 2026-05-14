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

export default function SetupPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [alreadySetup, setAlreadySetup] = useState(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(async () => {
      try {
        const res = await fetch("/api/setup");
        const data = (await res.json()) as { setupComplete?: boolean };
        if (!cancelled && data.setupComplete) {
          setAlreadySetup(true);
        }
      } catch {
        /* ignore — show form; POST will still enforce */
      } finally {
        if (!cancelled) setStatusLoading(false);
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
      const data = (await res.json()) as { error?: string; detail?: string };
      if (res.status === 409) {
        setAlreadySetup(true);
        setError(null);
        return;
      }
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
              <Typography variant="h4">Organization onboarding</Typography>
              <Typography sx={{ color: "grey.300" }}>
                Connect your Neon database via <code style={{ fontSize: "0.85em" }}>DATABASE_URL</code>, then create
                the first organization and HR account. You will land in the admin console to add managers, developers,
                testers, and tickets — all metrics read from the database.
              </Typography>
            </Stack>

            {statusLoading ? (
              <Typography sx={{ color: "grey.400", py: 2 }}>Checking setup status…</Typography>
            ) : alreadySetup ? (
              <Stack spacing={2}>
                <Alert severity="info">
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    First-time setup is already done for this database
                  </Typography>
                  <Typography variant="body2" sx={{ color: "grey.200", mb: 1.5 }}>
                    At least one user already exists (for example from an earlier onboarding or{" "}
                    <code style={{ fontSize: "0.8em" }}>npm run db:seed</code>). The onboarding form cannot run again
                    on the same database. Sign in with your HR or manager account, or point{" "}
                    <code style={{ fontSize: "0.8em" }}>DATABASE_URL</code> at a new empty database if you need a clean
                    workspace.
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ pt: 0.5 }}>
                    <Button component={Link} href="/login" variant="contained" size="medium">
                      Sign in
                    </Button>
                    <Button component={Link} href="/" variant="outlined" color="inherit" size="medium">
                      Back to home
                    </Button>
                  </Stack>
                </Alert>
              </Stack>
            ) : (
              <Box component="form" onSubmit={onSubmit} sx={{ display: "grid", gap: 2 }}>
                <TextField
                  label="Organization name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                />
                <TextField
                  label="HR name"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  required
                />
                <TextField
                  label="HR email"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
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
                  {loading ? "Creating workspace…" : "Create organization"}
                </Button>
                <Button component={Link} href="/login" variant="text">
                  Back to sign in
                </Button>
              </Box>
            )}

            {!alreadySetup && !statusLoading ? (
              <Alert severity="info" sx={{ mt: 3 }}>
                This creates the first HR account and the initial organization record. It only runs when the user table
                is empty.
              </Alert>
            ) : null}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
