import React from 'react';
import {
  View,
  Text,
  Modal,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {BookSummary, Donation, PaymentMethod} from '../../../Api/donationAPI';

interface BookDetailsModalProps {
  visible: boolean;
  selectedBookSummary: BookSummary | null;
  selectedBookDonations: Donation[];
  isLoadingBookDetails: boolean;
  onClose: () => void;
}

const BookDetailsModal: React.FC<BookDetailsModalProps> = ({
  visible,
  selectedBookSummary,
  selectedBookDonations,
  isLoadingBookDetails,
  onClose,
}) => {
  // Helper functions for status colors
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

  // Helper function to get payment method colors
  const getPaymentMethodColor = (method: PaymentMethod): string => {
    switch (method) {
      case 'Cash':
        return '#1F2937';
      case 'Online':
        return '#1E40AF';
      case 'Not Done':
        return '#DC2626';
      default:
        return '#374151';
    }
  };

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="pageSheet">
      <View style={styles.modalBackground}>
        <SafeAreaView style={styles.bookDetailsContainer}>
          <View style={styles.bookDetailsHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.bookDetailsTitle}>
              Book {selectedBookSummary?.bookNumber}
            </Text>
            <View style={styles.bookDetailsPlaceholder} />
          </View>

          {selectedBookSummary && (
            <View style={styles.bookDetailsSummary}>
              <View style={styles.summaryStatsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    ₹{selectedBookSummary.totalAmount.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.statLabel}>Total Amount</Text>
                  <View
                    style={[styles.statIndicator, {backgroundColor: '#60A5FA'}]}
                  />
                </View>

                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    ₹{selectedBookSummary.totalPaid.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.statLabel}>Paid Amount</Text>
                  <View
                    style={[styles.statIndicator, {backgroundColor: '#22C55E'}]}
                  />
                </View>

                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    ₹{selectedBookSummary.totalBalance.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.statLabel}>Balance Due</Text>
                  <View
                    style={[styles.statIndicator, {backgroundColor: '#F59E0B'}]}
                  />
                </View>
              </View>

              <View style={styles.progressSection}>
                <Text style={styles.progressTitle}>Collection Progress</Text>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${
                            (selectedBookSummary.totalPaid /
                              selectedBookSummary.totalAmount) *
                            100
                          }%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {(
                      (selectedBookSummary.totalPaid /
                        selectedBookSummary.totalAmount) *
                      100
                    ).toFixed(1)}
                    %
                  </Text>
                </View>
              </View>
            </View>
          )}

          <ScrollView
            style={styles.donationsList}
            showsVerticalScrollIndicator={false}>
            <Text style={styles.donationsTitle}>
              Donations ({selectedBookDonations.length})
            </Text>

            {isLoadingBookDetails ? (
              <View style={styles.loadingSection}>
                <ActivityIndicator size="large" color="#60A5FA" />
                <Text style={styles.loadingText}>Loading donations...</Text>
              </View>
            ) : (
              selectedBookDonations.map(donation => (
                <View key={donation.id} style={styles.donationItem}>
                  <View style={styles.donationHeader}>
                    <Text style={styles.donorName}>
                      {donation.donator?.name || 'Unknown Donor'}
                    </Text>
                    <View
                      style={[
                        styles.statusChip,
                        {backgroundColor: getStatusBadgeColor(donation.status)},
                      ]}>
                      <Text
                        style={[
                          styles.statusChipText,
                          {color: getStatusTextColor(donation.status)},
                        ]}>
                        {donation.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.donationAmounts}>
                    <View style={styles.amountItem}>
                      <Text style={styles.amountLabel}>Amount</Text>
                      <Text style={[styles.amountValue, {color: '#60A5FA'}]}>
                        ₹{donation.amount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.amountItem}>
                      <Text style={styles.amountLabel}>Paid</Text>
                      <Text style={[styles.amountValue, {color: '#22C55E'}]}>
                        ₹{donation.paidAmount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.amountItem}>
                      <Text style={styles.amountLabel}>Balance</Text>
                      <Text style={[styles.amountValue, {color: '#F59E0B'}]}>
                        ₹{donation.balance.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.donationMeta}>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Payment Method</Text>
                      <View
                        style={[
                          styles.paymentChip,
                          {
                            backgroundColor: getPaymentMethodColor(
                              donation.paymentMethod,
                            ),
                          },
                        ]}>
                        <Text style={styles.paymentChipText}>
                          {donation.paymentMethod}
                        </Text>
                      </View>
                    </View>
                    {donation.user?.name && (
                      <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Added by</Text>
                        <Text style={styles.metaValue}>
                          {donation.user.name}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  bookDetailsContainer: {
    flex: 1,
  },
  bookDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.2)',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '500',
  },
  bookDetailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  bookDetailsPlaceholder: {
    width: 32,
  },
  bookDetailsSummary: {
    margin: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  summaryStatsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    paddingBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  statIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 3,
    borderRadius: 1.5,
  },
  progressSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.2)',
    paddingTop: 16,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 12,
    textAlign: 'center',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
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
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#60A5FA',
    minWidth: 40,
  },
  donationsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  donationsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 16,
  },
  loadingSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94A3B8',
  },
  donationItem: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  donationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  donorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
    flex: 1,
    marginRight: 12,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  donationAmounts: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  amountItem: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  donationMeta: {
    flexDirection: 'row',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.2)',
    paddingTop: 12,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 4,
  },
  paymentChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  paymentChipText: {
    fontSize: 11,
    color: '#F1F5F9',
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '500',
  },
});

export default BookDetailsModal;
