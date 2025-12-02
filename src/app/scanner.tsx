import Constants from "expo-constants";
import { createAudioPlayer, useAudioPlayer } from "expo-audio";
const API = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE;
import { useCallback, useRef } from "react";
import { useState, useEffect } from "react";
import {
  Dimensions,
  Alert,
  Vibration,
  TouchableOpacity,
  Animated,
  Pressable,
  ScrollView,
} from "react-native";
import { Camera, CameraView, CameraType } from "expo-camera";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Buffer } from "buffer";
global.Buffer = global.Buffer || Buffer;
import { supabase } from "../../lib/supabase";

const audioSource = {
  uri: "https://nlsggkzpooovjifqcbig.supabase.co/storage/v1/object/public/image_storage/dontdelete/ringwav.wav",
};

const TEST_STUDENTS = [
  "OH CHARMIAN",
  "SHAJITHA MEHRIN SHAHUL",
  "JASPER KOH",
  "HANAN RAISSA HAIKAL",
  "KAUSHI GAUR",
  "AIZEN NAHYAAN MUZTAQQIM NABIL",
  "RAPHAEL LIM ZHI HENG",
  "OLIVIA NAVA NAVARATTINAM",
  "ADHRITH LOKESH",
  "ASHRITH LOKESH",
  "AMITH LATIKE",
  "ADELINE LIM XIN YUAN",
  "KYLE WONG KAI XIAN",
  "KRISTIAN SEAH",
  "NAITHIK MIHAN",
  "WOO SHI ZHENG JULIUS",
  "JEANETTE EE YUE NING",
  "AAVYA NAIR",
  "SATHVIK PALLARLA",
  "CHEE ZHENG YU JAVIER",
  "ALYSSA GRACE ONG",
  "BHUMI BAISA",
  "AKASH BAISA",
  "TRICIA LEE YEE CHEN",
  "BOLLEBALLI NIHIRA",
  "IFRAH NAJIAH",
  "TARA DESITA CHIA",
  "HE XIANG YI",
  "ZENITH KHOO KHANG ZHI",
  "AFFAN AFIQ",
  "LUKE JEVON CONCEICAO",
  "KENTO LOO LI XUAN",
  "ARYAN KOYYA",
  "THARSNAVEE MATHAN PRASATH",
  "KAI SUBRATA",
  "MATHEW JOSH",
  "KHABIR ABDUL BIN MOHAMED HAFRIZ",
  "SHAWN JIANG MINGZHE",
  "SWASTHIKA MADHU",
  "WANG MIAOZHU",
  "CAELYN TEO",
  "TANISHI MAITY",
  "IMTIYAZ MUADZ BIN PUTERA MUHAMMAD ALI",
  "EHSAN WALI BIN MUHAMMAD FADLY",
  "ASHLYN NIU XUAN TING",
  "AARAV VATSA",
  "MINHAB WARRITH KHAN",
  "ANANYA KARTHIK",
  "BHAVYANSH YASAM",
  "TAN XUAN YING",
  "JENNA TEO",
  "DEENA DESMUND",
  "RESHVIN PRADYUSH",
  "YAPARLA SKANDHA YASASHWI REDDY",
  "LEE ZI XUAN",
  "HEENAYA CHANDRAKAR",
  "SOFIA ADRIANNA",
  "PANVITH TAARAK PALADUGU",
  "LUKAS ONGGARA",
  "ANJANA RAMESH",
  "WANG ANDI",
  "DANIEL TEH",
  "DHYAN ARADHYA",
  "AVIRA BOOMINATHAN",
  "ANGELA ZHANG",
  "KEONNA CHENG JIA XUAN",
  "TENG YONG JYU",
  "HUANG JIALE",
  "CINO ESTELLE MARY",
  "ONA NEO",
  "WANG YOU",
  "SAANVI SREEJITH",
  "REYERS POH",
  "CHAN XIN YAN",
  "ARYAN MODANI",
  "LING RUI XIANG",
  "MISHRA DISHANT",
  "ARYAN YUNUS",
];

