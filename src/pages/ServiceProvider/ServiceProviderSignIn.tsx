// src/pages/ServiceProvider/ServiceProviderSignIn.tsx

import React, { useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
  Stack,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { useAuth } from "../../auth/useAuth";

interface UserData {
  roles?: string[];
  providerLocationIds?: string[];
}

export default function ServiceProviderSignIn() {
  const navigate = useNavigate();
  const {
    user,
    loading: authLoading,
    signIn,
    signInWithGoogle,
    signUp,
    signOutUser,
  } = useAuth();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  /**
   * After any successful Auth sign-in (via email/password or Google),
   * fetch the Firestore `users/{uid}` doc and verify:
   *   • roles array contains "serviceProvider"
   *   • providerLocationIds is non-empty
   *
   * If checks fail, sign out and show error; otherwise push into "/service-provider".
   */
  const postSignInCheck = async (firebaseUid: string) => {
    try {
      const userDocRef = doc(db, "users", firebaseUid);
      const userSnapshot = await getDoc(userDocRef);

      if (!userSnapshot.exists()) {
        await signOutUser();
        setError("No user record found. Please contact support.");
        return false;
      }

      const userData = userSnapshot.data() as UserData;
      const rolesArray = Array.isArray(userData.roles) ? userData.roles : [];
      if (!rolesArray.includes("serviceProvider")) {
        await signOutUser();
        setError("You do not have service provider permissions.");
        return false;
      }

      const providerLocations = Array.isArray(userData.providerLocationIds)
        ? userData.providerLocationIds
        : [];
      if (providerLocations.length === 0) {
        await signOutUser();
        setError("No associated provider locations found.");
        return false;
      }

      // All good → navigate into the service-provider protected area
      navigate("/service-provider", { replace: true });
      return true;
    } catch (err: any) {
      console.error("postSignInCheck error:", err);
      await signOutUser();
      setError("Failed to verify user permissions. Please try again.");
      return false;
    }
  };

  // If already authenticated on mount, run postSignInCheck()
  useEffect(() => {
    if (!authLoading && user) {
      postSignInCheck(user.uid).catch(() => {
        /* postSignInCheck handles its own errors */
      });
    }
  }, [authLoading, user]);

  // 1) Email/password sign-in
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const credentialUser = await signIn(email, password);

      // Debug: show the UID in console
      console.log("SIGNED IN UID →", credentialUser.uid);

      await postSignInCheck(credentialUser.uid);
    } catch (err: any) {
      console.error("Email sign-in error:", err);
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setError("Invalid email or password.");
      } else {
        setError(err.message || "Sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 2) Google sign-in or link
  const handleGoogleClick = async () => {
    setError(null);
    setLoading(true);

    try {
      const credentialUser = await signInWithGoogle(); // ← no roles param

      console.log("SIGNED IN UID →", credentialUser.uid);
      await postSignInCheck(credentialUser.uid);
    } catch (err: any) {
      console.error("Google sign-in/link error:", err);
      setError(err.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxWidth="400px" mx="auto" mt={8} px={2}>
      <Typography variant="h4" align="center" gutterBottom>
        Service Provider Sign In
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      <Stack spacing={2} mt={2}>
        <form onSubmit={handleEmailSignIn}>
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" variant="contained" fullWidth disabled={loading}>
              {loading ? <CircularProgress size={24} /> : "Sign In"}
            </Button>
          </Stack>
        </form>

        <Divider>or</Divider>

        <Button
          variant="outlined"
          startIcon={<GoogleIcon />}
          fullWidth
          onClick={handleGoogleClick}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Continue with Google"}
        </Button>
      </Stack>
    </Box>
  );
}
