import { create } from "zustand";
import api from "../utils/api";

interface CallRecord {
  id: string;
  direction: "inbound" | "outbound";
  fromNumber: string;
  toNumber: string;
  status: string;
  durationSeconds: number;
  startedAt: string;
}

interface CallState {
  calls: CallRecord[];
  isLoading: boolean;
  activeCall: {
    callId: string;
    remoteNumber: string;
    remoteName: string;
    direction: "inbound" | "outbound";
    isMuted: boolean;
    isOnSpeaker: boolean;
    isOnHold: boolean;
    duration: number;
  } | null;
  fetchCalls: (page?: number) => Promise<void>;
  startCall: (to: string) => Promise<void>;
  setActiveCall: (call: CallState["activeCall"]) => void;
  endCall: () => void;
}

export const useCallStore = create<CallState>((set) => ({
  calls: [],
  isLoading: false,
  activeCall: null,

  fetchCalls: async (page = 1) => {
    set({ isLoading: true });
    const { data } = await api.get(`/calls?page=${page}`);
    set({ calls: data.data, isLoading: false });
  },

  startCall: async (to: string) => {
    const { data } = await api.post("/calls", { to });
    set({ activeCall: data.data });
  },

  setActiveCall: (call) => set({ activeCall: call }),

  endCall: () => set({ activeCall: null }),
}));
