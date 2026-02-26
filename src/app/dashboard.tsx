import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Alert,
  TouchableOpacity,
  Button,
  SafeAreaView,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { router } from "expo-router";

export default function Dashboard() {
  const [students, setStudents] = useState([]);
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data, error } = await supabase
          .from("students_checkin")
          .select("name, checked_in, checked_out, parent_number");

        if (error) throw error;
        setStudents(data);
      } catch (error) {
        console.error("Error fetching students:", error.message);
      }
    };

    fetchStudents();
  }, []);

  const handleNotify = (name: any, parent_number: any) => {
    Alert.alert(
      "Notification",
      `${name}'s parent (${parent_number}) has been notified.`
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Button title="Log out" onPress={handleLogout} />
        <Text style={styles.title}>Today</Text>
        <FlatList
          data={students}
          renderItem={({ item }) => (
            <View style={styles.itemContainer}>
              <Text style={styles.item}>
                {`Name: ${item.name}\nChecked In: ${
                  item.checked_in
                }\nCheckout: ${item.checked_out || "Not yet"}`}
              </Text>
              <TouchableOpacity
                style={styles.notifyButton}
                onPress={() => handleNotify(item.name, item.parent_number)}
              >
                <Text style={styles.buttonText}>Notify</Text>
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white", // optional background color
    paddingHorizontal: 16,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    width: "100%",
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
  },
  itemContainer: {
    padding: 15,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#000000",
    borderRadius: 8,
    width: "100%",
    backgroundColor: "#f9f9f9",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  item: {
    fontSize: 18,
    color: "#333",
    flex: 1, // Ensures the text takes up available space
  },
  notifyButton: {
    backgroundColor: "#000000",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginLeft: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});