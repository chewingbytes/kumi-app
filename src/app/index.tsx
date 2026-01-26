//mac http://192.168.1.127:4000
//http://192.168.0.203:4000/
//http://46.62.157.49/
import StudentCard from "../../components/StudentCard";
import { useFonts } from "@expo-google-fonts/dynapuff/useFonts";
import { DynaPuff_400Regular } from "@expo-google-fonts/dynapuff/400Regular";
import { DynaPuff_500Medium } from "@expo-google-fonts/dynapuff/500Medium";
import { DynaPuff_600SemiBold } from "@expo-google-fonts/dynapuff/600SemiBold";
import { DynaPuff_700Bold } from "@expo-google-fonts/dynapuff/700Bold";

import * as DocumentPicker from "expo-document-picker";
import { supabase } from "../../lib/supabase";
import Constants from "expo-constants";
const API = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE;
import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
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
  FlatList,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [successNotifications, setSuccessNotifications] = useState<
    { id: number; message: string; color: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [studentsDashboard, setStudentsDashboard] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStudents = useMemo(() => {
    return studentsDashboard.filter((e) =>
      e.student_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [studentsDashboard, searchQuery]);

  let [fontsLoaded] = useFonts({
    DynaPuff_400Regular,
    DynaPuff_500Medium,
    DynaPuff_600SemiBold,
    DynaPuff_700Bold,
  });

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

  const markParentNotified = (id) => {
    setStudentsDashboard((prev) =>
      prev.map((s) => (s.id === id ? { ...s, parent_notified: true } : s))
    );
  };

  const notificationTimeoutsRef = useRef<{ [key: number]: NodeJS.Timeout }>({});
  const notificationIdRef = useRef(0);

  useEffect(() => {
    return () => {
      Object.values(notificationTimeoutsRef.current).forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      notificationTimeoutsRef.current = {};
    };
  }, []);

  const postJSONWithBody = async (
    path: string,
    body: object,
    accessToken: string
  ) => {
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

  const fetchStudents = useCallback(async () => {
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
  }, []);

  const showSendingNotification = useCallback((studentName: string) => {
    const id = notificationIdRef.current++;
    const message = `Sending to ${studentName}'s parents...`;

    setSuccessNotifications([{ id, message, color: "#ECECEC" }]);

    const timeoutId = setTimeout(() => {
      setSuccessNotifications([]);
      delete notificationTimeoutsRef.current[id];
    }, 3000);

    notificationTimeoutsRef.current[id] = timeoutId;

    return id;
  }, []);

  const showSuccessNotification = useCallback(
    (studentName: string, result: boolean) => {
      const id = notificationIdRef.current++;

      const message = result
        ? `Message sent successfully to ${studentName}'s parents!`
        : "An error occurred";

      setSuccessNotifications([{ id, message, color: "#D4EDDA" }]);

      const timeoutId = setTimeout(() => {
        setSuccessNotifications([]);
        delete notificationTimeoutsRef.current[id];
      }, 3000);

      notificationTimeoutsRef.current[id] = timeoutId;
    },
    []
  );

  const sendWhatsappMessage = useCallback(async (name: string) => {
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
  }, []);

  const finishDay = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const accessToken = session?.access_token;
    const res = await postJSON("api/db/finish-day", accessToken);
    if (res?.error) Alert.alert("Error", res.error);
    else Alert.alert("Done", "Day finished and report sent.");
    setDropdownVisible(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchStudents();
    }, [fetchStudents])
  );

  const renderStudent = useCallback(
    ({ item }) => (
      <StudentCard
        //@ts-ignore
        entry={item}
        styles={styles}
        sendWhatsappMessage={sendWhatsappMessage}
        showSendingNotification={showSendingNotification}
        showSuccessNotification={showSuccessNotification}
        markParentNotified={markParentNotified}
        onNotify={async (student) => {
          showSendingNotification(student.student_name);
          const result = await sendWhatsappMessage(student.student_name);
          if (result) {
            showSuccessNotification(student.student_name, result);
            markParentNotified(student.id);
          }
        }}
      />
    ),
    [
      sendWhatsappMessage,
      showSendingNotification,
      showSuccessNotification,
      markParentNotified,
      styles,
    ]
  );

  if (!fontsLoaded) {
    return null;
  } else {
    return (
      <SafeAreaView style={[styles.container]}>
        <View style={styles.rowLayout}>
          <View style={styles.leftList}>
            <Text style={styles.infoTitle}>Student List</Text>
            <TextInput
              placeholder="Search student..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.input}
              placeholderTextColor="#888"
            />
            <FlatList
              data={loading ? [] : filteredStudents}
              renderItem={renderStudent} // use the memoized callback
              keyExtractor={(item) => item.id?.toString() || item.student_name}
              removeClippedSubviews={true} // Unmount off-screen items
              initialNumToRender={20} // Render first 20 items only
              maxToRenderPerBatch={20} // Batch render 20 items at a time
              windowSize={5} // Number of screens worth of content to render
              updateCellsBatchingPeriod={50} // Time between batch renders
              ListEmptyComponent={() =>
                loading ? (
                  <Text style={styles.noDataText}>Refreshing...</Text>
                ) : (
                  <SafeAreaView style={styles.loadingSafeArea}>
                    <Text>No students found.</Text>
                  </SafeAreaView>
                )
              }
            />
            <View style={styles.totalCountContainer}>
              <Text style={styles.totalCountText}>
                Total Students: {filteredStudents.length}
              </Text>
            </View>
          </View>

          {/* Hamburger Menu */}
          <View style={styles.rightContent}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setDropdownVisible(!dropdownVisible)}
            >
              <Text style={styles.hamburgerIcon}>☰</Text>
            </TouchableOpacity>

            {/* Center Content */}
            <View style={styles.centerContent}>
              <Image
                source={{
                  uri: "https://nlsggkzpooovjifqcbig.supabase.co/storage/v1/object/public/image_storage/kumon/kumon-vector-logo.png",
                }}
                style={styles.logo}
              />
              <Text style={styles.welcomeText}>
                Welcome to Kumon Punggol Plaza
              </Text>
            </View>

            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => router.replace("/scanner")}
            >
              <Text style={styles.scanText}>Scan</Text>
            </TouchableOpacity>
            {dropdownVisible && (
              <View style={styles.dropdownMenu}>
                <Pressable onPress={() => router.replace("/student-list")}>
                  <Text style={styles.dropdownItem}>Student List</Text>
                </Pressable>
                <Pressable onPress={() => router.replace("/profile")}>
                  <Text style={styles.dropdownItem}>My Profile</Text>
                </Pressable>
                {/* <Pressable onPress={() => router.push("/my-students")}>
                  <Text style={styles.dropdownItem}>My Students</Text>
                </Pressable> */}
                <Pressable
                  onPress={() => {
                    router.replace("/student-management");
                    setDropdownVisible(false);
                  }}
                >
                  <Text style={styles.dropdownItem}>Your Students</Text>
                </Pressable>
                {/* <Pressable
                  onPress={() => {
                    setModalVisible(true);
                    setDropdownVisible(false);
                  }}
                >
                  <Text style={styles.dropdownItem}>Add Students</Text>
                </Pressable> */}
                <Pressable
                  onPress={() => {
                    Alert.alert(
                      "Are you sure?",
                      "This will finish the day and email the attendance Excel report.",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Yes, proceed",
                          onPress: () => finishDay(),
                        },
                      ]
                    );
                    setDropdownVisible(false);
                  }}
                >
                  <Text style={styles.dropdownItem}>Finish the Day</Text>
                </Pressable>
              </View>
            )}
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
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#A7C7E7", // retro blue base
    alignItems: "center",
    justifyContent: "center",
  },

  dropdown: {
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 4,
    padding: 10,
    marginBottom: 16,
  },
  dropdownItem: {
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
    paddingVertical: 15,
    fontSize: 25,
    color: "#004A7C",
  },

  dropdownMenu: {
    position: "absolute",
    top: 60,
    right: 30,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#004A7C",
    elevation: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    zIndex: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },

  // Top-right hamburger
  menuButton: {
    position: "absolute",
    top: 20,
    right: 20,
  },
  hamburgerIcon: {
    fontSize: 28,
    color: "#1F3C88", // darker retro navy
  },

  // Center elements
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 350,
    height: 350,
    borderRadius: 300,
    borderColor: "#1F3C88",
    backgroundColor: "#EAF0FA",
  },
  welcomeText: {
    fontSize: 50,
    marginTop: 20,
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
    color: "#1F3C88",
    textAlign: "center",
  },
  scanButton: {
    marginTop: 30,
    backgroundColor: "#F2E9E4",
    width: "90%",
    paddingVertical: 30,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#1F3C88",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  scanText: {
    fontSize: 100,
    color: "#1F3C88",
    letterSpacing: 1,
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
    textAlign: "center",
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "#68AEB8", // golden retro background
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: 4,
    borderBottomColor: "#1F3C88",
  },
  modalTitle: {
    fontSize: 28,
    color: "#1F3C88",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1F3C88",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  modalCloseText: {
    color: "#fff",
    fontSize: 20,
  },
  modalContent: {
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  input: {
    borderWidth: 3,
    borderColor: "#1F3C88",
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 12,
    fontSize: 18,
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
    color: "#1F3C88",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  addButton: {
    backgroundColor: "#d4dffd",
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  addButtonText: {
    color: "#1F3C88",
    fontSize: 20,
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
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
  primaryButton: {
    backgroundColor: "#1F3C88",
    paddingVertical: 12,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  primaryButtonText: {
    color: "#fff",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
    fontSize: 18,
  },
  rowLayout: {
    flexDirection: "row",
    flex: 1,
    width: "100%",
  },

  leftList: {
    flex: 1,
    width: "25%",
    backgroundColor: "#F2E9E4",
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderColor: "#1F3C88",
    paddingVertical: 30,
    paddingHorizontal: 20,
    justifyContent: "flex-start",
  },

  listTitle: {
    fontSize: 26,
    color: "#1F3C88",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
    marginBottom: 20,
    textAlign: "left",
  },

  listItem: {
    backgroundColor: "#FFFACD",
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#1F3C88",
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },

  listName: {
    fontSize: 18,
    color: "#1F3C88",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },

  listNumber: {
    fontSize: 16,
    color: "#1F3C88",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },

  noStudents: {
    color: "#1F3C88",
    fontSize: 18,
    textAlign: "left",
    marginTop: 20,
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },

  rightContent: {
    flex: 3,
    width: "75%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#A7C7E7", // matches your base color
    position: "relative",
  },
  infoTitle: {
    fontFamily: "DynaPuff_500Medium", // or Dancing Script / Great Vibes
    fontSize: 28,
    color: "#1F3C88",
    marginBottom: 20,
  },

  infoLabel: {
    fontSize: 18,
    color: "#1F3C88",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },

  infoValue: {
    fontSize: 22,
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
    fontSize: 14,
    color: "#1F3C88",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },

  checkedIn: { color: "#59C1BD" },
  checkedOut: { color: "#C147E9" },

  in: {
    backgroundColor: "#CFF5E7",
    borderColor: "#59C1BD",
  },

  out: {
    backgroundColor: "#F7C8E0",
    borderColor: "#C147E9",
  },

  miniCard: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    backgroundColor: "#FFF5E4",
    borderColor: "#1F3C88",
  },
  miniCardName: {
    fontSize: 20,
    color: "#3B185F",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },

  button: {
    backgroundColor: "#33B5E5",
    borderRadius: 30,
    elevation: 5,
  },
  text: {
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },
  loadingSafeArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  totalCountContainer: {
    paddingTop: 12,
    borderTopWidth: 2,
    borderColor: "#1F3C88",
    marginTop: 12,
    alignItems: "flex-start",
  },

  totalCountText: {
    fontSize: 20,
    color: "#1F3C88",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },
  dropdownOption: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#1F3C88",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});
