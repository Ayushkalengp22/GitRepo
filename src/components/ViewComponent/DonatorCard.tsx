import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Donator} from '../../Api/donationAPI';

type FilterType = 'ALL' | 'PAID' | 'PARTIAL' | 'PENDING';

interface DonatorCardProps {
  donator: Donator;
  onPress: (donatorId: number) => void;
}

const DonatorCard: React.FC<DonatorCardProps> = ({donator, onPress}) => {
  // Helper functions
  const getDonationStatus = (donator: Donator): FilterType => {
    const totalAmount = getTotalAmount(donator);
    const totalPaid = getTotalPaidAmount(donator);

    if (totalPaid >= totalAmount) return 'PAID';
    if (totalPaid > 0) return 'PARTIAL';
    return 'PENDING';
  };

  const getTotalAmount = (donator: Donator) => {
    return donator.donations.reduce(
      (sum, donation) => sum + donation.amount,
      0,
    );
  };

  const getTotalPaidAmount = (donator: Donator) => {
    return donator.donations.reduce(
      (sum, donation) => sum + donation.paidAmount,
      0,
    );
  };

  const getTotalBalance = (donator: Donator) => {
    return donator.donations.reduce(
      (sum, donation) => sum + donation.balance,
      0,
    );
  };

  const getStatusBadgeColor = (status: FilterType) => {
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

  const getStatusTextColor = (status: FilterType) => {
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

  const status = getDonationStatus(donator);
  const totalAmount = getTotalAmount(donator);
  const totalPaid = getTotalPaidAmount(donator);
  const totalBalance = getTotalBalance(donator);
  const isHighPriority = totalBalance > 10000;

  return (
    <TouchableOpacity
      style={[styles.donatorCard, isHighPriority && styles.highPriorityCard]}
      onPress={() => onPress(donator.id)}
      activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.donatorName}>{donator.name}</Text>
          {isHighPriority && (
            <View style={styles.priorityBadge}>
              <Text style={styles.priorityIcon}>🔥</Text>
              <Text style={styles.priorityText}>HIGH PRIORITY</Text>
            </View>
          )}
        </View>
        <View style={styles.cardHeaderRight}>
          <View
            style={[
              styles.statusBadge,
              {backgroundColor: getStatusBadgeColor(status)},
            ]}>
            <Text
              style={[styles.statusText, {color: getStatusTextColor(status)}]}>
              {status}
            </Text>
          </View>
          <Text style={styles.editHint}>Tap to edit</Text>
        </View>
      </View>

      <View style={styles.donatorInfo}>
        {donator.phone && (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📞</Text>
            <Text style={styles.infoText}>{donator.phone}</Text>
          </View>
        )}
        {donator.address && (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <Text style={styles.infoText}>{donator.address}</Text>
          </View>
        )}
        {donator.donations.length > 0 && donator.donations[0].user && (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>👤</Text>
            <Text style={styles.infoText}>
              Added by {donator.donations[0].user.name}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.amountSection}>
        <View style={styles.amountGrid}>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Total</Text>
            <Text style={[styles.amountValue, {color: '#60A5FA'}]}>
              ₹{totalAmount.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Paid</Text>
            <Text style={[styles.amountValue, {color: '#22C55E'}]}>
              ₹{totalPaid.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Balance</Text>
            <Text style={[styles.amountValue, {color: '#F59E0B'}]}>
              ₹{totalBalance.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(totalPaid / totalAmount) * 100}%`,
                  backgroundColor: totalBalance === 0 ? '#22C55E' : '#60A5FA',
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {((totalPaid / totalAmount) * 100).toFixed(0)}% complete
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.donationsCount}>
          {donator.donations.length} donation
          {donator.donations.length > 1 ? 's' : ''}
        </Text>
        <Text style={styles.viewMoreHint}>View details →</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  donatorCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  highPriorityCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 16,
  },
  donatorName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 8,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  priorityIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F59E0B',
    textTransform: 'uppercase',
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  editHint: {
    fontSize: 10,
    color: '#60A5FA',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  donatorInfo: {
    marginBottom: 16,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 12,
    marginRight: 8,
    width: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#94A3B8',
    flex: 1,
  },
  amountSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.2)',
    paddingTop: 16,
    marginBottom: 12,
  },
  amountGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  amountItem: {
    flex: 1,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 4,
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: '#60A5FA',
    fontWeight: '600',
    minWidth: 55,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.2)',
    paddingTop: 12,
  },
  donationsCount: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  viewMoreHint: {
    fontSize: 12,
    color: '#60A5FA',
    fontWeight: '500',
  },
});

export default DonatorCard;