console.log("API:", API);
const postJSON = async (path: string, body: object, accessToken: string) => {
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

const getJSON = async (path: string, accessToken: string) => {
  const res = await fetch(API + path, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return res.json();
};

interface QRData {
  name: string;
  parent_number: string;
}

const QRScanner: React.FC = () => {
  const player = useAudioPlayer(audioSource);

  const [animationText, setAnimationText] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [hasCameraPermission, setCameraPermission] = useState<boolean | null>(
    null
  );
  const [hasAudioPermission, setAudioPermission] = useState<boolean | null>(
    null
  );

  const [facing, setFacing] = useState<CameraType>("front");

  const cameraRef = useRef<CameraView | null>(null);

  const [scanned, setScanned] = useState(false);

  const lastScannedTimeStampRef = useRef(0);

  //   const [autoTestRunning, setAutoTestRunning] = useState(false);
  // const autoCheckRef = useRef<NodeJS.Timer | null>(null);

  // const startAutoCheckIn = () => {
  //   if (autoCheckRef.current) return; // prevent double starting

  //   console.log("🚀 Auto check-in test started…");
  //   setAutoTestRunning(true);

  //   // Start the interval loop
  //   autoCheckRef.current = setInterval(() => {
  //     const randomName =
  //       TEST_STUDENTS[Math.floor(Math.random() * TEST_STUDENTS.length)];

  //     console.log("Checking in:", randomName);
  //     handleCheckIn(randomName);
  //   }, 1000); // every 1s

  //   // Auto-stop after 1 minute
  //   setTimeout(() => {
  //     console.log("⏱️ Auto check-in stopped automatically after 1 minute");
  //     stopAutoCheckIn();
  //   }, 7 * 60 * 1000);
  // };

  // const stopAutoCheckIn = () => {
  //   if (autoCheckRef.current) {
  //     clearInterval(autoCheckRef.current);
  //     autoCheckRef.current = null;
  //   }
  //   console.log("🛑 Auto check-in test stopped");
  //   setAutoTestRunning(false);
  // };

  // // Cleanup when component unmounts
  // useEffect(() => {
  //   return () => stopAutoCheckIn();
  // }, []);

  // const fetchStudents = useCallback(async () => {
  //   try {
  //     setLoading(true);

  //     const {
  //       data: { session },
  //     } = await supabase.auth.getSession();

  //     const accessToken = session?.access_token;

  //     const res = await fetch(API + "api/db/students", {
  //       method: "GET",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${accessToken}`,
  //       },
  //     });

  //     const json = await res.json();
  //     if (json.error) throw new Error(json.error);

  //     console.log("✅ Refreshed students:", json.students);
  //     setStudentsDashboard(json.students);
  //   } catch (error: any) {
  //     console.error("Error fetching students:", error.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // }, []);

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  useEffect(() => {
    const requestPermissions = async () => {
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      const audioPermission = await Camera.requestMicrophonePermissionsAsync();

      setCameraPermission(cameraPermission.status === "granted");
      setAudioPermission(audioPermission.status === "granted");
    };

    requestPermissions();
  }, []);

  useEffect(() => {
    if (hasCameraPermission !== null && hasAudioPermission !== null) {
      // Check permissions and execute logic when both permissions are set
      if (!hasCameraPermission || !hasAudioPermission) {
        Alert.alert(
          "Camera Permissions Required",
          "You must grant access to your camera to scan QR codes",
          [
            { text: "Go to settings", onPress: goToSettings },
            {
              text: "Cancel",
              onPress: () => {
                router.dismissAll();
              },
              style: "cancel",
            },
          ]
        );
      }
    }
  }, [hasCameraPermission, hasAudioPermission]);

  // const showFullScreenAnimation = (text: string) => {
  //   setAnimationText(text);

  //   // Reset animation
  //   fadeAnim.setValue(0);
  //   scaleAnim.setValue(0.8);

  //   // Animate in
  //   Animated.parallel([
  //     Animated.timing(fadeAnim, {
  //       toValue: 1,
  //       duration: 400,
  //       useNativeDriver: true,
  //     }),
  //     Animated.spring(scaleAnim, {
  //       toValue: 1,
  //       friction: 5,
  //       useNativeDriver: true,
  //     }),
  //   ]).start();

  //   // Animate out after 2 seconds
  //   setTimeout(() => {
  //     Animated.timing(fadeAnim, {
  //       toValue: 0,
  //       duration: 500,
  //       useNativeDriver: true,
  //     }).start(() => {
  //       setAnimationText(null);
  //     });
  //   }, 500);
  // };

  // const sendWhatsappMessage = async (name: string) => {
  //   try {
  //     const {
  //       data: { session },
  //     } = await supabase.auth.getSession();

  //     const accessToken = session?.access_token;

  //     if (!accessToken) {
  //       Alert.alert("Error", "No access token found. Please log in again.");
  //       return;
  //     }

  //     const res = await postJSON("api/db/sendMessage", { name }, accessToken);
  //     console.log("REESS:", res);

  //     if (res === false) {
  //       return false;
  //     } else if (res === true) {
  //       return true;
  //     }
  //   } catch (err) {
  //     console.error("sendWhatsappMessage error:", err);
  //     Alert.alert("Error", "Something went wrong while sending the message.");
  //     return false;
  //   }
  // };

  const handleCheckOut = async (name: string) => {
    // showFullScreenAnimation(`Bye, ${name}!`);
    console.log("CHEKCING OUT NAME:", name);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const accessToken = session?.access_token;

    const { error } = await postJSON("api/db/checkout", { name }, accessToken);

    if (error) {
      Alert.alert("Error", error);
    }

    router.push("/");
  };

  const handleCheckIn = async (name: string) => {
    // showFullScreenAnimation(`Welcome, ${name}!`);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const accessToken = session?.access_token;

    const { error } = await postJSON("api/db/checkin", { name }, accessToken);
    if (error) {
      Alert.alert("Error", error);
    }
    router.push("/");
  };

  const [showCheck, setShowCheck] = useState(false);
  const checkAnim = useRef(new Animated.Value(0)).current;

  const triggerCheckAnimation = () => {
    setShowCheck(true);
    checkAnim.setValue(0);

    Animated.spring(checkAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(checkAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => setShowCheck(false));
      }, 600);
    });
  };

  const handleBarCodeScanned = async ({ data }) => {
    try {
      const timestamp = Date.now();

      if (scanned || timestamp - lastScannedTimeStampRef.current < 2000) {
        return;
      }

      setScanned(true); // Prevent further scans immediately

      lastScannedTimeStampRef.current = timestamp;

      const name = data.trim();

      player.seekTo(0);
      player.play();

      triggerCheckAnimation();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;

      const status = await getJSON(
        `api/db/status/${encodeURIComponent(name)}`,
        accessToken
      );

      if (!status.found) {
        return handleCheckIn(name);
      }

      if (status.record.status === "checked_out") {
        Alert.alert(
          "Already Checked Out",
          `${name} is already checked out. Check in again?`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Check In",
              onPress: async () => {
                await handleCheckIn(name);
              },
            },
          ]
        );
      } else {
        console.log("HANDLING CHCKOUT WITH NAME:", name);
        handleCheckOut(name);
      }
    } catch (error) {
      console.error("error:", error);
      Alert.alert("Invalid QR Code", "Unable to process the QR code.");
    }
  };

  // let notificationId = 0; // outside component, or use useRef for persistent ID

  // const showSuccessNotification = (studentName: string, result: boolean) => {
  //   const id = notificationId++;
  //   const message =
  //     result === true
  //       ? `Message sent successfully to ${studentName}'s parents!`
  //       : "An error occurred";

  //   setSuccessNotifications((prev) => [...prev, { id, message }]);

  //   // auto-hide after 3 seconds
  //   setTimeout(() => {
  //     setSuccessNotifications((prev) =>
  //       prev.filter((notif) => notif.id !== id)
  //     );
  //   }, 3000);
  // };

  const goToSettings = () => {
    Linking.openSettings();
  };

  if (hasCameraPermission && hasAudioPermission) {
    return (
      <View style={{ flexDirection: "row", flex: 1 }}>
        {/* {animationText && (
          <Animated.View
            style={[
              styles.fullscreenOverlay,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <BouncyText text={animationText} />
          </Animated.View>
        )} */}

        {/* 📷 Left side - Camera area */}
        <View style={{ width: "100%", height: "100%" }}>
          <CameraView
            ref={cameraRef}
            style={{ width: "100%", height: "100%", borderRadius: 16 }}
            facing={facing}
            onBarcodeScanned={handleBarCodeScanned}
            animateShutter
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          />
          <View style={{ position: "absolute", bottom: 40, right: 20 }}>
            {/* <TouchableOpacity
    onPress={() =>
      autoTestRunning ? stopAutoCheckIn() : startAutoCheckIn()
    }
    style={{
      padding: 12,
      backgroundColor: autoTestRunning ? "red" : "green",
      borderRadius: 8,
    }}
  >
    <Text style={{ color: "white", fontWeight: "bold" }}>
      {autoTestRunning ? "Stop Auto Test" : "Start Auto Test"}
    </Text>
  </TouchableOpacity> */}
          </View>

          {/* ✅ Overlay UI */}
          {showCheck && (
            <Animated.View
              style={[
                styles.checkOverlay,
                {
                  opacity: checkAnim,
                  transform: [{ scale: checkAnim }],
                },
              ]}
            >
              <Text style={styles.checkMark}>✓</Text>
            </Animated.View>
          )}

          <TouchableOpacity
            style={[
              styles.backButton,
              { position: "absolute", top: 20, left: 20 },
            ]}
            onPress={() => router.push("/")}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <View
            style={[
              styles.buttonContainer,
              { position: "absolute", bottom: 40, alignSelf: "center" },
            ]}
          >
            <TouchableOpacity
              style={styles.button}
              onPress={toggleCameraFacing}
            >
              <Text style={styles.text}>Flip Camera</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
};

// const BouncyText: React.FC<{ text: string }> = ({ text }) => {
//   const letters = text.split("");
//   const animations = letters.map(() => new Animated.Value(0));

//   useEffect(() => {
//     Animated.stagger(
//       10, // delay per letter
//       animations.map((anim) =>
//         Animated.spring(anim, {
//           toValue: 1,
//           friction: 4,
//           tension: 70,
//           useNativeDriver: true,
//         })
//       )
//     ).start();
//   }, []);

const styles = StyleSheet.create({
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
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
    color: "#004A7C",
    fontSize: 16,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: "#33B5E5",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    elevation: 5,
  },
  text: {
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
  },
  popup: {
    position: "absolute",
    top: "70%",
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    zIndex: 999,
  },
  popupText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
  },
  fullscreenOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#33B5E5",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  animationText: {
    color: "white",
    fontSize: 100,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  checkOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -50 }, { translateY: -50 }],
    backgroundColor: "rgba(0, 255, 127, 0.25)",
    borderRadius: 100,
    width: 160,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  checkMark: {
    fontSize: 150,
    color: "#00FF7F",
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
});

export default QRScanner;
