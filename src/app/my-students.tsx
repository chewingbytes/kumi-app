//http://46.62.157.49/
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Dimensions,
  TouchableOpacity,
  Image,
} from "react-native";
import { supabase } from "../../lib/supabase";
import Constants from "expo-constants";

const API = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE;

export default function MyStudentsScreen() {
  const [studentsDashboard, setStudentsDashboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchStudents = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;

      const res = await fetch(API + "api/db/all-students", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const json = await res.json();
      if (json.error) throw new Error(json.error);

      setStudentsDashboard(json.students || []);
    } catch (error) {
      console.error("Error fetching students:", error.message);
      setStudentsDashboard([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  if (loading) {
    return (
      <SafeAreaView
        style={styles.loading}
        edges={["top", "bottom", "left", "right"]}
      >
        <ActivityIndicator size="large" color="#004A7C" />
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "bottom", "left", "right"]}
      >
        <View style={styles.container}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace("/")}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.card}>
            <Text style={styles.title}>Your Students</Text>

            <TextInput
              placeholder="Search students..."
              placeholderTextColor="#1F3C88"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {studentsDashboard && studentsDashboard.length === 0 ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: "flex-start",
                  alignItems: "center",
                  padding: 20,
                }}
              >
                <Image
                  source={{
                    uri: "https://nlsggkzpooovjifqcbig.supabase.co/storage/v1/object/public/image_storage/kumon/logoarm.png",
                  }}
                  style={{
                    width: 200,
                    height: 200,
                    marginBottom: 20,
                    borderRadius: 99,
                  }}
                  resizeMode="contain"
                />
                <Text
                  style={{
                    fontSize: 18,
                    marginBottom: 12,
                    color: "#333",
                    textAlign: "center",
                  }}
                >
                  You have no students yet, go add your first student!
                </Text>
                <TouchableOpacity
                  onPress={() => router.replace("/")}
                  style={{
                    backgroundColor: "#004A7C",
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 8,
                    elevation: 3,
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 16 }}>
                    Go to Dashboard
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView style={styles.studentList}>
                {studentsDashboard
                  .filter((s) =>
                    s.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((student, index) => (
                    <View style={styles.studentCard} key={index}>
                      <Text style={styles.studentTitle}>{student.name}</Text>

                      <View style={styles.subInfoGroup}>
                        <Text style={styles.subLabel}>Parent Id</Text>
                        <Text style={styles.subValue}>
                          {student.parents?.id || "N/A"}
                        </Text>
                      </View>

                      {/* <View style={styles.subInfoGroup}>
                        <Text style={styles.subLabel}>Parent Email</Text>
                        <Text style={styles.subValue}>
                          {student.parents?.phone_number || "N/A"}
                        </Text>
                      </View> */}
                    </View>
                  ))}
              </ScrollView>
            )}
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
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
    flex: 1,
    padding: 20,
    alignItems: "center",
  },

  // Back Button
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
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 18,
    color: "#1F3C88",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },

  // Card
  card: {
    width: "100%",
    backgroundColor: "#F2E9E4",
    borderRadius: 20,
    padding: 20,
    borderWidth: 3,
    borderColor: "#1F3C88",
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  title: {
    fontSize: 32,
    color: "#1F3C88",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },

  // Search Input
  searchInput: {
    borderWidth: 3,
    borderColor: "#1F3C88",
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    fontSize: 20,
    marginBottom: 16,
    backgroundColor: "#ADC5CE",
    color: "#1F3C88",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },

  // Empty State
  emptyState: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyImage: { width: 180, height: 180, marginBottom: 20 },
  emptyText: {
    fontSize: 20,
    color: "#1F3C88",
    textAlign: "center",
    marginBottom: 12,
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },
  emptyButton: {
    backgroundColor: "#1F3C88",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  emptyButtonText: {
    color: "#FFFACD",
    fontSize: 20,
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },

  // Student List
  studentList: {
    marginTop: 10,
    maxHeight: Dimensions.get("window").height * 0.6,
  },
  studentCard: {
    backgroundColor: "#ADC5CE",
    padding: 18,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#1F3C88",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  studentTitle: {
    fontSize: 28,
    color: "#1F3C88",
    marginBottom: 10,
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },
  subInfoGroup: { marginBottom: 6 },
  subLabel: {
    fontSize: 18,
    color: "#1F3C88",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },
  subValue: { fontSize: 18, color: "#1F3C88", fontFamily: "Courier" },
});
