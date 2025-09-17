import React from 'react';
import {View, StyleSheet} from 'react-native';
import {SummaryCard} from '../cards/SummaryCard';
import {DonationSummary} from '../../../Api/donationAPI';

interface SummarySectionProps {
  summary: DonationSummary | null;
}

export const SummarySection: React.FC<SummarySectionProps> = ({summary}) => {
  return (
    <View style={styles.summarySection}>
      <View style={styles.summaryGrid}>
        <SummaryCard
          amount={summary?.totalAmount || 0}
          label="Total Amount"
          color="#60A5FA"
        />
        <SummaryCard
          amount={summary?.totalPaid || 0}
          label="Paid Amount"
          color="#22C55E"
        />
        <SummaryCard
          amount={summary?.totalBalance || 0}
          label="Balance Due"
          color="#F59E0B"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  summarySection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
});
