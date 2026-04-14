"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
  const [orgName, setOrgName] = useState("Acme Studio");
  const [adminName, setAdminName] = useState("Alex Morgan");
  const [adminEmail, setAdminEmail] = useState("admin@acme.local");
  const [adminPassword, setAdminPassword] = useState("change-me-now");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Setup failed");
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
                Create the first organization and HR account. After that you can add managers, developers, testers, and tickets.
              </Typography>
            </Stack>

            <Box component="form" onSubmit={onSubmit} sx={{ display: "grid", gap: 2 }}>
              <TextField
                label="Organization name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
              <TextField
                label="HR name"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
              />
              <TextField
                label="HR email"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
              />
              <TextField
                label="Password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
              />
              {error ? <Alert severity="error">{error}</Alert> : null}
              <Button type="submit" variant="contained" size="large" disabled={loading}>
                {loading ? "Creating workspace…" : "Create organization"}
              </Button>
              <Button href="/login" variant="text">
                Back to sign in
              </Button>
            </Box>

            <Alert severity="info" sx={{ mt: 3 }}>
              This creates the first HR account and the initial organization record.
            </Alert>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}