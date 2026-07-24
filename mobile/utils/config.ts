type Environment = "development" | "staging" | "production";

interface AppConfig {
  environment: Environment;
  apiBaseUrl: string;
  wsUrl: string;
}

const configs: Record<Environment, AppConfig> = {
  development: {
    environment: "development",
    apiBaseUrl: "http://localhost:4000/api/v1",
    wsUrl: "ws://localhost:4000",
  },
  staging: {
    environment: "staging",
    apiBaseUrl: "https://abc123.ngrok.io/api/v1",
    wsUrl: "wss://abc123.ngrok.io",
  },
  production: {
    environment: "production",
    apiBaseUrl: "https://api.pcphone.example.com/api/v1",
    wsUrl: "wss://api.pcphone.example.com",
  },
};

export let activeEnv: Environment = "development";
export const config = configs[activeEnv];

export function setEnvironment(env: Environment) {
  activeEnv = env;
  Object.assign(config, configs[env]);
}
