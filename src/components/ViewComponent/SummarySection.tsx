import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {DonationSummary} from '../../Api/donationAPI';

interface SummarySectionProps {
  summary: DonationSummary | null;
}

const SummarySection: React.FC<SummarySectionProps> = ({summary}) => {
  return (
    <View style={styles.summarySection}>
      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            ₹{summary?.totalAmount.toLocaleString('en-IN') || '0'}
          </Text>
          <Text style={styles.summaryLabel}>Total Amount</Text>
          <View
            style={[styles.summaryIndicator, {backgroundColor: '#60A5FA'}]}
          />
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            ₹{summary?.totalPaid.toLocaleString('en-IN') || '0'}
          </Text>
          <Text style={styles.summaryLabel}>Paid Amount</Text>
          <View
            style={[styles.summaryIndicator, {backgroundColor: '#22C55E'}]}
          />
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            ₹{summary?.totalBalance.toLocaleString('en-IN') || '0'}
          </Text>
          <Text style={styles.summaryLabel}>Balance Due</Text>
          <View
            style={[styles.summaryIndicator, {backgroundColor: '#F59E0B'}]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  summarySection: {
    padding: 20,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
    alignItems: 'center',
    position: 'relative',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
    textAlign: 'center',
  },
  summaryIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 3,
    borderRadius: 1.5,
  },
});

export default SummarySection;
