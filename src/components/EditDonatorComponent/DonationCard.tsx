import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Donation} from '../../Api/donationAPI';

interface DonationCardProps {
  donation: Donation;
  index: number;
  isSelected: boolean;
  onSelect: (donationId: number) => void;
}

const DonationCard: React.FC<DonationCardProps> = ({
  donation,
  index,
  isSelected,
  onSelect,
}) => {
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return '#065F46';
      case 'PARTIAL':
        return '#92400E';
      case 'PENDING':
        return '#991B1B';
      default:
        return '#374151';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return '#D1FAE5';
      case 'PARTIAL':
        return '#FDE68A';
      case 'PENDING':
        return '#FEE2E2';
      default:
        return '#D1D5DB';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.donationCard, isSelected && styles.donationCardSelected]}
      onPress={() => onSelect(donation.id)}
      activeOpacity={0.8}>
      <View style={styles.donationHeader}>
        <View style={styles.donationTitleContainer}>
          <Text style={styles.donationTitle}>Donation #{index + 1}</Text>
          {donation.bookNumber && (
            <Text style={styles.donationBook}>Book: {donation.bookNumber}</Text>
          )}
        </View>
        <View
          style={[
            styles.statusBadge,
            {backgroundColor: getStatusBadgeColor(donation.status)},
          ]}>
          <Text
            style={[
              styles.statusText,
              {color: getStatusTextColor(donation.status)},
            ]}>
            {donation.status}
          </Text>
        </View>
      </View>

      <View style={styles.donationAmounts}>
        <View style={styles.donationAmountItem}>
          <Text style={styles.donationAmountLabel}>Amount</Text>
          <Text style={[styles.donationAmountValue, {color: '#60A5FA'}]}>
            ₹{donation.amount.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={styles.donationAmountItem}>
          <Text style={styles.donationAmountLabel}>Paid</Text>
          <Text style={[styles.donationAmountValue, {color: '#22C55E'}]}>
            ₹{donation.paidAmount.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={styles.donationAmountItem}>
          <Text style={styles.donationAmountLabel}>Balance</Text>
          <Text style={[styles.donationAmountValue, {color: '#F59E0B'}]}>
            ₹{donation.balance.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      <View style={styles.donationMeta}>
        <View style={styles.paymentMethodChip}>
          <Text style={styles.paymentMethodIcon}>
            {donation.paymentMethod === 'Cash'
              ? '💵'
              : donation.paymentMethod === 'Online'
              ? '💳'
              : '⏳'}
          </Text>
          <Text style={styles.paymentMethodName}>{donation.paymentMethod}</Text>
        </View>
        {isSelected && (
          <Text style={styles.selectedIndicator}>Selected for editing</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  donationCard: {
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  donationCardSelected: {
    borderColor: 'rgba(96, 165, 250, 0.6)',
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderWidth: 2,
  },
  donationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  donationTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  donationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 2,
  },
  donationBook: {
    fontSize: 12,
    color: '#94A3B8',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  donationAmounts: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  donationAmountItem: {
    flex: 1,
  },
  donationAmountLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 4,
  },
  donationAmountValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  donationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.2)',
    paddingTop: 12,
  },
  paymentMethodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  paymentMethodIcon: {
    fontSize: 12,
  },
  paymentMethodName: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '500',
  },
  selectedIndicator: {
    fontSize: 11,
    color: '#60A5FA',
    fontStyle: 'italic',
    fontWeight: '500',
  },
});

export default DonationCard;
