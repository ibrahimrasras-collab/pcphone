import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import api from "../utils/api";
import Constants from "expo-constants";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
  handleNotificationResponse: async (response) => {
    const { callId, callerNumber } = response.notification.request.content.data as any;
    console.log("User tapped call notification:", callId, callerNumber);
    // Navigate to active call screen with the incoming call context
  },
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Constants.isDevice) {
    console.warn("Push notifications require a physical device");
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowAnnouncements: true,
      },
    });
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("Push permission not granted");
    return null;
  }

  const token = (await Notifications.getDevicePushTokenAsync()).data;

  // Register token with backend
  try {
    await api.post("/push/register", {
      platform: Platform.OS === "ios" ? "ios" : "android",
      token,
      bundleId: Constants.expoConfig?.ios?.bundleIdentifier,
    });
    console.log("Push token registered:", token);
  } catch (err) {
    console.error("Failed to register push token:", err);
  }

  return token;
}

export async function unregisterForPushNotifications(): Promise<void> {
  try {
    const token = (await Notifications.getDevicePushTokenAsync()).data;
    await api.post("/push/unregister", { token });
  } catch (err) {
    console.error("Failed to unregister push token:", err);
  }
}

export function setupNotificationListeners(
  onIncomingCall: (callId: string, callerNumber: string, callerName?: string) => void,
) {
  // Foreground notification
  const sub1 = Notifications.addNotificationReceivedListener((notification) => {
    const data = notification.request.content.data as any;
    if (data?.type === "incoming_call") {
      onIncomingCall(data.callId, data.callerNumber, data.callerName);
    }
  });

  // Background/tapped notification
  const sub2 = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as any;
    if (data?.type === "incoming_call") {
      onIncomingCall(data.callId, data.callerNumber, data.callerName);
    }
  });

  return () => {
    Notifications.removeNotificationSubscription(sub1);
    Notifications.removeNotificationSubscription(sub2);
  };
}
