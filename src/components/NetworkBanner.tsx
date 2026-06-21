import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetworkStatus, isOnline } from '../hooks/useNetworkStatus';
import { colors } from '../theme/colors';
import { screenPadding } from '../theme/spacing';
import { typography } from '../theme/typography';

const NetworkBanner = () => {
  const network = useNetworkStatus();

  if (isOnline(network)) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        No internet connection. Firebase requests are paused until connectivity
        returns.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.warningBg,
    paddingHorizontal: screenPadding,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#FDE68A',
  },
  text: {
    ...typography.caption,
    color: colors.warning,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default NetworkBanner;
