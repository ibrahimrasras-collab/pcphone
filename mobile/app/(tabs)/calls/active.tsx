import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Surface, IconButton } from "react-native-paper";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCallStore } from "../../../stores/callStore";

export default function ActiveCallScreen() {
  const { activeCall, endCall } = useCallStore();

  if (!activeCall) {
    router.back();
    return null;
  }

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleEndCall = () => {
    endCall();
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text variant="headlineLarge" style={styles.number}>
          {activeCall.remoteNumber}
        </Text>
        <Text variant="bodyLarge" style={styles.name}>
          {activeCall.remoteName || "Unknown"}
        </Text>
        <Text variant="bodyMedium" style={styles.duration}>
          {formatDuration(activeCall.duration)}
        </Text>
        <Text variant="bodySmall" style={styles.status}>
          {activeCall.isOnHold ? "On Hold" : "Active"}
        </Text>
      </View>

      <View style={styles.controls}>
        <ControlButton
          icon={activeCall.isMuted ? "mic-off" : "mic"}
          label={activeCall.isMuted ? "Unmute" : "Mute"}
          isActive={activeCall.isMuted}
          onPress={() => {}}
        />
        <ControlButton
          icon="keypad-outline"
          label="Keypad"
          onPress={() => {}}
        />
        <ControlButton
          icon={activeCall.isOnSpeaker ? "volume-high" : "volume-medium"}
          label={activeCall.isOnSpeaker ? "Speaker" : "Audio"}
          isActive={activeCall.isOnSpeaker}
          onPress={() => {}}
        />
        <ControlButton
          icon={activeCall.isOnHold ? "unlock" : "lock-closed"}
          label={activeCall.isOnHold ? "Resume" : "Hold"}
          isActive={activeCall.isOnHold}
          onPress={() => {}}
        />
        <ControlButton
          icon="people-outline"
          label="Add Call"
          onPress={() => {}}
        />
        <ControlButton
          icon="pause-outline"
          label="Record"
          onPress={() => {}}
        />
      </View>

      <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
        <IconButton icon="phone-hangup" iconColor="#fff" size={36} />
      </TouchableOpacity>
    </View>
  );
}

function ControlButton({
  icon,
  label,
  isActive,
  onPress,
}: {
  icon: string;
  label: string;
  isActive?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.controlButton} onPress={onPress}>
      <View
        style={[
          styles.controlIcon,
          isActive && styles.controlIconActive,
        ]}
      >
        <Ionicons
          name={icon as any}
          size={24}
          color={isActive ? "#007AFF" : "#fff"}
        />
      </View>
      <Text style={styles.controlLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1C1C1E",
    justifyContent: "space-between",
    paddingBottom: 40,
  },
  info: {
    alignItems: "center",
    paddingTop: 60,
  },
  number: {
    color: "#fff",
    fontWeight: "600",
    letterSpacing: 1,
  },
  name: {
    color: "#8E8E93",
    marginTop: 4,
  },
  duration: {
    color: "#fff",
    marginTop: 24,
    fontSize: 48,
    fontWeight: "300",
  },
  status: {
    color: "#34C759",
    marginTop: 4,
  },
  controls: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 16,
  },
  controlButton: {
    alignItems: "center",
    width: 80,
  },
  controlIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2C2C2E",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  controlIconActive: {
    backgroundColor: "#007AFF22",
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  controlLabel: {
    color: "#8E8E93",
    fontSize: 12,
  },
  endCallButton: {
    backgroundColor: "#FF3B30",
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
});
