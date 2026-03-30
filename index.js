import { registerRootComponent } from 'expo';
import { WebView } from 'react-native-webview';
import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';

function ChinsMobileApp() {
  return (
    React.createElement(View, { style: styles.container },
      React.createElement(WebView, {
        source: { uri: 'https://chins-4.vercel.app' },
        style: styles.webview,
        javaScriptEnabled: true,
        domStorageEnabled: true,
        startInLoadingState: true,
        allowsInlineMediaPlayback: true,
        renderLoading: () => React.createElement(View, { style: styles.loading },
          React.createElement(ActivityIndicator, { size: 'large', color: '#4BC1A0' })
        ),
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
  loading: {
    flex: 1,
    backgroundColor: '#021a16',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

registerRootComponent(ChinsMobileApp);
