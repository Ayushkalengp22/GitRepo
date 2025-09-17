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

// Import components
import FilterModal from '../components/ViewComponent/FilterModal';
import DonatorCard from '../components/ViewComponent/DonatorCard';
import SummarySection from '../components/ViewComponent/SummarySection';
import SearchControls from '../components/ViewComponent/SearchControls';
import EmptyState from '../components/ViewComponent/EmptyState';

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
        <SummarySection summary={summary} />

        {/* Search and Controls */}
        <SearchControls
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeFiltersCount={activeFiltersCount}
          onOpenFilters={() => setShowFilterModal(true)}
          filteredCount={filteredDonators.length}
          isGeneratingPDF={isGeneratingPDF}
          onDownloadPDF={handleDownloadPDF}
          filters={filters}
          onClearAllFilters={clearAllFilters}
        />

        {/* Donations List */}
        <FlatList
          data={filteredDonators}
          renderItem={({item}) => (
            <DonatorCard donator={item} onPress={handleEditDonator} />
          )}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <EmptyState
              searchQuery={searchQuery}
              activeFiltersCount={activeFiltersCount}
              onClearFilters={clearAllFilters}
            />
          }
          showsVerticalScrollIndicator={false}
        />

        {/* Filter Modal */}
        <FilterModal
          visible={showFilterModal}
          filters={filters}
          setFilters={setFilters}
          filteredDonatorsCount={filteredDonators.length}
          onClose={() => setShowFilterModal(false)}
          onClearAll={clearAllFilters}
        />
      </SafeAreaView>
    </View>
  );
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

  // List
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
});

export default ViewAll;
