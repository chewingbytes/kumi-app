// src/app/history.tsx
import React, { useEffect, useCallback, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "../../lib/supabase";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";

const API = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE;

export default function HistoryScreen() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  const formatTimestamp = (value?: string | null) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;

      // Adjust endpoint if needed. Assuming /students returns the dashboard-like list
      // which contains checkin/checkout/parent_notified info as per user description.
      const res = await fetch(API + "api/db/students", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const json = await res.json();
      if (json.error) throw new Error(json.error);
      
      // Sort or filter if needed? User asked to display "every row".
      // Assuming api returns current relevant rows.
      // Show most recent first based on message timestamps or latest_interacted.
      const rows = (json.students || []).slice();
      rows.sort((a, b) => {
        const aTime = new Date(
          a.message_read_timestamp ||
            a.message_sent_timestamp ||
            a.message_failed_timestamp ||
            a.latest_interacted || 0
        ).getTime();
        const bTime = new Date(
          b.message_read_timestamp ||
            b.message_sent_timestamp ||
            b.message_failed_timestamp ||
            b.latest_interacted || 0
        ).getTime();
        return bTime - aTime;
      });
      setStudents(rows);

    } catch (error) {
      console.error("Error fetching students:", error.message);
      Alert.alert("Error", "Failed to fetch values.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchStudents();
    }, [fetchStudents])
  );

  const renderItem = ({ item }) => {
    // parent_notified: "READ", "DELIVERED", "FAILED", "SENT" or null/undefined
    const status = item.parent_notified?.toUpperCase() || "NOT SENT";
    let statusColor = "#6B7280"; // Default neutral
    let statusIcon: keyof typeof Ionicons.glyphMap = "help-circle-outline";
    let subtitle = "";

    if (status === "READ") {
      statusColor = "#16A34A";
      statusIcon = "checkmark-done-circle-outline";
      subtitle = `Read at ${formatTimestamp(item.message_read_timestamp)}`;
    } else if (status === "DELIVERED" || status === "SENT") {
      statusColor = "#2563EB";
      statusIcon = "checkmark-circle-outline";
      subtitle = `Delivered at ${formatTimestamp(item.message_sent_timestamp)}`;
    } else if (status === "FAILED") {
      statusColor = "#DC2626";
      statusIcon = "alert-circle-outline";
      subtitle = `Failed at ${formatTimestamp(item.message_failed_timestamp)}`;
    } else {
      subtitle = "No message activity yet.";
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.studentName}>{item.student_name}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <View style={[styles.statusBadge, { borderColor: statusColor, backgroundColor: `${statusColor}15` }]}>
            <Ionicons
              name={statusIcon}
              size={18}
              color={statusColor}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
          </View>
        </View>

        {/* Show any available message timestamps */}
        {(() => {
          const timeline = [] as Array<{ label: string; value: string }>;
          if (item.message_sent_timestamp) {
            timeline.push({ label: "Sent", value: formatTimestamp(item.message_sent_timestamp) });
          }
          if (item.message_read_timestamp) {
            timeline.push({ label: "Read", value: formatTimestamp(item.message_read_timestamp) });
          }
          if (item.message_failed_timestamp) {
            timeline.push({ label: "Failed", value: formatTimestamp(item.message_failed_timestamp) });
          }
          if (!timeline.length) return null;
          return (
            <View style={styles.timelineRow}>
              {timeline.map((entry, idx) => (
                <View key={`${entry.label}-${idx}`} style={styles.timelinePill}>
                  <Text style={styles.timelineLabel}>{entry.label}</Text>
                  <Text style={styles.timelineValue}>{entry.value}</Text>
                </View>
              ))}
            </View>
          );
        })()}

        {(status === "FAILED" || item.failed_reason) && (
          <View style={styles.failureContainer}>
            <Text style={styles.failedLabel}>Reason:</Text>
            <Text style={styles.failedText}>
              {item.failed_reason || "Unknown error"}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <Text style={styles.pageTitle}>History</Text>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={fetchStudents}
        >
          {loading ? (
             <ActivityIndicator color="#1F3C88" />
          ) : (
            <Ionicons name="refresh" size={24} color="#1F3C88" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <FlatList
          data={students}
          renderItem={renderItem}
          keyExtractor={(item) => item.id?.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            !loading && <Text style={styles.emptyText}>No records found.</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#A7C7E7", // Matching app background
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "rgba(255,255,255,0.3)", // slight distinct header
  },
  backButton: {
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#1F3C88",
    backgroundColor: "#F2E9E4",
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  backButtonText: {
    fontSize: 16,
    color: "#1F3C88",
    fontFamily: "DynaPuff_400Regular",
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: "DynaPuff_400Regular",
    color: "#1F3C88",
  },
  refreshButton: {
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#1F3C88",
    backgroundColor: "#F2E9E4",
    padding: 8,
    minWidth: 44,
    alignItems: "center",
  },
  container: {
    flex: 1,
    padding: 10,
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#FFF5E4",
    borderRadius: 12,
    borderWidth: 3,
    borderColor: "#1F3C88",
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  studentName: {
    fontSize: 20,
    color: "#1F3C88",
    fontFamily: "DynaPuff_400Regular",
  },
  subtitle: {
    fontSize: 14,
    color: "#374151",
    fontFamily: "DynaPuff_400Regular",
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: "#fff",
  },
  statusText: {
    fontSize: 14,
    fontFamily: "DynaPuff_500Medium",
  },
  timelineRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  timelinePill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  timelineLabel: {
    fontSize: 12,
    color: "#111827",
    fontFamily: "DynaPuff_500Medium",
  },
  timelineValue: {
    fontSize: 12,
    color: "#374151",
    fontFamily: "DynaPuff_400Regular",
  },
  failureContainer: {
    marginTop: 10,
    padding: 8,
    backgroundColor: "#f8d7da",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#f5c6cb",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  failedLabel: {
    fontWeight: "bold",
    color: "#721c24",
    fontFamily: "DynaPuff_400Regular",
  },
  failedText: {
    color: "#721c24",
    fontFamily: "DynaPuff_400Regular",
    flex: 1,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 18,
    color: "#1F3C88",
    fontFamily: "DynaPuff_400Regular",
  },
});
