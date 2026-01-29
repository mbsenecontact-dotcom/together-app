import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.macsy.together',
  appName: 'Together App',
  webDir: 'www',
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      style: 'LIGHT', 
      backgroundColor: '#3cb371' 
    }
  }
};

export default config;
