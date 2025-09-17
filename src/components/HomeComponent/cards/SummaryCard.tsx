import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

interface SummaryCardProps {
  amount: number;
  label: string;
  color: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  amount,
  label,
  color,
}) => {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.cardContent}>
        <Text style={styles.cardAmount}>₹{amount.toLocaleString('en-IN')}</Text>
        <Text style={styles.cardLabel}>{label}</Text>
      </View>
      <View style={[styles.cardAccent, {backgroundColor: color}]} />
    </View>
  );
};

const styles = StyleSheet.create({
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
    overflow: 'hidden',
    position: 'relative',
  },
  cardContent: {
    padding: 16,
    paddingRight: 20,
  },
  cardAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 4,
  },
});
