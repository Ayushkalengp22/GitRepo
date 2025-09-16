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

  const handleDownloadPDF = async () => {
    donationUtils.showPDFDownloadDialog(
      async () => {
        try {
          setIsGeneratingPDF(true);
          const pdfResponse = await donationAPI.downloadDonorsPDF();
          const filename = donationUtils.generatePDFFilename();
          const base64 = await donationUtils.savePDFToDevice(
            pdfResponse.blob,
            filename,
          );
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
        console.log('PDF download cancelled');
      },
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      animationType="fade"
      presentationStyle="pageSheet">
      <View style={styles.modalBackground}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalHeaderButton}
              onPress={() => setShowFilterModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filters & Sort</Text>
            <TouchableOpacity
              style={styles.modalHeaderButton}
              onPress={clearAllFilters}>
              <Text style={styles.modalClear}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}>
            {/* Status Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Payment Status</Text>
              <View style={styles.filterOptionsGrid}>
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
              <Text style={styles.filterSectionTitle}>Amount Range</Text>
              <View style={styles.filterOptionsList}>
                {[
                  {key: 'ALL', label: 'All Amounts', icon: '💰'},
                  {key: 'SMALL', label: 'Under ₹5,000', icon: '🔸'},
                  {key: 'MEDIUM', label: '₹5,000 - ₹25,000', icon: '🔹'},
                  {key: 'LARGE', label: 'Above ₹25,000', icon: '🔷'},
                ].map(option => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.filterOptionRow,
                      filters.amountRange === option.key &&
                        styles.filterOptionRowActive,
                    ]}
                    onPress={() =>
                      setFilters(prev => ({
                        ...prev,
                        amountRange: option.key as AmountRangeFilter,
                      }))
                    }>
                    <Text style={styles.filterOptionIcon}>{option.icon}</Text>
                    <Text
                      style={[
                        styles.filterOptionRowText,
                        filters.amountRange === option.key &&
                          styles.filterOptionRowTextActive,
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
              <View style={styles.filterOptionsList}>
                {[
                  {key: 'ALL', label: 'All Balances', icon: '⚖️'},
                  {key: 'ZERO', label: 'Fully Paid (₹0)', icon: '✅'},
                  {key: 'LOW', label: 'Low (₹1 - ₹1,000)', icon: '🟢'},
                  {
                    key: 'MEDIUM',
                    label: 'Medium (₹1,001 - ₹10,000)',
                    icon: '🟡',
                  },
                  {key: 'HIGH', label: 'High (₹10,000+)', icon: '🔴'},
                ].map(option => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.filterOptionRow,
                      filters.balanceRange === option.key &&
                        styles.filterOptionRowActive,
                    ]}
                    onPress={() =>
                      setFilters(prev => ({
                        ...prev,
                        balanceRange: option.key as BalanceRangeFilter,
                      }))
                    }>
                    <Text style={styles.filterOptionIcon}>{option.icon}</Text>
                    <Text
                      style={[
                        styles.filterOptionRowText,
                        filters.balanceRange === option.key &&
                          styles.filterOptionRowTextActive,
                      ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Priority Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Priority Level</Text>
              <View style={styles.filterOptionsList}>
                {[
                  {key: 'ALL', label: 'All Priority', icon: '📋'},
                  {
                    key: 'HIGH_PRIORITY',
                    label: 'High Priority (₹10,000+ balance)',
                    icon: '🔥',
                  },
                  {
                    key: 'LOW_PRIORITY',
                    label: 'Low Priority (≤₹1,000 balance)',
                    icon: '❄️',
                  },
                ].map(option => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.filterOptionRow,
                      filters.priority === option.key &&
                        styles.filterOptionRowActive,
                    ]}
                    onPress={() =>
                      setFilters(prev => ({
                        ...prev,
                        priority: option.key as
                          | 'ALL'
                          | 'HIGH_PRIORITY'
                          | 'LOW_PRIORITY',
                      }))
                    }>
                    <Text style={styles.filterOptionIcon}>{option.icon}</Text>
                    <Text
                      style={[
                        styles.filterOptionRowText,
                        filters.priority === option.key &&
                          styles.filterOptionRowTextActive,
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
              <View style={styles.filterOptionsList}>
                {[
                  {key: 'NAME_ASC', label: 'Name (A-Z)', icon: '🔤'},
                  {key: 'NAME_DESC', label: 'Name (Z-A)', icon: '🔣'},
                  {
                    key: 'AMOUNT_DESC',
                    label: 'Highest Amount First',
                    icon: '⬆️',
                  },
                  {key: 'AMOUNT_ASC', label: 'Lowest Amount First', icon: '⬇️'},
                  {
                    key: 'BALANCE_DESC',
                    label: 'Highest Balance First',
                    icon: '📈',
                  },
                  {
                    key: 'BALANCE_ASC',
                    label: 'Lowest Balance First',
                    icon: '📉',
                  },
                  {
                    key: 'DONATIONS_COUNT',
                    label: 'Most Donations First',
                    icon: '🔢',
                  },
                ].map(option => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.filterOptionRow,
                      filters.sortBy === option.key &&
                        styles.filterOptionRowActive,
                    ]}
                    onPress={() =>
                      setFilters(prev => ({
                        ...prev,
                        sortBy: option.key as SortOption,
                      }))
                    }>
                    <Text style={styles.filterOptionIcon}>{option.icon}</Text>
                    <Text
                      style={[
                        styles.filterOptionRowText,
                        filters.sortBy === option.key &&
                          styles.filterOptionRowTextActive,
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
              <Text style={styles.applyButtonIcon}>✓</Text>
              <Text style={styles.applyButtonText}>
                Apply Filters ({filteredDonators.length})
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
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
        activeOpacity={0.8}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.donatorName}>{item.name}</Text>
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
          {item.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📞</Text>
              <Text style={styles.infoText}>{item.phone}</Text>
            </View>
          )}
          {item.address && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📍</Text>
              <Text style={styles.infoText}>{item.address}</Text>
            </View>
          )}
          {item.donations.length > 0 && item.donations[0].user && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>👤</Text>
              <Text style={styles.infoText}>
                Added by {item.donations[0].user.name}
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
            {item.donations.length} donation
            {item.donations.length > 1 ? 's' : ''}
          </Text>
          <Text style={styles.viewMoreHint}>View details →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📭</Text>
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
          <Text style={styles.clearFiltersIcon}>🔄</Text>
          <Text style={styles.clearFiltersText}>Clear all filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#60A5FA" />
          <Text style={styles.loadingText}>Loading all donations...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>All Donations</Text>
            <Text style={styles.subtitle}>
              {allDonators.length} total donators
            </Text>
          </View>
        </View>

        {/* Summary Cards */}
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

        {/* Search and Controls */}
        <View style={styles.controlsSection}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search donators..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={() => setSearchQuery('')}>
                <Text style={styles.clearSearchIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Controls */}
          <View style={styles.filterControls}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFiltersCount > 0 && styles.filterButtonActive,
              ]}
              onPress={() => setShowFilterModal(true)}>
              <Text style={styles.filterButtonIcon}>⚙️</Text>
              <Text style={styles.filterButtonText}>
                Filters
                {activeFiltersCount > 0 && (
                  <Text style={styles.filterBadge}>
                    {' '}
                    ({activeFiltersCount})
                  </Text>
                )}
              </Text>
            </TouchableOpacity>

            <View style={styles.resultsCounter}>
              <Text style={styles.resultsText}>
                {filteredDonators.length} result
                {filteredDonators.length !== 1 ? 's' : ''}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.pdfButton,
                isGeneratingPDF && styles.pdfButtonDisabled,
              ]}
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
                <View style={styles.activeFiltersRow}>
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
                </View>
              </ScrollView>
            </View>
          )}
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

        {/* Filter Modal */}
        {renderFilterModal()}
      </SafeAreaView>
    </View>
  );
};

