import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { router } from "expo-router";

export default function ProfileScreen() {
  const [user, setUser] = useState(null);

  const handleLogout = () => {
    Alert.alert("Confirm Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.auth.signOut();
          if (error) {
            Alert.alert("Logout failed", error.message);
          } else {
            router.replace("/login");
          }
        },
      },
    ]);
  };

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Error getting user:", error.message);
      } else {
        setUser(user);
      }
    };

    fetchUser();
  }, []);

  if (!user) {
    return (
      <SafeAreaView
        style={styles.loadingSafeArea}
        edges={["top", "bottom", "left", "right"]}
      >
        <ActivityIndicator size="large" color="#004A7C" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "bottom", "left", "right"]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.navigate("/")}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitle}>My Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.card}>
          {/* Avatar / Icon */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.email.charAt(0).toUpperCase()}
            </Text>
          </View>

          {/* Info Grid */}
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{user.email}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.label}>User ID</Text>
              <Text style={styles.value}>{user.id}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.label}>Created At</Text>
              <Text style={styles.value}>
                {new Date(user.created_at).toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Logout Button */}
          <Pressable onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingSafeArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#A7C7E7",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#A7C7E7",
  },
  container: {
    flexGrow: 1,
    padding: 20,
    alignItems: "center",
  },

  // Header
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#1F3C88",
    backgroundColor: "#F2E9E4",
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  backButtonText: {
    fontSize: 18,
    color: "#1F3C88",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },
  pageTitle: {
    flex: 1,
    fontSize: 28,
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
    color: "#1F3C88",
    textAlign: "center",
    marginRight: 40, // ensures back button doesn't overlap
  },

  // Profile Card
  card: {
    width: "100%",
    backgroundColor: "#F2E9E4",
    borderRadius: 20,
    padding: 30,
    borderWidth: 4,
    borderColor: "#1F3C88",
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    alignItems: "center",
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ADC5CE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "#1F3C88",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  avatarText: {
    fontSize: 36,
    color: "#1F3C88",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },

  // Info Grid
  infoGrid: {
    width: "100%",
    marginBottom: 30,
  },
  infoItem: {
    marginBottom: 16,
  },
  label: {
    fontSize: 20,
    color: "#1F3C88",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
    marginBottom: 6,
  },
  value: {
    fontSize: 18,
    color: "#1F3C88",
    backgroundColor: "#ADC5CE",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: "#1F3C88",
    borderRadius: 16,
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },

  // Logout Button
  logoutButton: {
    backgroundColor: "#1F3C88",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  logoutText: {
    color: "#FFFACD",
    fontSize: 22,
    textAlign: "center",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },
});
