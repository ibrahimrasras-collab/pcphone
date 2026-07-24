import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Surface, Switch, Button, List, Divider } from "react-native-paper";
import { useAuthStore } from "../../../stores/authStore";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.profileCard} elevation={2}>
        <View style={styles.avatarLarge}>
          <Ionicons name="person" size={40} color="#fff" />
        </View>
        <Text variant="titleLarge" style={styles.name}>
          {user?.name}
        </Text>
        <Text variant="bodyMedium" style={styles.extension}>
          Extension: {user?.extension}
        </Text>
        <Text variant="bodySmall" style={styles.email}>
          {user?.email}
        </Text>
      </Surface>

      <Surface style={styles.section} elevation={1}>
        <List.Item
          title="Call Forwarding"
          description="Always, busy, no answer"
          left={(props) => <List.Icon {...props} icon="call-forwarding" />}
          onPress={() => {}}
        />
        <Divider />
        <List.Item
          title="Voicemail"
          description="Greeting, PIN, transcription"
          left={(props) => <List.Icon {...props} icon="voicemail" />}
          onPress={() => {}}
        />
        <Divider />
        <List.Item
          title="Do Not Disturb"
          description="Silence incoming calls"
          left={(props) => <List.Icon {...props} icon="moon" />}
          right={() => <Switch value={false} onValueChange={() => {}} />}
        />
        <Divider />
        <List.Item
          title="Call Recording"
          description="Auto-record calls"
          left={(props) => <List.Icon {...props} icon="record" />}
          right={() => <Switch value={false} onValueChange={() => {}} />}
        />
      </Surface>

      <Surface style={styles.section} elevation={1}>
        <List.Item
          title="Notifications"
          left={(props) => <List.Icon {...props} icon="bell" />}
          onPress={() => {}}
        />
        <Divider />
        <List.Item
          title="Sound & Ringtone"
          left={(props) => <List.Icon {...props} icon="music" />}
          onPress={() => {}}
        />
        <Divider />
        <List.Item
          title="Network (SIP Settings)"
          left={(props) => <List.Icon {...props} icon="wifi" />}
          onPress={() => {}}
        />
      </Surface>

      <Button
        mode="outlined"
        onPress={logout}
        style={styles.logoutButton}
        textColor="#FF3B30"
      >
        Sign Out
      </Button>

      <Text variant="bodySmall" style={styles.version}>
        PCPhone v0.1.0
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  profileCard: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  name: {
    fontWeight: "600",
  },
  extension: {
    color: "#007AFF",
    marginTop: 4,
  },
  email: {
    color: "#8E8E93",
    marginTop: 2,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  logoutButton: {
    margin: 16,
    borderColor: "#FF3B30",
  },
  version: {
    textAlign: "center",
    color: "#C7C7CC",
    marginBottom: 32,
  },
});
