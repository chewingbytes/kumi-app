// ForgotPasswordScreen.tsx
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
} from "react-native";
import { TextInput, Button } from "react-native-paper";
import * as Linking from "expo-linking";
import { supabase } from "../../lib/supabase";
import { router } from "expo-router";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendPasswordReset() {
    if (!email.trim()) return Alert.alert("Error", "Please enter your email.");

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "kumi://auth/callback",
    });

    setLoading(false);
    if (error) Alert.alert("Reset failed", error.message);
    else {
      Alert.alert(
        "Check your inbox",
        "If that email exists, you'll get a reset link shortly."
      );
      router.replace("/login");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Forgot Password</Text>
          <TextInput
            label="Email"
            placeholder="you@example.com"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            style={styles.input}
          />
          <Button
            mode="contained"
            onPress={sendPasswordReset}
            disabled={loading}
            loading={loading}
            style={styles.primaryButton}
            labelStyle={styles.primaryButtonText}
          >
            Send Reset Link
          </Button>
          <Button
            mode="text"
            onPress={() => router.push("/login")}
            style={styles.linkButton}
            labelStyle={styles.linkButtonText}
          >
            Back to Login
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f0f9ff" },
  container: { flex: 1, justifyContent: "center", padding: 24 },
  card: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 12,
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  title: {
    fontSize: 24,
    color: "#004A7C",
    marginBottom: 24,
  },
  input: { backgroundColor: "#fff", marginBottom: 16, width: "100%" },
  primaryButton: {
    backgroundColor: "#004A7C",
    paddingVertical: 10,
    borderRadius: 8,
    width: "100%",
  },
  primaryButtonText: { color: "#fff", fontWeight: "bold" },
  linkButton: { marginTop: 12 },
  linkButtonText: { color: "#004A7C", fontWeight: "bold" },
});