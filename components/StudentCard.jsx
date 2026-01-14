import React from "react";
import { StyleSheet, View, Text, Pressable, TouchableOpacity } from 'react-native';

const StudentCard = React.memo(({ 
  entry, 
  isSelected, 
  onSelect, 
  onDelete, 
  onNotify, 
  isProcessing 
}) => {
  return (
    <Pressable
      style={[
        styles.card,
        entry.status === "checked_in" ? styles.in : styles.out,
      ]}
      onPress={() => onSelect(entry)}
    >
      <View>
        <Text style={[
          styles.cardTitle,
          isSelected && styles.selectedUnderline,
        ]}>
          {entry.student_name}
        </Text>

        <Text style={[
          styles.statusText,
          entry.status === "checked_in" ? styles.checkedIn : styles.checkedOut,
        ]}>
          {entry.status === "checked_in" ? "Checked In" : "Checked Out"}
        </Text>
      </View>

      {entry.status === "checked_out" && (
        <TouchableOpacity
          style={[styles.button, { marginTop: 10, paddingVertical: 8 }]}
          onPress={() => onNotify(entry)}
        >
          <Text style={styles.text}>
            {entry.parent_notified ? "Notify Again" : "Notify"}
          </Text>
        </TouchableOpacity>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
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
});

export default StudentCard;