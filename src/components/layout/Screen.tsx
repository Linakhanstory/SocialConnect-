import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import NetworkBanner from '../NetworkBanner';
import { colors } from '../../theme/colors';

interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: Edge[];
  backgroundColor?: string;
}

export default function Screen({
  children,
  style,
  edges = ['top', 'left', 'right'],
  backgroundColor = colors.surface,
}: ScreenProps) {
  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor }, style]}
      edges={edges}
    >
      <NetworkBanner />
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
