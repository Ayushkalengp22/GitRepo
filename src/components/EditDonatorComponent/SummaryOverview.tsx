import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Donator} from '../../Api/donationAPI';

interface SummaryOverviewProps {
  donatorData: Donator;
}

const SummaryOverview: React.FC<SummaryOverviewProps> = ({donatorData}) => {
  const getTotalAmount = () => {
    return donatorData.donations.reduce(
      (sum, donation) => sum + donation.amount,
      0,
    );
  };

  const getTotalPaid = () => {
    return donatorData.donations.reduce(
      (sum, donation) => sum + donation.paidAmount,
      0,
    );
  };

  const getTotalBalance = () => {
    return donatorData.donations.reduce(
      (sum, donation) => sum + donation.balance,
      0,
    );
  };

  return (
    <View style={styles.summarySection}>
      <Text style={styles.sectionTitle}>Current Overview</Text>
      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            ₹{getTotalAmount().toLocaleString('en-IN')}
          </Text>
          <Text style={styles.summaryLabel}>Total Amount</Text>
          <View
            style={[styles.summaryIndicator, {backgroundColor: '#60A5FA'}]}
          />
        </View>

        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, {color: '#22C55E'}]}>
            ₹{getTotalPaid().toLocaleString('en-IN')}
          </Text>
          <Text style={styles.summaryLabel}>Paid Amount</Text>
          <View
            style={[styles.summaryIndicator, {backgroundColor: '#22C55E'}]}
          />
        </View>

        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, {color: '#F59E0B'}]}>
            ₹{getTotalBalance().toLocaleString('en-IN')}
          </Text>
          <Text style={styles.summaryLabel}>Balance Due</Text>
          <View
            style={[styles.summaryIndicator, {backgroundColor: '#F59E0B'}]}
          />
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <Text style={styles.progressText}>
          Collection Progress:{' '}
          {((getTotalPaid() / getTotalAmount()) * 100).toFixed(1)}%
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(getTotalPaid() / getTotalAmount()) * 100}%`,
              },
            ]}
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
    alignItems: 'center',
    position: 'relative',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 11,
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
  progressSection: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 12,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#60A5FA',
    borderRadius: 3,
  },
});

export default SummaryOverview;
