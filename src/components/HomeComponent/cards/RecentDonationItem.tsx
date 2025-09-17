import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Donator} from '../../../Api/donationAPI';
import {StatusBadge} from '../badges/StatusBadge';

interface RecentDonationItemProps {
  donator: Donator;
  totalAmount: number;
  totalPaid: number;
  totalBalance: number;
  status: 'PAID' | 'PARTIAL' | 'PENDING';
  paymentMethods: string[];
  users: string[];
}

export const RecentDonationItem: React.FC<RecentDonationItemProps> = ({
  donator,
  totalAmount,
  totalPaid,
  totalBalance,
  status,
  paymentMethods,
  users,
}) => {
  return (
    <View style={styles.recentItem}>
      <View style={styles.recentHeader}>
        <Text style={styles.recentName}>{donator.name}</Text>
        <StatusBadge status={status} />
      </View>

      <View style={styles.recentAmounts}>
        <View style={styles.recentAmount}>
          <Text style={styles.recentAmountLabel}>Total</Text>
          <Text style={styles.recentAmountValue}>
            ₹{totalAmount.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={styles.recentAmount}>
          <Text style={styles.recentAmountLabel}>Paid</Text>
          <Text style={[styles.recentAmountValue, {color: '#22C55E'}]}>
            ₹{totalPaid.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={styles.recentAmount}>
          <Text style={styles.recentAmountLabel}>Balance</Text>
          <Text style={[styles.recentAmountValue, {color: '#F59E0B'}]}>
            ₹{totalBalance.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      <View style={styles.recentMeta}>
        {donator.phone && (
          <Text style={styles.recentMetaText}>📞 {donator.phone}</Text>
        )}

        {/* {donator.donations.some(d => d.bookNumber) && (
          <Text style={styles.recentMetaText}>
            📚{' '}
            {Array.from(
              new Set(donator.donations.map(d => d.bookNumber).filter(Boolean)),
            ).join(', ')}
          </Text>
        )} */}

        {/* {paymentMethods.length > 0 && (
          <Text style={styles.recentMetaText}>
            💳 {paymentMethods.join(', ')}
          </Text>
        )} */}

        {/* {users.length > 0 && (
          <Text style={styles.recentMetaText}>👤 {users.join(', ')}</Text>
        )} */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  recentItem: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
    flex: 1,
    marginRight: 12,
  },
  recentAmounts: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  recentAmount: {
    flex: 1,
  },
  recentAmountLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 2,
  },
  recentAmountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  recentMeta: {
    gap: 4,
  },
  recentMetaText: {
    fontSize: 12,
    color: '#64748B',
  },
});
