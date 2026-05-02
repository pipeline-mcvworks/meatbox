import React from 'react';
import { Linking, Platform } from 'react-native';
import EmptyState from './EmptyState';

interface MicDeniedStateProps {
  onRetry?: () => void;
}

export default function MicDeniedState({
  onRetry,
}: MicDeniedStateProps): React.JSX.Element {
  const openSettings = () => {
    if (onRetry) {
      onRetry();
      return;
    }
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:').catch(() => {});
    } else {
      Linking.openSettings().catch(() => {});
    }
  };
  return (
    <EmptyState
      icon="🎤"
      tone="warn"
      title="Microphone access needed"
      body="The visualizer reacts to your voice. Enable microphone access in Settings, then return here. You can still play and view the demo project without the mic."
      ctaLabel="Open Settings"
      onCta={openSettings}
    />
  );
}
