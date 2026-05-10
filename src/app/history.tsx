// src/app/history.tsx
import React, { useEffect, useCallback, useMemo, useState, JSX } from "react";
import {
  View,
  Text,
  TextInput,
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
import {
  CheckCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
} from "lucide-react-native";

const API = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE;

export default function HistoryScreen() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const formatTimestamp = (value?: string | null) => {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
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
      
      // Sort by latest message/read/sent/fail or latest_interacted fallback
      const rows = (json.students || []).slice();

      console.log("ROWS:", rows);

      setStudents(rows);

    } catch (error) {
      console.error("Error fetching students:", error.message);
      Alert.alert("Error", "Failed to fetch values.");
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      s.student_name?.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  useFocusEffect(
    useCallback(() => {
      fetchStudents();
    }, [fetchStudents])
  );

  const renderItem = ({ item }) => {
    // parent_notified: "READ", "DELIVERED", "FAILED", or null/undefined

    console.log("ITEM:", item);
    const status = item.parent_notified || "NOT SENT";

    console.log("STATUS:", status);
    let statusColor = "#666"; // Default gray
    let statusIcon: JSX.Element = <HelpCircle size={16} color={statusColor} style={{ marginRight: 4 }} />;

    if (status === "READ") {
      statusColor = "#155724"; // Greenish
      statusIcon = <CheckCheck size={16} color={statusColor} style={{ marginRight: 4 }} />;
    } else if (status === "DELIVERED" || status === "SENT") {
      statusColor = "#004085"; // Blueish
      statusIcon = <CheckCircle2 size={16} color={statusColor} style={{ marginRight: 4 }} />;
    } else if (status === "FAILED") {
      statusColor = "#721c24"; // Reddish
      statusIcon = <AlertCircle size={16} color={statusColor} style={{ marginRight: 4 }} />;
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.studentName}>{item.student_name}</Text>
          <View style={[styles.statusBadge, { borderColor: statusColor }]}>
            {statusIcon}
            <Text style={[styles.statusText, { color: statusColor }]}>
              {status}
            </Text>
          </View>
        </View>

        {/* Message timeline pills, only showing non-null timestamps */}
        {(() => {
          const timeline = [] as Array<{ label: string; value: string }>;
          const sent = formatTimestamp(item.message_sent_timestamp);
          const read = formatTimestamp(item.message_read_timestamp);
          const failed = formatTimestamp(item.message_failed_timestamp);

          if (sent) timeline.push({ label: "Sent", value: sent });
          if (read) timeline.push({ label: "Read", value: read });
          if (failed) timeline.push({ label: "Failed", value: failed });

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
            <Text style={styles.failedLabel}>Reason: </Text>
            <Text style={styles.failedText}>{item.failed_reason || "Unknown error"}</Text>
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
            <RefreshCw size={24} color="#1F3C88" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <TextInput
          placeholder="Search student..."
          placeholderTextColor="#4B5563"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
        <FlatList
          data={filteredStudents}
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
  searchInput: {
    borderWidth: 3,
    borderColor: "#1F3C88",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
    fontSize: 16,
    fontFamily: "DynaPuff_400Regular",
    color: "#1F3C88",
    backgroundColor: "#fff",
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
