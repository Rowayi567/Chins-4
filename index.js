import { registerRootComponent } from 'expo';
import { AppRegistry } from 'react-native';
import { WebView } from 'react-native-webview';
import React from 'react';
import { StyleSheet, View } from 'react-native';

function ChinsMobileApp() {
  return (
    React.createElement(View, { style: styles.container },
      React.createElement(WebView, {
        source: { uri: 'https://chins.app' },
        style: styles.webview,
        javaScriptEnabled: true,
        domStorageEnabled: true,
        startInLoadingState: true,
        allowsInlineMediaPlayback: true,
      })
    )
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#021a16',
  },
  webview: {
    flex: 1,
  },
});

registerRootComponent(ChinsMobileApp);
