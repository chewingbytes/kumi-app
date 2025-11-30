//mac http://192.168.1.127:4000
//http://192.168.0.203:4000/
import * as DocumentPicker from "expo-document-picker";
import { supabase } from "../../lib/supabase";
import Constants from "expo-constants";
const API = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE;
import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Pressable,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  TouchableOpacity,
  Image,
  ImageBackground,
  ActivityIndicator,
  Animated,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function StudentListScreen() {
  const [studentsDashboard, setStudentsDashboard] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [manualSelect, setManualSelect] = useState(false); // track if user clicked
  const [menuOpen, setMenuOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [successNotifications, setSuccessNotifications] = useState<
    { id: number; message: string }[]
  >([]);

  const handleDeleteStudent = async (studentId) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      Alert.alert("Delete Record", "Are you sure?", [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => setIsProcessing(false),
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(API + `api/db/${studentId}`, {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
              });

              const json = await res.json();
              if (json.error) throw new Error(json.error);

              Alert.alert("Deleted", json.message);
              setSelectedStudent(null);
              await fetchStudents();
            } catch (err) {
              Alert.alert("Error", err.message);
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]);
    } catch (err) {
      Alert.alert("Error", err.message);
      setIsProcessing(false);
    }
  };

  const sendWhatsappMessage = async (name: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;

      if (!accessToken) {
        Alert.alert("Error", "No access token found. Please log in again.");
        return;
      }

      const res = await postJSONWithBody(
        "api/db/sendMessage",
        { name },
        accessToken
      );
      console.log("REESS:", res);

      if (res === false) {
        return false;
      } else if (res === true) {
        return true;
      }
    } catch (err) {
      console.error("sendWhatsappMessage error:", err);
      Alert.alert("Error", "Something went wrong while sending the message.");
      return false;
    }
  };

  useEffect(() => {
    if (studentsDashboard.length > 0 && !manualSelect) {
      setSelectedStudent(studentsDashboard[studentsDashboard.length - 1]);

      console.log("STUDENTSDAHSBORD:", studentsDashboard);
    }
  }, [studentsDashboard, manualSelect]);

  const postJSONWithBody = async (
    path: string,
    body: object,
    accessToken: string
  ) => {
    console.log("querying:", path);
    console.log("with body:", body);
    console.log("querying th efucking shit:", API + path);
    console.log("TEOKEN:", accessToken);
    const res = await fetch(API + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    return res.json();
  };

  const postJSON = async (path: string, accessToken: string) => {
    const res = await fetch(API + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return res.json();
  };

  const fetchStudents = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;

      const res = await fetch(API + "api/db/students", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setStudentsDashboard(json.students);
    } catch (error) {
      console.error("Error fetching students:", error.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStudents();
    }, [])
  );

  const notificationIdRef = useRef(0);

  const showSendingNotification = (studentName: string) => {
    const id = notificationIdRef.current++;
    const message = `Sending to ${studentName}'s parents...`;

    setSuccessNotifications((prev) => [...prev, { id, message }]);

    setTimeout(() => {
      setSuccessNotifications((prev) =>
        prev.filter((notif) => notif.id !== id)
      );
    }, 3000);

    return id; // return the id so we can remove/replace it later
  };

  const showSuccessNotification = (studentName: string, result: boolean) => {
    const id = notificationIdRef.current++; // persist ID between renders
    const message =
      result === true
        ? `Message sent successfully to ${studentName}'s parents!`
        : "An error occurred";

    setSuccessNotifications((prev) => [...prev, { id, message }]);

    // auto-hide after 3 seconds
    setTimeout(() => {
      setSuccessNotifications((prev) =>
        prev.filter((notif) => notif.id !== id)
      );
    }, 3000);
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "bottom", "left", "right"]}
    >
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/")}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Student List</Text>
        </View>

        {/* Main Content */}
        <View style={styles.mainRow}>
          {/* Left Panel */}
          <View style={styles.leftPanel}>
            <TextInput
              placeholder="Search student..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.input}
              placeholderTextColor="#888"
            />

            <ScrollView
              contentContainerStyle={{ paddingBottom: 20 }}
              style={{ flex: 1 }}
            >
              {studentsDashboard && studentsDashboard.length > 0 ? (
                [...studentsDashboard]
                  .filter((e) =>
                    e.student_name
                      ?.toLowerCase()
                      .includes(searchQuery.toLowerCase())
                  )
                  .map((entry, idx) => (
                    <Pressable
                      key={idx}
                      style={[
                        styles.card,
                        entry.status === "checked_in" ? styles.in : styles.out,
                      ]}
                      onPress={() => {
                        setSelectedStudent(entry);
                        setManualSelect(true);
                      }}
                    >
                      <View>
                        <View>
                          <Text
                            style={[
                              styles.cardTitle,
                              selectedStudent?.id === entry.id &&
                                styles.selectedUnderline,
                            ]}
                          >
                            {entry.student_name}{" "}
                          </Text>

                          <Text
                            style={[
                              styles.statusText,
                              entry.status === "checked_in"
                                ? styles.checkedIn
                                : styles.checkedOut,
                            ]}
                          >
                            {entry.status === "checked_in"
                              ? "Checked In"
                              : "Checked Out"}
                          </Text>
                        </View>
                      </View>

                      {selectedStudent === entry.id && (
                        <View
                          style={{
                            position: "absolute",
                            top: 45,
                            right: 15,
                            backgroundColor: "#fff",
                            borderColor: "#1F3C88",
                            borderWidth: 3,
                            borderRadius: 8,
                            zIndex: 1000,
                          }}
                        >
                          <Pressable
                            disabled={isProcessing}
                            onPress={() => {
                              if (!isProcessing)
                                handleDeleteStudent(selectedStudent.student_id);
                            }}
                            style={{
                              padding: 10,
                              borderRadius: 4,
                              backgroundColor: "#B00020",
                              opacity: isProcessing ? 0.5 : 1,
                            }}
                          >
                            <Text
                              style={{
                                color: "#fff0f0",
                                fontFamily: "DynaPuff_400Regular",
                              }}
                            >
                              Delete Record
                            </Text>
                          </Pressable>
                        </View>
                      )}

                      {entry.status === "checked_out" ? (
                        <TouchableOpacity
                          style={[
                            styles.button,
                            { marginTop: 10, paddingVertical: 8 },
                          ]}
                          onPress={async () => {
                            showSendingNotification(entry.student_name);

                            const result = await sendWhatsappMessage(
                              entry.student_name
                            );

                            if (result) {
                              showSuccessNotification(
                                entry.student_name,
                                result
                              );
                              await fetchStudents(); // refresh dashboard to update parent_notified
                            } else {
                              Alert.alert(
                                "Error",
                                `Failed to send message to ${entry.student_name}'s parents.`
                              );
                            }
                          }}
                        >
                          <Text style={styles.text}>
                            {entry.parent_notified ? "Notify Again" : "Notify"}
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </Pressable>
                  ))
              ) : (
                <SafeAreaView style={styles.loadingSafeArea}>
                  <Text>No students found.</Text>
                </SafeAreaView>
              )}
            </ScrollView>

            <View style={styles.totalCountContainer}>
              <Text style={styles.totalCountText}>
                Total Students: {studentsDashboard.length}
              </Text>
            </View>
          </View>

          {/* Right Panel */}
          <View style={styles.rightPanel}>
            {selectedStudent ? (
              <View style={[styles.infoCard, { flex: 1 }]}>
                {/* Hamburger Menu */}
                <Pressable
                  onPress={() => setMenuOpen(!menuOpen)}
                  style={{
                    position: "absolute",
                    top: 15,
                    right: 15,
                    zIndex: 10,
                  }}
                >
                  <Text style={{ fontSize: 28, color: "#1F3C88" }}>≡</Text>
                </Pressable>

                {menuOpen && (
                  <View
                    style={{
                      position: "absolute",
                      top: 55,
                      right: 15,
                      backgroundColor: "#fff",
                      borderColor: "#1F3C88",
                      borderWidth: 3,
                      borderRadius: 8,
                      zIndex: 1000,
                    }}
                  >
                    <Pressable
                      onPress={() => {
                        setMenuOpen(false);
                        handleDeleteStudent(selectedStudent.student_id);
                      }}
                      style={{
                        padding: 15,
                        borderRadius: 4,
                        backgroundColor: "#B00020",
                      }}
                    >
                      <Text
                        style={{
                          color: "#fff0f0",
                          fontFamily: "DynaPuff_400Regular",
                          fontSize: 20,
                        }}
                      >
                        Delete Record
                      </Text>
                    </Pressable>
                  </View>
                )}

                <Text style={styles.infoTitle}>Info Card</Text>

                <View style={styles.infoSection}>
                  <Text style={styles.infoLabel}>Name:</Text>
                  <Text style={styles.infoValue}>
                    {selectedStudent.student_name}
                  </Text>
                </View>

                <View style={styles.infoSection}>
                  <Text style={styles.infoLabel}>Current Status:</Text>
                  <Text style={styles.infoValue}>
                    {selectedStudent.status === "checked_in"
                      ? "Checked In"
                      : "Checked Out"}
                  </Text>
                </View>

                <View style={styles.infoSection}>
                  <Text style={styles.infoLabel}>Parents Notified:</Text>
                  <Text style={styles.infoValue}>
                    {selectedStudent.parent_notified ? "✅ Yes" : "❌ No"}
                  </Text>
                </View>

                <View style={styles.infoSection}>
                  <Text style={styles.infoLabel}>Date:</Text>
                  <Text style={styles.infoValue}>
                    {new Date(selectedStudent.checkin_time).toLocaleDateString(
                      "en-SG"
                    )}
                  </Text>
                </View>

                <View style={styles.infoSection}>
                  <Text style={styles.infoLabel}>Checked In:</Text>
                  <Text style={styles.infoValue}>
                    {new Date(selectedStudent.checkin_time).toLocaleTimeString(
                      "en-SG"
                    )}
                  </Text>
                </View>

                {selectedStudent.checkout_time && (
                  <View style={styles.infoSection}>
                    <Text style={styles.infoLabel}>Checked Out:</Text>
                    <Text style={styles.infoValue}>
                      {new Date(
                        selectedStudent.checkout_time
                      ).toLocaleTimeString("en-SG")}
                    </Text>
                  </View>
                )}

                {selectedStudent.time_spent && (
                  <View style={styles.infoSection}>
                    <Text style={styles.infoLabel}>Time Spent:</Text>
                    <Text style={styles.infoValue}>
                      {selectedStudent.time_spent} mins
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.noDataText}>
                Select a student to see details
              </Text>
            )}
          </View>
        </View>
      </View>
      <View
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          zIndex: 99999,
        }}
      >
        {successNotifications.map((notif, index) => (
          <Animated.View
            key={index}
            style={{
              marginTop: index * 10, // stack them vertically
              width: 280,
              backgroundColor: "#D4EDDA",
              borderColor: "#155724",
              borderWidth: 2,
              borderRadius: 12,
              padding: 16,
              shadowColor: "#000",
              shadowOffset: { width: 2, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontFamily: "Courier-Bold",
                color: "#155724",
              }}
            >
              {notif.message}
            </Text>
          </Animated.View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingSafeArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#A7C7E7",
  },
  container: {
    padding: 20,
  },

  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 20,
    paddingLeft: 20,
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

  input: {
    borderWidth: 3,
    borderColor: "#1F3C88",
    borderRadius: 10,
    padding: 18,
    marginBottom: 18,
    backgroundColor: "#FFF5E4",
    fontSize: 20,
    color: "#3B185F",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },

  card: {
    display: "flex",
    justifyContent: "space-between",
    flexDirection: "row",
    padding: 24,
    borderRadius: 16,
    marginBottom: 18,
    borderWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 7,
  },

  in: {
    backgroundColor: "#CFF5E7",
    borderColor: "#59C1BD",
  },

  out: {
    backgroundColor: "#F7C8E0",
    borderColor: "#C147E9",
  },

  cardTitle: {
    fontSize: 28,
    color: "#3B185F",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },

  cardDetail: {
    fontSize: 18,
    marginTop: 6,
    color: "#3B185F",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },

  primaryButton: {
    backgroundColor: "#3B185F",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 10,
    borderWidth: 2,
    borderColor: "#FEC260",
  },

  primaryButtonText: {
    color: "#FEC260",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
    textTransform: "uppercase",
  },

  uploadCSVButton: {
    backgroundColor: "#FFF5E4",
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#3B185F",
    alignItems: "center",
    marginVertical: 10,
  },

  uploadCsvText: {
    color: "#3B185F",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },

  secondaryButton: {
    backgroundColor: "#FDEEDC",
    borderWidth: 2,
    borderColor: "#3B185F",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 10,
  },

  secondaryButtonText: {
    color: "#3B185F",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },

  dropdown: {
    backgroundColor: "#FFF5E4",
    borderRadius: 12,
    elevation: 6,
    padding: 12,
    borderWidth: 2,
    borderColor: "#3B185F",
  },

  dropdownItem: {
    paddingVertical: 12,
    fontSize: 18,
    color: "#3B185F",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "#FFF5E4",
    padding: 20,
    borderTopWidth: 4,
    borderColor: "#3B185F",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  modalTitle: {
    fontSize: 26,
    color: "#3B185F",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },

  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FEC260",
    justifyContent: "center",
    alignItems: "center",
  },

  modalCloseText: {
    color: "#3B185F",
    fontSize: 18,
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },

  addButton: {
    backgroundColor: "#59C1BD",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#3B185F",
  },

  addButtonText: {
    color: "#FFF5E4",
    fontSize: 20,
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },

  studentItem: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 14,
    backgroundColor: "#FFF5E4",
    borderWidth: 3,
    borderColor: "#3B185F",
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },

  studentName: {
    fontSize: 22,
    color: "#3B185F",
    marginBottom: 6,
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },

  studentParentLabel: {
    fontSize: 16,
    color: "#3B185F",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },

  mainRow: {
    flex: 1,
    flexDirection: "row",
    padding: 20,
    gap: 20,
  },

  leftPanel: {
    flex: 7,
    backgroundColor: "#FFF5E4",
    borderRadius: 12,
    borderWidth: 3,
    borderColor: "#1F3C88",
    padding: 16,
  },

  rightPanel: {
    flex: 3,
    flexDirection: "column",
    height: "100%",
    backgroundColor: "#FFF5E4",
    borderRadius: 12,
    borderWidth: 3,
    borderColor: "#1F3C88",
    padding: 20,
  },

  infoCard: {
    width: "100%",
    height: "100%",
    padding: 18,
    backgroundColor: "#FFF5E4",
  },

  infoTitle: {
    fontSize: 28,
    color: "#1F3C88",
    marginBottom: 20,
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },

  infoLabel: {
    fontSize: 10,
    color: "#1F3C88",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },

  infoValue: {
    fontSize: 20,
    color: "#1F3C88",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },

  noDataText: {
    fontSize: 18,
    color: "#1F3C88",
    marginTop: 20,
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },

  statusText: {
    fontSize: 16,
    color: "#1F3C88",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },

  checkedIn: { color: "#59C1BD" },
  checkedOut: { color: "#C147E9" },

  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#C147E9",
    justifyContent: "center",
    alignItems: "center",
  },

  removeButtonText: {
    color: "#FFF5E4",
    fontSize: 18,
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },
  selectedUnderline: {
    textDecorationLine: "underline",
    textDecorationColor: "#004A7C", // choose your color
    textDecorationStyle: "solid",
  },

  button: {
    backgroundColor: "#33B5E5",
    paddingVertical: 8,
    paddingHorizontal: 32,
    borderRadius: 30,
    elevation: 5,
  },
  text: {
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },

  totalCountContainer: {
    paddingTop: 12,
    borderTopWidth: 2,
    borderColor: "#1F3C88",
    marginTop: 8,
    alignItems: "flex-start",
  },

  totalCountText: {
    fontSize: 20,
    color: "#1F3C88",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },
  infoSection: {
    borderBottomWidth: 1,
    borderColor: "#1F3C88",
    paddingTop: 20,
  },
});
