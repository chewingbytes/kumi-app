import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  TouchableOpacity,
  Animated,
  Alert,
} from "react-native";

const StudentCard = React.memo(
  ({ entry, isSelected, onSelect, onDelete, onNotify, isProcessing }) => {
    const blinkAnim = useRef(new Animated.Value(1)).current;
    const statusValue = (entry?.parent_notified || "").toString().toUpperCase();
    const showWarning =
      statusValue && statusValue !== "SENT" && statusValue !== "DELIVERED";

    useEffect(() => {
      if (!showWarning) return;
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, {
            toValue: 0.2,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();
      return () => animation.stop();
    }, [blinkAnim, showWarning]);

    const handleWarningPress = () => {
      const reason = entry?.failed_reason || "Message is not delivered.";
      Alert.alert("Message status", reason);
    };
    return (
      <Pressable
        style={[
          styles.card,
          entry.status === "checked_in" ? styles.in : styles.out,
        ]}
        onPress={() => onSelect(entry)}
      >
        <View
          style={{ flex: 1, flexDirection: "column", justifyContent: "center" }}
        >
          <View style={styles.nameRow}>
            <Text
              style={[styles.cardTitle, isSelected && styles.selectedUnderline]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {entry.student_name}
            </Text>
            {/* <Pressable
              onPress={handleWarningPress}
              style={styles.warningWrapper}
              accessibilityRole="button"
              accessibilityLabel={
                entry.failed_reason || "Message not delivered"
              }
            >
              <Animated.View
                style={[styles.warningBadge, { opacity: blinkAnim }]}
              >
                <Text style={styles.warningText}>!</Text>
              </Animated.View>
            </Pressable> */}
          </View>
          <Text
            style={[
              styles.statusText,
              entry.status === "checked_in"
                ? styles.checkedIn
                : styles.checkedOut,
            ]}
          >
            {entry.status === "checked_in" ? "Checked In" : "Checked Out"}
          </Text>
        </View>

        {entry.status === "checked_out" && (
          <View style={{ justifyContent: "center", alignItems: "flex-end" }}>
            <TouchableOpacity
              style={[
                styles.button,
                { marginTop: 0, paddingVertical: 8, alignSelf: "flex-end" },
              ]}
              onPress={() => onNotify(entry)}
            >
              <Text style={styles.text}>
                {entry.parent_notified ? "Notify Again" : "Notify"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Pressable>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    display: "flex",
    justifyContent: "space-between",
    flexDirection: "row",
    padding: 16,
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
    fontSize: 20,
    color: "#3B185F",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },

  cardDetail: {
    fontSize: 14,
    marginTop: 6,
    color: "#3B185F",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },
  selectedUnderline: {
    textDecorationLine: "underline",
    textDecorationColor: "#004A7C", // choose your color
    textDecorationStyle: "solid",
  },
  button: {
    backgroundColor: "#33B5E5",
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 30,
    elevation: 5,
  },
  text: {
    fontSize: 14,
    color: "#fff",
    textAlign: "center",
    fontFamily: "DynaPuff_400Regular", // or Dancing Script / Great Vibes
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  warningWrapper: {
    marginLeft: 6,
  },
  warningBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#D9534F",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#B52B27",
  },
  warningText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});

export default StudentCard;