// Helper functions for status colors
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#E2E8F0',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.2)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  backIcon: {
    fontSize: 18,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
  },

  // Summary Section
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

  // Controls Section
  controlsSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(51, 65, 85, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#F1F5F9',
    paddingVertical: 0,
  },
  clearSearchButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearSearchIcon: {
    fontSize: 12,
    color: '#94A3B8',
  },
  filterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    flex: 1,
  },
  filterButtonActive: {
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    borderColor: 'rgba(96, 165, 250, 0.5)',
  },
  filterButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E2E8F0',
  },
  filterBadge: {
    color: '#60A5FA',
    fontWeight: '600',
  },
  resultsCounter: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  resultsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  pdfButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(96, 165, 250, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  pdfButtonDisabled: {
    backgroundColor: 'rgba(100, 116, 139, 0.5)',
  },
  pdfButtonText: {
    fontSize: 18,
  },
  activeFiltersContainer: {
    marginTop: 12,
  },
  activeFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 20,
  },
  activeFilterChip: {
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  activeFilterText: {
    fontSize: 12,
    color: '#60A5FA',
    fontWeight: '500',
  },
  clearAllChip: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  clearAllText: {
    fontSize: 12,
    color: '#F87171',
    fontWeight: '500',
  },

  // List
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },

  // Donator Card
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

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(96, 165, 250, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    gap: 8,
  },
  clearFiltersIcon: {
    fontSize: 16,
  },
  clearFiltersText: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal
  modalBackground: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.2)',
  },
  modalHeaderButton: {
    minWidth: 60,
  },
  modalCancel: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  modalClear: {
    fontSize: 16,
    color: '#F87171',
    fontWeight: '600',
    textAlign: 'right',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  filterSection: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 16,
  },
  filterOptionsGrid: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
  },
  filterOptionActive: {
    backgroundColor: 'rgba(96, 165, 250, 0.9)',
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  filterOptionText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#F1F5F9',
    fontWeight: '600',
  },
  filterOptionsList: {
    gap: 8,
  },
  filterOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
  },
  filterOptionRowActive: {
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    borderColor: 'rgba(96, 165, 250, 0.5)',
  },
  filterOptionIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 20,
  },
  filterOptionRowText: {
    fontSize: 14,
    color: '#E2E8F0',
    fontWeight: '500',
    flex: 1,
  },
  filterOptionRowTextActive: {
    color: '#60A5FA',
    fontWeight: '600',
  },
  modalFooter: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.2)',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(96, 165, 250, 0.9)',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    gap: 8,
  },
  applyButtonIcon: {
    fontSize: 16,
    color: '#F1F5F9',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F1F5F9',
  },
});

export default ViewAll;
