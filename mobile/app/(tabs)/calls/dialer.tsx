import { useState, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Surface, IconButton } from "react-native-paper";
import { router } from "expo-router";
import { useCallStore } from "../../../stores/callStore";

const DIAL_PAD = [
  ["1", "", ""],
  ["2", "ABC", ""],
  ["3", "DEF", ""],
  ["4", "GHI", ""],
  ["5", "JKL", ""],
  ["6", "MNO", ""],
  ["7", "PQRS", ""],
  ["8", "TUV", ""],
  ["9", "WXYZ", ""],
  ["*", "", ""],
  ["0", "+", ""],
  ["#", "", ""],
];

export default function DialerScreen() {
  const [number, setNumber] = useState("");
  const { startCall } = useCallStore();

  const handlePress = useCallback((digit: string) => {
    setNumber((prev) => prev + digit);
  }, []);

  const handleDelete = useCallback(() => {
    setNumber((prev) => prev.slice(0, -1));
  }, []);

  const handleCall = useCallback(async () => {
    if (number.length < 3) return;
    await startCall(number);
  }, [number]);

  const handleLongPress = useCallback(() => {
    setNumber("");
  }, []);

  const formattedNumber = (() => {
    if (!number) return "";
    if (number.startsWith("+")) {
      return number;
    }
    const cleaned = number.replace(/\D/g, "");
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6)
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  })();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="close"
          size={24}
          onPress={() => router.back()}
        />
        <Text variant="titleMedium">Dial</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.numberContainer}>
        <Text
          variant="displaySmall"
          style={styles.number}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formattedNumber || "Enter number"}
        </Text>
        <Text variant="bodySmall" style={styles.numberHint}>
          {number.startsWith("+") ? "International" : "US/Canada"}
        </Text>
      </View>

      <View style={styles.dialpad}>
        {DIAL_PAD.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((digit, colIndex) => (
              <TouchableOpacity
                key={`${rowIndex}-${colIndex}`}
                style={styles.digitButton}
                onPress={() => digit && handlePress(digit)}
                disabled={!digit}
              >
                <Text variant="headlineMedium" style={styles.digitText}>
                  {digit}
                </Text>
                <Text variant="labelSmall" style={styles.subText}>
                  {["1", "*", "#", "0"].includes(digit) ? "" : row[1] || ""}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        {number.length > 0 ? (
          <TouchableOpacity
            onPress={handleDelete}
            onLongPress={handleLongPress}
          >
            <IconButton icon="backspace-outline" size={28} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 52 }} />
        )}

        <TouchableOpacity
          style={[
            styles.callButton,
            number.length < 3 && styles.callButtonDisabled,
          ]}
          onPress={handleCall}
          disabled={number.length < 3}
        >
          <IconButton icon="phone" iconColor="#fff" size={28} />
        </TouchableOpacity>

        <View style={{ width: 52 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1C1C1E",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  numberContainer: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  number: {
    color: "#fff",
    fontWeight: "600",
    letterSpacing: 2,
  },
  numberHint: {
    color: "#8E8E93",
    marginTop: 4,
  },
  dialpad: {
    paddingHorizontal: 32,
    paddingTop: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  digitButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#2C2C2E",
    justifyContent: "center",
    alignItems: "center",
  },
  digitText: {
    color: "#fff",
    fontWeight: "500",
  },
  subText: {
    color: "#8E8E93",
    fontSize: 10,
    letterSpacing: 1,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 16,
  },
  callButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#34C759",
    justifyContent: "center",
    alignItems: "center",
  },
  callButtonDisabled: {
    opacity: 0.4,
  },
});
