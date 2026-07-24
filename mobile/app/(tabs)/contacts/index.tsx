import { useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SectionList,
} from "react-native";
import { Text, Searchbar, Surface, FAB } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";

const MOCK_CONTACTS = [
  { id: "1", name: "Alice Johnson", phone: "+1 (202) 555-0147", favorite: true },
  { id: "2", name: "Bob Smith", phone: "+1 (202) 555-0189", favorite: false },
  { id: "3", name: "Charlie Brown", phone: "+1 (415) 555-0268", favorite: true },
  { id: "4", name: "Diana Ross", phone: "+1 (310) 555-0392", favorite: false },
];

const grouped = MOCK_CONTACTS.sort((a, b) => a.name.localeCompare(b.name))
  .reduce((acc, contact) => {
    const letter = contact.name[0].toUpperCase();
    const section = acc.find((s) => s.title === letter);
    if (section) {
      section.data.push(contact);
    } else {
      acc.push({ title: letter, data: [contact] });
    }
    return acc;
  }, [] as Array<{ title: string; data: typeof MOCK_CONTACTS }>);

export default function ContactsScreen() {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = grouped
    .map((section) => ({
      ...section,
      data: section.data.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.phone.includes(searchQuery),
      ),
    }))
    .filter((s) => s.data.length > 0);

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search contacts..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <SectionList
        sections={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Surface style={styles.contactItem} elevation={0}>
            <TouchableOpacity style={styles.contactContent}>
              <View style={[styles.avatar, item.favorite && styles.favoriteAvatar]}>
                <Text variant="titleMedium" style={styles.avatarText}>
                  {item.name[0]}
                </Text>
              </View>
              <View style={styles.contactInfo}>
                <Text variant="bodyLarge" style={styles.name}>
                  {item.name}
                </Text>
                <Text variant="bodySmall" style={styles.phone}>
                  {item.phone}
                </Text>
              </View>
              {item.favorite && (
                <Ionicons name="star" size={18} color="#FFD60A" />
              )}
            </TouchableOpacity>
          </Surface>
        )}
        renderSectionHeader={({ section }) => (
          <Text variant="bodySmall" style={styles.sectionHeader}>
            {section.title}
          </Text>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text variant="bodyLarge" style={styles.emptyText}>
              No contacts yet
            </Text>
          </View>
        }
      />

      <FAB
        icon="person-add"
        style={styles.fab}
        onPress={() => {}}
        label="Add"
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
  contactItem: {
    marginHorizontal: 12,
    marginVertical: 1,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  contactContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  favoriteAvatar: {
    backgroundColor: "#FFD60A",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "600",
  },
  contactInfo: {
    flex: 1,
  },
  name: {
    fontWeight: "500",
  },
  phone: {
    color: "#8E8E93",
    marginTop: 1,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    color: "#8E8E93",
    fontWeight: "600",
    backgroundColor: "#f5f5f5",
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
