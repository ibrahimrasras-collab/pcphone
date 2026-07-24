import { useState, useEffect } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Text, FAB, Surface, TextInput, Button, Dialog, Portal, Paragraph } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import api from "../../utils/api";

interface Conference {
  id: string;
  friendlyName: string;
  status: string;
  isActive: boolean;
  maxParticipants: number;
  createdAt: string;
}

export default function ConferencesScreen() {
  const [confs, setConfs] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/conferences");
      setConfs(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createConf = async () => {
    try {
      await api.post("/conferences", {
        friendlyName: name,
        pin: pin || undefined,
        maxParticipants: 10,
      });
      setShowCreate(false);
      setName("");
      setPin("");
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const endConf = async (id: string) => {
    try {
      await api.post(`/conferences/${id}/end`);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={confs}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <Surface style={styles.card} elevation={1}>
            <View style={styles.cardHeader}>
              <View style={styles.confInfo}>
                <Text variant="titleMedium" style={styles.confName}>
                  {item.friendlyName}
                </Text>
                <View style={styles.statusRow}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: item.isActive ? "#34C759" : "#8E8E93" },
                  ]} />
                  <Text variant="bodySmall" style={styles.statusText}>
                    {item.isActive ? "Active" : item.status}
                  </Text>
                </View>
              </View>
              {item.isActive && (
                <TouchableOpacity onPress={() => endConf(item.id)}>
                  <Text style={styles.endBtn}>End</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="people" size={14} color="#8E8E93" />
              <Text style={styles.metaText}>Max: {item.maxParticipants}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="calendar" size={14} color="#8E8E93" />
              <Text style={styles.metaText}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </View>
          </Surface>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-circle-outline" size={56} color="#ccc" />
            <Text style={styles.emptyText}>No conferences yet</Text>
            <Text style={styles.emptySubtext}>Tap + to start one</Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setShowCreate(true)}
      />

      <Portal>
        <Dialog visible={showCreate} onDismiss={() => setShowCreate(false)}>
          <Dialog.Title>New Conference</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Conference Name"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
            <TextInput
              label="PIN (optional, 4-12 digits)"
              value={pin}
              onChangeText={setPin}
              keyboardType="numeric"
              style={styles.input}
            />
            <Paragraph style={styles.hint}>
              A PIN protects your call. Share it with participants.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCreate(false)}>Cancel</Button>
            <Button onPress={createConf} mode="contained">Create</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  confInfo: { flex: 1 },
  confName: { fontWeight: "600", marginBottom: 4 },
  statusRow: { flexDirection: "row", alignItems: "center" },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { color: "#8E8E93" },
  endBtn: { color: "#FF3B30", fontWeight: "600" },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  metaText: { color: "#8E8E93", fontSize: 12, marginLeft: 6 },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyText: { color: "#8E8E93", marginTop: 12, fontSize: 16 },
  emptySubtext: { color: "#C7C7CC", marginTop: 4 },
  fab: { position: "absolute", right: 16, bottom: 16, backgroundColor: "#007AFF" },
  input: { marginBottom: 12 },
  hint: { fontSize: 12, color: "#8E8E93" },
});
