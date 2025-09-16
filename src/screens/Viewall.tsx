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
  Modal,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  donationAPI,
  DonationApiError,
  Donator,
  donationUtils,
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
type AmountRangeFilter = 'ALL' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'CUSTOM';
type BalanceRangeFilter = 'ALL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'ZERO';
type SortOption =
  | 'NAME_ASC'
  | 'NAME_DESC'
  | 'AMOUNT_ASC'
  | 'AMOUNT_DESC'
  | 'BALANCE_ASC'
  | 'BALANCE_DESC'
  | 'DONATIONS_COUNT';

interface FilterState {
  status: FilterType;
  amountRange: AmountRangeFilter;
  balanceRange: BalanceRangeFilter;
  addedBy: string;
  donationsCount: 'ALL' | 'SINGLE' | 'MULTIPLE';
  priority: 'ALL' | 'HIGH_PRIORITY' | 'LOW_PRIORITY';
  sortBy: SortOption;
  customAmountMin: string;
  customAmountMax: string;
}

const ViewAll = () => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const navigation = useNavigation<NavigationProp>();
  const {user} = useAuth();

  const [allDonators, setAllDonators] = useState<Donator[]>([]);
  const [filteredDonators, setFilteredDonators] = useState<Donator[]>([]);
  const [summary, setSummary] = useState<DonationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);

  // Enhanced filter state
  const [filters, setFilters] = useState<FilterState>({
    status: 'ALL',
    amountRange: 'ALL',
    balanceRange: 'ALL',
    addedBy: 'ALL',
    donationsCount: 'ALL',
    priority: 'ALL',
    sortBy: 'NAME_ASC',
    customAmountMin: '',
    customAmountMax: '',
  });

  // Keep track of active filters count
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  useEffect(() => {
    loadAllDonations();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('ViewAll screen focused, refreshing data...');
      loadAllDonations();
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    filterAndSortDonations();
    updateActiveFiltersCount();
  }, [allDonators, searchQuery, filters]);

  const loadAllDonations = async () => {
    try {
      setIsLoading(true);

      const [donatorsData, summaryData] = await Promise.all([
        donationAPI.getAllDonators(),
        donationAPI.getDonationSummary(),
      ]);

      setAllDonators(donatorsData);
      setSummary(summaryData);

      // Extract unique users who added donations
      const users = new Set<string>();
      donatorsData.forEach(donator => {
        donator.donations.forEach(donation => {
          if (donation.user?.name) {
            users.add(donation.user.name);
          }
        });
      });
      setAvailableUsers(Array.from(users));
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

  const updateActiveFiltersCount = () => {
    let count = 0;
    if (filters.status !== 'ALL') count++;
    if (filters.amountRange !== 'ALL') count++;
    if (filters.balanceRange !== 'ALL') count++;
    if (filters.addedBy !== 'ALL') count++;
    if (filters.donationsCount !== 'ALL') count++;
    if (filters.priority !== 'ALL') count++;
    if (searchQuery.trim()) count++;
    setActiveFiltersCount(count);
  };

  const filterAndSortDonations = () => {
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
    if (filters.status !== 'ALL') {
      filtered = filtered.filter(donator => {
        const status = getDonationStatus(donator);
        return status === filters.status;
      });
    }

    // Apply amount range filter
    if (filters.amountRange !== 'ALL') {
      filtered = filtered.filter(donator => {
        const totalAmount = getTotalAmount(donator);
        return matchesAmountRange(totalAmount, filters.amountRange);
      });
    }

    // Apply balance range filter
    if (filters.balanceRange !== 'ALL') {
      filtered = filtered.filter(donator => {
        const totalBalance = getTotalBalance(donator);
        return matchesBalanceRange(totalBalance, filters.balanceRange);
      });
    }

    // Apply added by filter
    if (filters.addedBy !== 'ALL') {
      filtered = filtered.filter(donator =>
        donator.donations.some(
          donation => donation.user?.name === filters.addedBy,
        ),
      );
    }

    // Apply donations count filter
    if (filters.donationsCount !== 'ALL') {
      filtered = filtered.filter(donator => {
        const count = donator.donations.length;
        if (filters.donationsCount === 'SINGLE') return count === 1;
        if (filters.donationsCount === 'MULTIPLE') return count > 1;
        return true;
      });
    }

    // Apply priority filter
    if (filters.priority !== 'ALL') {
      filtered = filtered.filter(donator => {
        const balance = getTotalBalance(donator);
        if (filters.priority === 'HIGH_PRIORITY') return balance > 10000;
        if (filters.priority === 'LOW_PRIORITY')
          return balance <= 1000 && balance > 0;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'NAME_ASC':
          return a.name.localeCompare(b.name);
        case 'NAME_DESC':
          return b.name.localeCompare(a.name);
        case 'AMOUNT_ASC':
          return getTotalAmount(a) - getTotalAmount(b);
        case 'AMOUNT_DESC':
          return getTotalAmount(b) - getTotalAmount(a);
        case 'BALANCE_ASC':
          return getTotalBalance(a) - getTotalBalance(b);
        case 'BALANCE_DESC':
          return getTotalBalance(b) - getTotalBalance(a);
        case 'DONATIONS_COUNT':
          return b.donations.length - a.donations.length;
        default:
          return 0;
      }
    });

    setFilteredDonators(filtered);
  };

  const matchesAmountRange = (
    amount: number,
    range: AmountRangeFilter,
  ): boolean => {
    switch (range) {
      case 'SMALL':
        return amount < 5000;
      case 'MEDIUM':
        return amount >= 5000 && amount <= 25000;
      case 'LARGE':
        return amount > 25000;
      case 'CUSTOM':
        const min = parseFloat(filters.customAmountMin) || 0;
        const max = parseFloat(filters.customAmountMax) || Infinity;
        return amount >= min && amount <= max;
      default:
        return true;
    }
  };

  const matchesBalanceRange = (
    balance: number,
    range: BalanceRangeFilter,
  ): boolean => {
    switch (range) {
      case 'ZERO':
        return balance === 0;
      case 'LOW':
        return balance > 0 && balance <= 1000;
      case 'MEDIUM':
        return balance > 1000 && balance <= 10000;
      case 'HIGH':
        return balance > 10000;
      default:
        return true;
    }
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

  const clearAllFilters = () => {
    setFilters({
      status: 'ALL',
      amountRange: 'ALL',
      balanceRange: 'ALL',
      addedBy: 'ALL',
      donationsCount: 'ALL',
      priority: 'ALL',
      sortBy: 'NAME_ASC',
      customAmountMin: '',
      customAmountMax: '',
    });
    setSearchQuery('');
  };

  const handleEditDonator = (donatorId: number) => {
    navigation.navigate('EditDonator', {donatorId});
  };
  // Add this function to your ViewAll component
  const handleDownloadPDF = async () => {
    // Show confirmation dialog first
    donationUtils.showPDFDownloadDialog(
      async () => {
        try {
          setIsGeneratingPDF(true);

          // Download PDF from API
          const pdfResponse = await donationAPI.downloadDonorsPDF();

          // Generate filename with timestamp
          const filename = donationUtils.generatePDFFilename();

          // Save to device (you'll need react-native-fs for actual file saving)
          const base64 = await donationUtils.savePDFToDevice(
            pdfResponse.blob,
            filename,
          );

          // Show success dialog
          donationUtils.showPDFSuccessDialog(filename);
        } catch (error) {
          if (error instanceof DonationApiError) {
            donationUtils.showPDFErrorDialog(error.message);
          } else {
            donationUtils.showPDFErrorDialog('Failed to download PDF report');
          }
        } finally {
          setIsGeneratingPDF(false);
        }
      },
      () => {
        // User cancelled - do nothing
        console.log('PDF download cancelled');
      },
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      animationType="slide"
      presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowFilterModal(false)}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Filters & Sort</Text>
          <TouchableOpacity onPress={clearAllFilters}>
            <Text style={styles.modalClear}>Clear All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Status Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Payment Status</Text>
            <View style={styles.filterOptions}>
              {(['ALL', 'PAID', 'PARTIAL', 'PENDING'] as FilterType[]).map(
                status => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterOption,
                      filters.status === status && styles.filterOptionActive,
                    ]}
                    onPress={() => setFilters(prev => ({...prev, status}))}>
                    <Text
                      style={[
                        styles.filterOptionText,
                        filters.status === status &&
                          styles.filterOptionTextActive,
                      ]}>
                      {status}
                    </Text>
                  </TouchableOpacity>
                ),
              )}
            </View>
          </View>

          {/* Amount Range Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Total Amount Range</Text>
            <View style={styles.filterOptions}>
              {(
                [
                  {key: 'ALL', label: 'All Amounts'},
                  {key: 'SMALL', label: 'Under ₹5,000'},
                  {key: 'MEDIUM', label: '₹5,000 - ₹25,000'},
                  {key: 'LARGE', label: 'Above ₹25,000'},
                ] as Array<{key: AmountRangeFilter; label: string}>
              ).map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterOption,
                    filters.amountRange === option.key &&
                      styles.filterOptionActive,
                  ]}
                  onPress={() =>
                    setFilters(prev => ({...prev, amountRange: option.key}))
                  }>
                  <Text
                    style={[
                      styles.filterOptionText,
                      filters.amountRange === option.key &&
                        styles.filterOptionTextActive,
                    ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Balance Range Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Outstanding Balance</Text>
            <View style={styles.filterOptions}>
              {(
                [
                  {key: 'ALL', label: 'All Balances'},
                  {key: 'ZERO', label: 'Fully Paid (₹0)'},
                  {key: 'LOW', label: 'Low (₹1 - ₹1,000)'},
                  {key: 'MEDIUM', label: 'Medium (₹1,001 - ₹10,000)'},
                  {key: 'HIGH', label: 'High (₹10,000+)'},
                ] as Array<{key: BalanceRangeFilter; label: string}>
              ).map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterOption,
                    filters.balanceRange === option.key &&
                      styles.filterOptionActive,
                  ]}
                  onPress={() =>
                    setFilters(prev => ({...prev, balanceRange: option.key}))
                  }>
                  <Text
                    style={[
                      styles.filterOptionText,
                      filters.balanceRange === option.key &&
                        styles.filterOptionTextActive,
                    ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Added By Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Added By</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filters.addedBy === 'ALL' && styles.filterOptionActive,
                ]}
                onPress={() => setFilters(prev => ({...prev, addedBy: 'ALL'}))}>
                <Text
                  style={[
                    styles.filterOptionText,
                    filters.addedBy === 'ALL' && styles.filterOptionTextActive,
                  ]}>
                  All Users
                </Text>
              </TouchableOpacity>
              {availableUsers.map(userName => (
                <TouchableOpacity
                  key={userName}
                  style={[
                    styles.filterOption,
                    filters.addedBy === userName && styles.filterOptionActive,
                  ]}
                  onPress={() =>
                    setFilters(prev => ({...prev, addedBy: userName}))
                  }>
                  <Text
                    style={[
                      styles.filterOptionText,
                      filters.addedBy === userName &&
                        styles.filterOptionTextActive,
                    ]}>
                    {userName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Priority Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Priority Level</Text>
            <View style={styles.filterOptions}>
              {(
                [
                  {key: 'ALL', label: 'All Priority'},
                  {
                    key: 'HIGH_PRIORITY',
                    label: 'High Priority (₹10,000+ balance)',
                  },
                  {
                    key: 'LOW_PRIORITY',
                    label: 'Low Priority (≤₹1,000 balance)',
                  },
                ] as Array<{
                  key: 'ALL' | 'HIGH_PRIORITY' | 'LOW_PRIORITY';
                  label: string;
                }>
              ).map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterOption,
                    filters.priority === option.key &&
                      styles.filterOptionActive,
                  ]}
                  onPress={() =>
                    setFilters(prev => ({...prev, priority: option.key}))
                  }>
                  <Text
                    style={[
                      styles.filterOptionText,
                      filters.priority === option.key &&
                        styles.filterOptionTextActive,
                    ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sort Options */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Sort By</Text>
            <View style={styles.filterOptions}>
              {(
                [
                  {key: 'NAME_ASC', label: 'Name (A-Z)'},
                  {key: 'NAME_DESC', label: 'Name (Z-A)'},
                  {key: 'AMOUNT_DESC', label: 'Highest Amount First'},
                  {key: 'AMOUNT_ASC', label: 'Lowest Amount First'},
                  {key: 'BALANCE_DESC', label: 'Highest Balance First'},
                  {key: 'BALANCE_ASC', label: 'Lowest Balance First'},
                  {key: 'DONATIONS_COUNT', label: 'Most Donations First'},
                ] as Array<{key: SortOption; label: string}>
              ).map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterOption,
                    filters.sortBy === option.key && styles.filterOptionActive,
                  ]}
                  onPress={() =>
                    setFilters(prev => ({...prev, sortBy: option.key}))
                  }>
                  <Text
                    style={[
                      styles.filterOptionText,
                      filters.sortBy === option.key &&
                        styles.filterOptionTextActive,
                    ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => setShowFilterModal(false)}>
            <Text style={styles.applyButtonText}>
              Apply Filters ({filteredDonators.length} results)
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  const renderDonatorCard = ({item}: {item: Donator}) => {
    const status = getDonationStatus(item);
    const totalAmount = getTotalAmount(item);
    const totalPaid = getTotalPaidAmount(item);
    const totalBalance = getTotalBalance(item);
    const isHighPriority = totalBalance > 10000;

    return (
      <TouchableOpacity
        style={[styles.donatorCard, isHighPriority && styles.highPriorityCard]}
        onPress={() => handleEditDonator(item.id)}
        activeOpacity={0.7}>
        {isHighPriority && (
          <View style={styles.priorityBadge}>
            <Text style={styles.priorityText}>🔥 HIGH PRIORITY</Text>
          </View>
        )}

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
        {searchQuery || activeFiltersCount > 0
          ? 'Try adjusting your search or filters'
          : 'Add your first donator to get started'}
      </Text>
      {activeFiltersCount > 0 && (
        <TouchableOpacity
          style={styles.clearFiltersButton}
          onPress={clearAllFilters}>
          <Text style={styles.clearFiltersText}>Clear all filters</Text>
        </TouchableOpacity>
      )}
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

      {/* Enhanced Filter Controls */}
      <View style={styles.filterControlsContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}>
          <Text style={styles.filterButtonIcon}>⚙️</Text>
          <Text style={styles.filterButtonText}>
            Filters & Sort
            {activeFiltersCount > 0 && (
              <Text style={styles.filterBadge}> ({activeFiltersCount})</Text>
            )}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resultsButton}>
          <Text style={styles.resultsText}>
            {filteredDonators.length} results
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.pdfButton}
          onPress={handleDownloadPDF}
          disabled={isGeneratingPDF}>
          <Text style={styles.pdfButtonText}>
            {isGeneratingPDF ? '⏳' : '📄'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Active Filters Preview */}
      {activeFiltersCount > 0 && (
        <View style={styles.activeFiltersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filters.status !== 'ALL' && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>
                  Status: {filters.status}
                </Text>
              </View>
            )}
            {filters.amountRange !== 'ALL' && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>
                  Amount: {filters.amountRange}
                </Text>
              </View>
            )}
            {filters.balanceRange !== 'ALL' && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>
                  Balance: {filters.balanceRange}
                </Text>
              </View>
            )}
            {filters.addedBy !== 'ALL' && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>
                  By: {filters.addedBy}
                </Text>
              </View>
            )}
            {filters.priority !== 'ALL' && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>
                  {filters.priority.replace('_', ' ')}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.clearAllChip}
              onPress={clearAllFilters}>
              <Text style={styles.clearAllText}>Clear All ✕</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

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

      {/* Filter Modal */}
      {renderFilterModal()}
    </SafeAreaView>
  );
};

// Helper functions for status colors (unchanged)
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
    shadowOffset: {width: 0, height: 1},
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
    shadowOffset: {width: 0, height: 1},
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
  filterControlsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
    alignItems: 'center',
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flex: 1,
  },
  filterButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  filterBadge: {
    color: '#60A5FA',
    fontWeight: '600',
  },
  resultsButton: {
    backgroundColor: '#60A5FA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  resultsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  activeFiltersContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  activeFilterChip: {
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  activeFilterText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '500',
  },
  clearAllChip: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  clearAllText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
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
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  highPriorityCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  priorityBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
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
    marginBottom: 16,
  },
  clearFiltersButton: {
    backgroundColor: '#60A5FA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearFiltersText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCancel: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalClear: {
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  // Add to your StyleSheet.create():
  pdfButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#60A5FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  pdfButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  filterOptions: {
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  filterOptionActive: {
    backgroundColor: '#60A5FA',
    borderColor: '#60A5FA',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#FFFFFF',
  },
  modalFooter: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  applyButton: {
    backgroundColor: '#60A5FA',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ViewAll;
