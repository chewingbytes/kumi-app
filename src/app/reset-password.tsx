// ResetPasswordFormScreen.tsx
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  View,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Text,
} from "react-native";
import { TextInput, Button } from "react-native-paper";
import { supabase } from "../../lib/supabase";
import { router } from "expo-router";

export default function ResetPasswordFormScreen() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleUpdate() {
    if (!password.trim()) return Alert.alert("Error", "Enter a new password.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) Alert.alert("Update failed", error.message);
    else {
      Alert.alert("Success", "Password has been changed.");
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
          <Text style={styles.title}>Update Password</Text>
          <TextInput
            label="New Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            style={styles.input}
          />
          <Button
            mode="contained"
            onPress={handleUpdate}
            disabled={loading}
            loading={loading}
            style={styles.primaryButton}
            labelStyle={styles.primaryButtonText}
          >
            Set Password
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
    borderWidth: 1,
    borderColor: "#004A7C",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
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