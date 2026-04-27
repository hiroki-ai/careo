// @ts-expect-error - @capacitor/cli is installed only when initializing native apps
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "jp.careoai.app",
  appName: "Careo",
  webDir: "out",
  server: {
    // 本番は careoai.jp をWebViewで読み込む構成（hybrid型）
    // 完全ネイティブ化する場合は webDir を使用
    url: "https://careoai.jp",
    cleartext: false,
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#fcfbf8",
  },
  android: {
    backgroundColor: "#fcfbf8",
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#fcfbf8",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
