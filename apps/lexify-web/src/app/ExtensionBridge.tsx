"use client";

import { useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

const STORAGE_KEY = "lexify_ext_jwt";

export function ExtensionBridge() {
  const { data: session, status } = useSession();

  // Dashboard → Extension: write JWT to localStorage when session changes
  useEffect(() => {
    if (status === "loading") return;

    const jwt = (session as any)?.accessToken;

    if (status === "authenticated" && jwt) {
      localStorage.setItem(STORAGE_KEY, jwt);
      window.dispatchEvent(new CustomEvent("lexify:jwt", { detail: jwt }));
    } else if (status === "unauthenticated") {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent("lexify:signout"));
    }
  }, [session, status]);

  // Extension → Dashboard: listen for JWT written to localStorage by content script
  useEffect(() => {
    const onStorage = async (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;

      if (e.newValue && status !== "authenticated") {
        // Extension signed in — create a NextAuth session from the JWT
        await signIn("extension-jwt", { jwt: e.newValue, redirect: false });
      } else if (!e.newValue && status === "authenticated") {
        // Extension signed out — sign out of dashboard too
        await signOut({ redirect: false });
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [status]);

  // Extension → Dashboard sign-out via custom event dispatched by content script
  useEffect(() => {
    const onExtSignout = () => signOut({ redirect: false });
    window.addEventListener("lexify:ext-signout", onExtSignout);
    return () => window.removeEventListener("lexify:ext-signout", onExtSignout);
  }, []);

  return null;
}
