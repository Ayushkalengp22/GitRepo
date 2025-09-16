import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  ScrollView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  donationAPI,
  DonationApiError,
  Donator,
  DonationSummary,
} from '../Api/donationAPI';
import {useAuth} from '../context/AuthContext';

// Navigation type
type RootStackParamList = {
  Home: undefined;
  Details: undefined;
  AddDonator: undefined;
  ViewAll: undefined;
  EditDonator: {donatorId: number};
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Filter types
type FilterType = 'ALL' | 'PAID' | 'PARTIAL' | 'PENDING';

const ViewAll = () => {
  const navigation = useNavigation<NavigationProp>();
  const {user} = useAuth();

  const [allDonators, setAllDonators] = useState<Donator[]>([]);
  const [filteredDonators, setFilteredDonators] = useState<Donator[]>([]);
  const [summary, setSummary] = useState<DonationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');

  useEffect(() => {
    loadAllDonations();
  }, []);

  // Add navigation listener to refresh data when returning from edit screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('ViewAll screen focused, refreshing data...');
      loadAllDonations();
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    filterDonations();
  }, [allDonators, searchQuery, activeFilter]);

  const loadAllDonations = async () => {
    try {
      setIsLoading(true);

      const [donatorsData, summaryData] = await Promise.all([
        donationAPI.getAllDonators(),
        donationAPI.getDonationSummary(),
      ]);

      setAllDonators(donatorsData);
      setSummary(summaryData);
    } catch (error) {
      if (error instanceof DonationApiError) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Error', 'Failed to load donations');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadAllDonations();
    setIsRefreshing(false);
  };

  const filterDonations = () => {
    let filtered = [...allDonators];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        donator =>
          donator.name.toLowerCase().includes(query) ||
          donator.phone?.toLowerCase().includes(query) ||
          donator.address?.toLowerCase().includes(query),
      );
    }

    // Apply status filter
    if (activeFilter !== 'ALL') {
      filtered = filtered.filter(donator => {
        const status = getDonationStatus(donator);
        return status === activeFilter;
      });
    }

    setFilteredDonators(filtered);
  };

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

  const getFilterCount = (filter: FilterType): number => {
    if (filter === 'ALL') return allDonators.length;
    return allDonators.filter(donator => getDonationStatus(donator) === filter)
      .length;
  };

  const handleEditDonator = (donatorId: number) => {
    navigation.navigate('EditDonator', {donatorId});
  };

  const renderDonatorCard = ({item}: {item: Donator}) => {
    const status = getDonationStatus(item);
    const totalAmount = getTotalAmount(item);
    const totalPaid = getTotalPaidAmount(item);
    const totalBalance = getTotalBalance(item);

    return (
      <TouchableOpacity
        style={styles.donatorCard}
        onPress={() => handleEditDonator(item.id)}
        activeOpacity={0.7}>
        <View style={styles.cardHeader}>
          <Text style={styles.donatorName}>{item.name}</Text>
          <View style={styles.cardActions}>
            <View
              style={[
                styles.statusBadge,
                {backgroundColor: getStatusBadgeColor(status)},
              ]}>
              <Text
                style={[
                  styles.statusText,
                  {color: getStatusTextColor(status)},
                ]}>
                {status}
              </Text>
            </View>
            <Text style={styles.editHint}>Tap to edit</Text>
          </View>
        </View>

        <View style={styles.donatorInfo}>
          {item.phone && <Text style={styles.infoText}>📞 {item.phone}</Text>}
          {item.address && (
            <Text style={styles.infoText}>📍 {item.address}</Text>
          )}
          {item.donations.length > 0 && item.donations[0].user && (
            <Text style={styles.infoText}>
              👤 Added by: {item.donations[0].user.name}
            </Text>
          )}
        </View>

        <View style={styles.amountContainer}>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Total Amount:</Text>
            <Text style={styles.amountValue}>
              ₹{totalAmount.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Paid Amount:</Text>
            <Text style={[styles.amountValue, {color: '#22C55E'}]}>
              ₹{totalPaid.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Balance:</Text>
            <Text style={[styles.amountValue, {color: '#F97316'}]}>
              ₹{totalBalance.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        <View style={styles.donationsCount}>
          <Text style={styles.donationsCountText}>
            {item.donations.length} donation
            {item.donations.length > 1 ? 's' : ''}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>No donations found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? 'Try adjusting your search or filter'
          : 'Add your first donator to get started'}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#60A5FA" />
        <Text style={styles.loadingText}>Loading all donations...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>All Donations</Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.miniSummaryCard, {borderLeftColor: '#60A5FA'}]}>
          <Text style={styles.miniSummaryAmount}>
            ₹{summary?.totalAmount.toLocaleString('en-IN') || '0'}
          </Text>
          <Text style={styles.miniSummaryLabel}>Total</Text>
        </View>

        <View style={[styles.miniSummaryCard, {borderLeftColor: '#22C55E'}]}>
          <Text style={styles.miniSummaryAmount}>
            ₹{summary?.totalPaid.toLocaleString('en-IN') || '0'}
          </Text>
          <Text style={styles.miniSummaryLabel}>Paid</Text>
        </View>

        <View style={[styles.miniSummaryCard, {borderLeftColor: '#F97316'}]}>
          <Text style={styles.miniSummaryAmount}>
            ₹{summary?.totalBalance.toLocaleString('en-IN') || '0'}
          </Text>
          <Text style={styles.miniSummaryLabel}>Balance</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, phone, or address..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['ALL', 'PAID', 'PARTIAL', 'PENDING'] as FilterType[]).map(
            filter => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  activeFilter === filter && styles.filterButtonActive,
                ]}
                onPress={() => setActiveFilter(filter)}>
                <Text
                  style={[
                    styles.filterButtonText,
                    activeFilter === filter && styles.filterButtonTextActive,
                  ]}>
                  {filter} ({getFilterCount(filter)})
                </Text>
              </TouchableOpacity>
            ),
          )}
        </ScrollView>
      </View>

      {/* Donations List */}
      <FlatList
        data={filteredDonators}
        renderItem={renderDonatorCard}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

// Helper functions for status colors
const getStatusBadgeColor = (status: FilterType) => {
  switch (status) {
    case 'PAID':
      return '#DCFCE7';
    case 'PARTIAL':
      return '#FEF3C7';
    case 'PENDING':
      return '#FEE2E2';
    default:
      return '#F3F4F6';
  }
};

const getStatusTextColor = (status: FilterType) => {
  switch (status) {
    case 'PAID':
      return '#166534';
    case 'PARTIAL':
      return '#92400E';
    case 'PENDING':
      return '#DC2626';
    default:
      return '#6B7280';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  backIcon: {
    fontSize: 20,
    color: '#374151',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 20,
    gap: 12,
  },
  miniSummaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  miniSummaryAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  miniSummaryLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 20,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#60A5FA',
    borderColor: '#60A5FA',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  donatorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  donatorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  cardActions: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
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
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  amountContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  donationsCount: {
    alignItems: 'center',
  },
  donationsCountText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default ViewAll;
