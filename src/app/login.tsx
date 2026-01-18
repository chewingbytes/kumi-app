import { useState, useEffect } from "react";
import {
  Alert,
  StyleSheet,
  View,
  AppState,
  Text,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from "react-native";
import { TextInput, Button } from "react-native-paper";
import { supabase } from "../../lib/supabase";
import { router } from "expo-router";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Setup AppState listener with proper cleanup
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert("Login failed", error.message);
    } else {
      router.replace("/");
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
              uri: "https://nlsggkzpooovjifqcbig.supabase.co/storage/v1/object/public/image_storage/kumon/logo.png",
            }}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Kumi</Text>
          <Text style={styles.subtitle}>Please log in to continue</Text>
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
            onPress={signInWithEmail}
            disabled={loading}
            loading={loading}
            style={styles.primaryButton}
            labelStyle={styles.primaryButtonText}
          >
            Log In
          </Button>
          <Button
            mode="text"
            onPress={() => router.push("/signup")}
            style={styles.secondaryButton}
            labelStyle={styles.secondaryButtonText}
          >
            Don't have an account? Sign up
          </Button>
          <Button
            mode="text"
            onPress={() => {
              router.push("/forgot-password");
            }}
            labelStyle={styles.secondaryButtonText}
          >
            Forgot Your Password?
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
    alignSelf: "center"
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#004A7C",
    marginBottom: 4,
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
});
