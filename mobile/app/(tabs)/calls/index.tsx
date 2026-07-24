import { useEffect, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Text, FAB, Searchbar, Surface, IconButton } from "react-native-paper";
import { useCallStore } from "../../../stores/callStore";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function CallsScreen() {
  const { calls, isLoading, fetchCalls } = useCallStore();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCalls();
  }, []);

  const filteredCalls = calls.filter((call) =>
    call.fromNumber.includes(searchQuery) || call.toNumber.includes(searchQuery)
  );

  const getCallIcon = (direction: string, status: string) => {
    if (direction === "inbound") {
      return status === "missed"
        ? "call-outline"
        : "arrow-down-circle-outline";
    }
    return "arrow-up-circle-outline";
  };

  const getCallColor = (direction: string, status: string) => {
    if (status === "missed") return "#FF3B30";
    return direction === "inbound" ? "#007AFF" : "#34C759";
  };

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return "";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search calls..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <FlatList
        data={filteredCalls}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Surface style={styles.callItem} elevation={0}>
            <TouchableOpacity style={styles.callContent}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: getCallColor(item.direction, item.status) + "20" },
                ]}
              >
                <Ionicons
                  name={getCallIcon(item.direction, item.status)}
                  size={20}
                  color={getCallColor(item.direction, item.status)}
                />
              </View>
              <View style={styles.callInfo}>
                <Text variant="bodyLarge" style={styles.callName}>
                  {item.fromNumber || item.toNumber}
                </Text>
                <Text variant="bodySmall" style={styles.callMeta}>
                  {item.direction === "inbound" ? "Incoming" : "Outgoing"}
                  {item.durationSeconds > 0
                    ? ` · ${formatDuration(item.durationSeconds)}`
                    : ""}
                </Text>
              </View>
              <IconButton
                icon="information-outline"
                size={20}
                onPress={() => {}}
              />
            </TouchableOpacity>
          </Surface>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="call-outline" size={48} color="#ccc" />
            <Text variant="bodyLarge" style={styles.emptyText}>
              No calls yet
            </Text>
            <Text variant="bodySmall" style={styles.emptySubtext}>
              Your call history will appear here
            </Text>
          </View>
        }
      />

      <FAB
        icon="phone"
        style={styles.fab}
        onPress={() => router.push("/(tabs)/calls/dialer")}
        label="Dial"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  searchbar: {
    margin: 12,
    backgroundColor: "#fff",
  },
  callItem: {
    marginHorizontal: 12,
    marginVertical: 2,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  callContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  callInfo: {
    flex: 1,
  },
  callName: {
    fontWeight: "500",
  },
  callMeta: {
    color: "#8E8E93",
    marginTop: 2,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyText: {
    color: "#8E8E93",
    marginTop: 12,
  },
  emptySubtext: {
    color: "#C7C7CC",
    marginTop: 4,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: "#007AFF",
  },
});
