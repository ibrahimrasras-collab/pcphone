import { useState } from "react";
import { View, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Searchbar, Surface, FAB } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";

const MOCK_MESSAGES = [
  {
    id: "1",
    name: "+1 (202) 555-0147",
    lastMessage: "Sure, I'll call you back in 10 minutes",
    time: "2m ago",
    unread: 1,
  },
  {
    id: "2",
    name: "+1 (202) 555-0189",
    lastMessage: "Thanks for the update!",
    time: "1h ago",
    unread: 0,
  },
  {
    id: "3",
    name: "+1 (415) 555-0268",
    lastMessage: "The meeting is at 3pm",
    time: "Yesterday",
    unread: 0,
  },
];

export default function MessagesScreen() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search messages..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <FlatList
        data={MOCK_MESSAGES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Surface style={styles.messageItem} elevation={0}>
            <TouchableOpacity style={styles.messageContent}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={24} color="#fff" />
              </View>
              <View style={styles.messageInfo}>
                <View style={styles.messageHeader}>
                  <Text variant="bodyLarge" style={styles.name}>
                    {item.name}
                  </Text>
                  <Text variant="bodySmall" style={styles.time}>
                    {item.time}
                  </Text>
                </View>
                <View style={styles.messagePreview}>
                  <Text
                    variant="bodyMedium"
                    style={styles.preview}
                    numberOfLines={1}
                  >
                    {item.lastMessage}
                  </Text>
                  {item.unread > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{item.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </Surface>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
            <Text variant="bodyLarge" style={styles.emptyText}>
              No messages yet
            </Text>
          </View>
        }
      />

      <FAB
        icon="chatbubble-ellipses"
        style={styles.fab}
        onPress={() => {}}
        label="New"
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
  messageItem: {
    marginHorizontal: 12,
    marginVertical: 2,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  messageContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  messageInfo: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontWeight: "500",
  },
  time: {
    color: "#8E8E93",
  },
  messagePreview: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  preview: {
    flex: 1,
    color: "#8E8E93",
  },
  unreadBadge: {
    backgroundColor: "#007AFF",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    paddingHorizontal: 6,
  },
  unreadText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
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
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: "#007AFF",
  },
});
