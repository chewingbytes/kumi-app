import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { supabase } from "../../lib/supabase";
import { Session } from "@supabase/supabase-js";
import { useSegments, router } from "expo-router";

export default function Layout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const segments = useSegments();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Redirect logic in a side effect
  useEffect(() => {
    if (session === undefined) return; // wait for session check

    const inAuthGroup =
      segments[0] === "login" ||
      segments[0] === "signup" ||
      segments[0] === "reset-password" ||
      segments[0] === "forgot-password";

    if (!session && !inAuthGroup) {
      // Not logged in, redirect to login
      router.replace("/login");
    } else if (session && inAuthGroup) {
      // Logged in but in auth routes, redirect to home
      router.replace("/");
    }
  }, [session, segments]);

  // Show nothing while waiting for session
  if (session === undefined) return null;

  // Otherwise render the stack (routes)
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false, // 👈 this removes the top bar globally
        }}
      />
    </>
  );
}
