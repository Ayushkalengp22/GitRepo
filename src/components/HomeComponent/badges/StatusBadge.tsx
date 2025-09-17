import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

interface StatusBadgeProps {
  status: 'PAID' | 'PARTIAL' | 'PENDING';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({status}) => {
  const getStatusColors = (status: string) => {
    switch (status) {
      case 'PAID':
        return {backgroundColor: '#065F46', textColor: '#D1FAE5'};
      case 'PARTIAL':
        return {backgroundColor: '#92400E', textColor: '#FDE68A'};
      case 'PENDING':
        return {backgroundColor: '#991B1B', textColor: '#FEE2E2'};
      default:
        return {backgroundColor: '#374151', textColor: '#D1D5DB'};
    }
  };

  const colors = getStatusColors(status);

  return (
    <View style={[styles.badge, {backgroundColor: colors.backgroundColor}]}>
      <Text style={[styles.text, {color: colors.textColor}]}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
