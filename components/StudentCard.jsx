// StudentCard.jsx
import React from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";

const StudentCard = React.memo(function StudentCard({
  entry,
  styles,
  sendWhatsappMessage,
  showSendingNotification,
  showSuccessNotification,
  fetchStudents,
}) {
  return (
    <View
      style={[
        styles.miniCard,
        entry.status === "checked_in" ? styles.in : styles.out,
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={styles.miniCardName}>
          {entry.student_name}{" "}
          {entry.parent_notified && (
            <Text style={{ marginLeft: 8, color: "green", fontSize: 18 }}>
              ✅
            </Text>
          )}
        </Text>
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

      {entry.status === "checked_out" && (
        <TouchableOpacity
          style={[styles.button, { marginTop: 10, paddingVertical: 8 }]}
          onPress={async () => {
            showSendingNotification(entry.student_name);

            const result = await sendWhatsappMessage(entry.student_name);

            if (result) {
              showSuccessNotification(entry.student_name, result);
              await fetchStudents(); // refresh to update parent_notified
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
      )}
    </View>
  );
});

export default StudentCard;
