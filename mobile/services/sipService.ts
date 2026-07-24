import { UserAgent, Registerer, Inviter } from "sip.js";
import { MediaStream, MediaStreamTrack } from "react-native-webrtc";
import { useCallStore } from "../stores/callStore";

export class SipService {
  private userAgent: UserAgent | null = null;
  private registerer: Registerer | null = null;

  async initialize(extension: string, password: string, server: string) {
    this.userAgent = new UserAgent({
      uri: UserAgent.makeURI(`sip:${extension}@${server}`),
      authorizationPassword: password,
      authorizationUsername: extension,
      transportOptions: {
        server: `wss://${server}:8089/ws`,
      },
    });

    await this.userAgent.start();
    this.registerer = new Registerer(this.userAgent);
    await this.registerer.register();
  }

  async makeCall(targetNumber: string) {
    if (!this.userAgent) throw new Error("Not registered");

    const inviter = new Inviter(this.userAgent, UserAgent.makeURI(`sip:${targetNumber}@pstn.example.com`), {
      sessionDescriptionHandlerOptions: {
        constraints: {
          audio: true,
          video: false,
        },
      },
    });

    inviter.stateChange.addListener((state) => {
      console.log("Call state:", state);
    });

    await inviter.invite();
    return inviter;
  }

  async hangup() {
    this.userAgent?.stop();
  }

  async dispose() {
    await this.userAgent?.stop();
    this.userAgent = null;
    this.registerer = null;
  }
}

export const sipService = new SipService();
