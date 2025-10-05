require('dotenv').config();

export default {
  "expo": {
    "name": "TracerX",
    "slug": "tracerx-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./src/assets/images/ticon3.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./src/assets/images/ticon3.png",
      "resizeMode": "contain",
      "backgroundColor": "#121212"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./src/assets/images/ticon3.png",
        "backgroundColor": "#121212"
      },
      "package": "com.tracerx.projecttrackmobile"
    },
    "web": {
      "favicon": "./src/assets/images/ticon3.png"
    },
    "extra": {
      API_BASE_URL: process.env.API_BASE_URL,
      AUTH_API_BASE: process.env.AUTH_API_BASE,
      apiKey:process.env.apiKey,
      "eas": {
        "projectId": "42a0083f-d83f-496e-8f0b-ce8f0855024f"
      }
    }
  }
};
