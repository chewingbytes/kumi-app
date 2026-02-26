import { useState } from "react";
import {
  Alert,
  StyleSheet,
  View,
  AppState,
  Text,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { TextInput, Button } from "react-native-paper";
import { supabase } from "../../lib/supabase";
import { router } from "expo-router";

AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function signUpWithEmail() {
    setLoading(true);

    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: "kumi://auth/callback",
      },
    });

    if (error) {
      Alert.alert("Signup failed", error.message);
    } else if (session) {
      router.replace("/");
    } else {
      Alert.alert("Check your inbox to confirm your email before logging in.");
      router.replace("/login");
    }

    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.card}>
          <Image
            source={{
              uri: "https://nlsggkzpooovjifqcbig.supabase.co/storage/v1/object/public/image_storage//kumi-logo%20(1).png",
            }}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Create a Kumi Account</Text>
          <Text style={styles.subtitle}>
            Sign up to start managing attendance
          </Text>

          <TextInput
            label="Email"
            placeholder="you@example.com"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Password"
            placeholder="Password"
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={signUpWithEmail}
            disabled={loading}
            loading={loading}
            style={styles.primaryButton}
            labelStyle={styles.primaryButtonText}
          >
            Sign Up
          </Button>

          <Button
            mode="text"
            onPress={() => router.push("/login")}
            style={styles.secondaryButton}
            labelStyle={styles.secondaryButtonText}
          >
            Already have an account? Log in
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f0f9ff",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 4,
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#004A7C",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#004A7C",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#fff",
    marginBottom: 16,
    alignSelf: "stretch",
  },
  primaryButton: {
    backgroundColor: "#004A7C",
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: "stretch",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  secondaryButton: {
    marginTop: 12,
  },
  secondaryButtonText: {
    color: "#004A7C",
    fontWeight: "bold",
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 12,
  },
});