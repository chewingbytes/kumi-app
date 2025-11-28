// MyStudentsScreen.js
import { useEffect, useRef, useState } from "react";
// import { toast } from "sonner-native";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
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
  Modal,
  Alert,
  Pressable,
  Platform,
  Animated,
} from "react-native";
import { supabase } from "../../lib/supabase";
import Constants from "expo-constants";

const API = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE;

export default function MyStudentsScreen() {
  const [studentsDashboard, setStudentsDashboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Add Student Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newParentNumber, setNewParentNumber] = useState("");
  const [students, setStudents] = useState([]);

  const [parentNumber, setParentNumber] = useState("");

  const [successNotifications, setSuccessNotifications] = useState<
    { id: number; message: string; color: string }[]
  >([]);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [pickedCSV, setPickedCSV] = useState(null);
  const [csvFileName, setCsvFileName] = useState(null);

  const notificationIdRef = useRef(0);

  const showStatusNotification = (message: string) => {
    const id = notificationIdRef.current++;

    setSuccessNotifications((prev) => [
      ...prev,
      { id, message, color: "#ECECEC" },
    ]);

    setTimeout(() => {
      setSuccessNotifications((prev) =>
        prev.filter((notif) => notif.id !== id)
      );
    }, 3000);

    return id; // return the id so we can remove/replace it later
  };

  const showSuccessNotification = (notificationString: string) => {
    const id = notificationIdRef.current++; // persist ID between renders
    const message = notificationString;

    setSuccessNotifications((prev) => [
      ...prev,
      { id, message, color: "#D4EDDA" },
    ]);

    // auto-hide after 3 seconds
    setTimeout(() => {
      setSuccessNotifications((prev) =>
        prev.filter((notif) => notif.id !== id)
      );
    }, 3000);
  };

  /** FETCH STUDENTS */
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

  const handlePickCSV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: Platform.OS === "android" ? "*/*" : "text/csv",
        copyToCacheDirectory: true,
      });

      if (
        result.canceled === false &&
        result.assets &&
        result.assets.length > 0
      ) {
        const fileAsset = result.assets[0];

        const file = {
          uri: fileAsset.uri,
          name: fileAsset.name,
          type: fileAsset.mimeType || "text/csv",
        };

        setPickedCSV(file); // Set your local file state
        setCsvFileName(file.name); // Optional: for display
      }
    } catch (err) {
      Alert.alert("Pick Error", err.message);
    }
  };

  const uploadPickedCSV = async () => {
    if (!pickedCSV) {
      console.log("No file picked!");
      return Alert.alert("No file", "Please pick a CSV file first.");
    }

    setUploading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      // Convert blob URI to File object
      const response = await fetch(pickedCSV.uri);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append(
        "file",
        new File([blob], pickedCSV.name, { type: pickedCSV.type })
      );

      const res = await fetch(API + "api/db/upload-csv", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const json = await res.json();
      setUploading(false);
      setPickedCSV(null);
      setCsvFileName(null);

      if (json.error) {
        Alert.alert("Upload Error", json.error);
      } else {
        // toast("CSV uploaded and processed!");
        fetchStudents();
        setShowAddModal(false);
      }
    } catch (err) {
      setUploading(false);
      Alert.alert("Error", err.message);
    }
  };

  const openEditModal = (student) => {
    console.log("OPEN EDIT MODAL");

    setEditingStudent(student);

    setParentNumber(student.parents?.phone_number?.toString() || "");

    setShowEditModal(true);
  };

  const addStudent = () => {
    const name = newStudentName.trim();
    const number = newParentNumber.trim();

    if (!name || !number) {
      showStatusNotification("Name and number required.");
      return;
    }

    const phoneRegex = /^\d{8}$/; // exactly 8 digits
    if (!phoneRegex.test(newParentNumber)) {
      showStatusNotification(
        "Please enter a valid 8-digit Singaporean phone number."
      );
      return;
    }

    setStudents((prev) => [...prev, { name: name, parentNumber: number }]);
    setNewStudentName("");
    setNewParentNumber("");
  };

  const submitStudents = async () => {
    showStatusNotification(`Adding new students...`);
    if (!students.length) {
      showSuccessNotification(`No students to add`);
      return;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;

      console.log("SNEDING REQUEST:", API + "api/db/students");

      const res = await fetch(API + "api/db/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ students }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      setStudents([]);
      setShowAddModal(false);
      showSuccessNotification(`Successfully added new students!`);
      fetchStudents();
    } catch (err) {
      showSuccessNotification(`Failed to add new students`);
    }
  };

  /** SAVE EDITED STUDENT */
  const saveEditedStudent = async () => {
    try {
      showStatusNotification(`Updating ${editingStudent.name}...`);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;

      // Send updated student info to backend
      const res = await fetch(API + "api/db/update-student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          id: editingStudent.id,
          parent_id: editingStudent.parent_id,
          name: editingStudent.name,
          parent_number: parentNumber, // send the updated parent number
        }),
      });

      const json = await res.json();
      if (json.error) throw new Error(json.error);

      setStudentsDashboard((prev) =>
        prev.map((s) =>
          s.id === editingStudent.id
            ? {
                ...s,
                name: editingStudent.name,
                parents: {
                  ...s.parents,
                  phone_number: parentNumber,
                },
              }
            : s
        )
      );

      showSuccessNotification(`Successfully Updated ${editingStudent.name}!`);
      setShowEditModal(false);
    } catch (err) {
      showSuccessNotification(`Failed to Updated ${editingStudent.name}!`);
    }
  };

  /** OPEN DELETE POPUP */
  const askDeleteStudent = (student) => {
    setStudentToDelete(student);
    setShowDeleteModal(true);
  };

  /** DELETE STUDENT CONFIRM */
  const deleteStudent = async () => {
    try {
      showStatusNotification(`Deleting ${studentToDelete.name}...`);
      if (!studentToDelete) return;

      console.log("STUDENT TO DELTE OBJECT:", studentToDelete);

      console.log("ID:", studentToDelete.id);
      console.log("aprent ID:", studentToDelete.parent_id);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;

      const res = await fetch(API + "api/db/delete-student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          student_id: studentToDelete.id,
          parent_id: studentToDelete.parent_id,
        }),
      });

      const json = await res.json();
      if (json.error) throw new Error(json.error);

      setStudentsDashboard((prev) =>
        prev.filter((s) => s.id !== studentToDelete.id)
      );

      setShowDeleteModal(false);
      setStudentToDelete(null);

      showSuccessNotification(`Successfully deleted ${studentToDelete.name}!`);
    } catch (err) {
      showSuccessNotification(`Failed to delete ${studentToDelete.name}!`);
    }
  };

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
      <SafeAreaView style={styles.safeArea}>
        {/* BACK */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/")}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          {/* Top-right Add Button */}
          <TouchableOpacity
            style={styles.addButtonTop}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.addButtonText}>+ Add Student</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.title}>Your Students</Text>

            <TextInput
              placeholder="Search students..."
              placeholderTextColor="#1F3C88"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <ScrollView style={styles.studentList}>
              {studentsDashboard
                .filter((s) =>
                  s.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((student) => {
                  return (
                    <View style={styles.studentCard} key={student.id}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.studentTitle}>{student.name}</Text>

                        <View style={styles.subInfoGroup}>
                          <Text style={styles.subLabel}>Parent Id</Text>
                          <Text style={styles.subValue}>
                            {student.parent_id || "N/A"}
                          </Text>
                        </View>
                      </View>

                      {/* ACTION BUTTONS */}
                      <View style={styles.actionBox}>
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => openEditModal(student)}
                        >
                          <Text style={styles.editText}>Edit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => askDeleteStudent(student)}
                        >
                          <Text style={styles.deleteText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>

      {/* EDIT MODAL */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Edit Student</Text>

            <TextInput
              style={styles.input}
              value={editingStudent?.name}
              onChangeText={(txt) =>
                setEditingStudent((prev) => ({ ...prev, name: txt }))
              }
            />
            <TextInput
              style={styles.input}
              value={parentNumber}
              onChangeText={setParentNumber}
              placeholder="Parent Number"
            />

            <View style={styles.editButtonRow}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={saveEditedStudent}
              >
                <Text style={styles.primaryButtonText}>Save Changes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.deleteBox}>
            <Text style={styles.deleteTitle}>Delete Student?</Text>
            <Text style={styles.deleteText}>This action cannot be undone.</Text>

            <View style={styles.deleteActions}>
              <TouchableOpacity
                style={styles.cancelButtonSmall}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelSmallText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButtonRed}
                onPress={deleteStudent}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ADD STUDENT MODAL */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Student</Text>

            {/* Student Name */}
            <TextInput
              placeholder="Student Name"
              value={newStudentName}
              onChangeText={setNewStudentName}
              style={styles.modalInput}
              placeholderTextColor="#555"
            />

            {/* Parent Number */}
            <TextInput
              placeholder="Parent Number (8 digits)"
              value={newParentNumber}
              onChangeText={setNewParentNumber}
              keyboardType="numeric"
              style={styles.modalInput}
              placeholderTextColor="#555"
            />

            {/* Button Row */}
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.addButtonTop]}
                onPress={addStudent}
              >
                <Text style={[styles.addButtonText]}>Add</Text>
              </TouchableOpacity>
            </View>

            {students.length > 0 &&
              students.map((s, i) => (
                <View key={i} style={styles.studentItem}>
                  <View style={styles.studentRow}>
                    <View>
                      <Text style={styles.studentName}>{s.name}</Text>
                      <Text style={styles.studentParentLabel}>
                        Number: {s.parentNumber}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() =>
                        setStudents((prev) =>
                          prev.filter((_, idx) => idx !== i)
                        )
                      }
                    >
                      <Text style={styles.removeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

            {/* CSV & Submit Buttons */}
            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.uploadCSVButton, { flex: 1 }]}
                onPress={pickedCSV ? uploadPickedCSV : handlePickCSV}
                disabled={uploading}
              >
                <Text style={styles.uploadCsvText}>
                  {uploading
                    ? "Uploading..."
                    : pickedCSV
                    ? `Upload: ${csvFileName}`
                    : "Import CSV"}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, { flex: 1 }]}
                onPress={submitStudents}
              >
                <Text style={styles.primaryButtonText}>Submit</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
              backgroundColor: notif.color,
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
                fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
                color: "#155724",
              }}
            >
              {notif.message}
            </Text>
          </Animated.View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  addButtonTop: {
    zIndex: 10,
    borderRadius: 20,
    backgroundColor: "#1F3C88",
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  addButtonText: {
    fontSize: 18,
    color: "#F2E9E4",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },

  /* Modal shared styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "50%",
    backgroundColor: "white",
    padding: 22,
    borderRadius: 14,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 15,
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  modalButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: "center",
  },
  modalBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },

  safeArea: {
    flex: 1,
    backgroundColor: "#A7C7E7",
  },

  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 20,
    paddingHorizontal: 20,
  },

  container: {
    flex: 1,
    padding: 20,
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F8FF",
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

  card: {
    flex: 1,
    width: "100%",
    backgroundColor: "#F2E9E4",
    borderRadius: 20,
    paddingHorizontal: 20,
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
    marginVertical: 20,
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },

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

  studentList: {
    flex: 1,
    marginTop: 4,
    width: "100%",
  },

  studentCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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

  subInfoGroup: {
    marginTop: 2,
  },
  subLabel: {
    fontSize: 18,
    color: "#1F3C88",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },
  subValue: { fontSize: 18, color: "#1F3C88", fontFamily: "Courier" },

  // Right-side edit/delete buttons
  actionBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginLeft: 10,
  },

  editButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#E7F0FF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#A8C7FF",
  },
  editText: {
    color: "#1F3C88",
    fontSize: 14,
    fontWeight: "600",
  },

  deleteButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#FFEAEA",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFB5B5",
  },
  deleteText: {
    color: "#B30000",
    fontSize: 14,
    fontWeight: "600",
  },

  modalBox: {
    width: "50%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 14,
    maxWidth: "50%",
    elevation: 5,
  },

  input: {
    borderWidth: 1,
    borderColor: "#AFC8FF",
    backgroundColor: "#F5F9FF",
    padding: 12,
    borderRadius: 10,
    fontSize: 15,
    color: "#002766",
    marginBottom: 16,
  },

  primaryButton: {
    borderWidth: 3,
    borderColor: "#1F3C88",
    backgroundColor: "#F2E9E4",
    padding: 12,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },

  primaryButtonText: {
    textAlign: "center",
    color: "#1F3C88",
    fontWeight: "700",
    fontSize: 16,
  },

  cancelButton: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#E8ECF7",
  },
  cancelButtonText: {
    textAlign: "center",
    fontSize: 15,
    fontWeight: "600",
    color: "#1F3C88",
  },

  // Delete modal box
  deleteBox: {
    width: "50%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 14,
  },
  deleteTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#B30000",
    marginBottom: 6,
  },
  deleteActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },
  cancelButtonSmall: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#E8ECF7",
    borderRadius: 8,
  },
  cancelSmallText: {
    color: "#1F3C88",
    fontSize: 14,
    fontWeight: "600",
  },
  deleteButtonRed: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#FF4D4D",
    borderRadius: 8,
  },
  deleteButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  pageTitle: {
    flex: 1,
    fontSize: 28,
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
    color: "#1F3C88",
    textAlign: "center",
    marginRight: 40, // ensures back button doesn't overlap
  },
  editButtonRow: {
    display: "flex",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pendingRow: {
    padding: 8,
    backgroundColor: "#eef5ff",
    borderRadius: 6,
    marginTop: 4,
  },

  submitBtn: {
    backgroundColor: "green",
    paddingVertical: 12,
    marginTop: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  submitBtnText: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
  },

  closeBtn: {
    marginTop: 12,
    padding: 10,
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: 16,
    color: "red",
    fontWeight: "600",
  },
  studentItem: {
    backgroundColor: "#FFFACD",
    borderWidth: 3,
    borderColor: "#1F3C88",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  studentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  studentName: {
    fontSize: 20,
    color: "#1F3C88",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },
  studentParentLabel: {
    fontSize: 16,
    color: "#1F3C88",
    marginTop: 4,
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1F3C88",
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    color: "#fff",
    fontSize: 18,
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 20,
    columnGap: 16,
  },
  uploadCSVButton: {
    backgroundColor: "#FFFACD",
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: "#1F3C88",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  uploadCsvText: {
    color: "#1F3C88",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },
});
