// Home.tsx - Complete optimized version with caching and performance optimizations
import React, {useState, useEffect, useCallback, useMemo, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import {
  donationAPI,
  DonationApiError,
  Donator,
  DonationSummary,
  BookSummary,
  Donation,
} from '../Api/donationAPI';
import {useAuth} from '../context/AuthContext';

// Import all components
import {LoadingState} from '../components/HomeComponent/common/LoadingState';
import {Header} from '../components/HomeComponent/layout/Header';
import {SummarySection} from '../components/HomeComponent/sections/SummarySection';
import {QuickActions} from '../components/HomeComponent/sections/QuickActions';
import {BookCard} from '../components/HomeComponent/cards/BookCard';
import {RecentDonationItem} from '../components/HomeComponent/cards/RecentDonationItem';
import {EmptyState} from '../components/HomeComponent/common/EmptyState';
import {BookSearchModal} from '../components/HomeComponent/modals/BookSearchModal';
import BookDetailsModal from '../components/HomeComponent/modals/BookDetailsModal';

// Navigation types
type RootStackParamList = {
  Home:
    | {dataChanged?: boolean; timestamp?: number; message?: string}
    | undefined;
  Details: undefined;
  AddDonator: undefined;
  ViewAll: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type HomeRouteProp = RouteProp<RootStackParamList, 'Home'>;

// Cache interface
interface CacheData {
  summary: DonationSummary | null;
  recentDonations: Donator[];
  bookSummaries: BookSummary[];
  availableBooks: string[];
  timestamp: number;
}

// Processed donation item interface
interface ProcessedDonationItem {
  donator: Donator;
  totalAmount: number;
  totalPaid: number;
  totalBalance: number;
  status: 'PAID' | 'PARTIAL' | 'PENDING';
  paymentMethods: string[];
  users: string[];
}

const Home = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<HomeRouteProp>();
  const {user, logout, token} = useAuth();

  // Cache refs to persist data across re-renders
  const cacheRef = useRef<CacheData | null>(null);
  const lastFetchRef = useRef<number>(0);

  // All state
  const [summary, setSummary] = useState<DonationSummary | null>(null);
  const [recentDonations, setRecentDonations] = useState<Donator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);
  const [bookSummaries, setBookSummaries] = useState<BookSummary[]>([]);
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookNumber, setBookNumber] = useState('');
  const [isLoadingBook, setIsLoadingBook] = useState(false);
  const [availableBooks, setAvailableBooks] = useState<string[]>([]);
  const [showBookDetailsModal, setShowBookDetailsModal] = useState(false);
  const [selectedBookDonations, setSelectedBookDonations] = useState<
    Donation[]
  >([]);

  const [selectedBookSummary, setSelectedBookSummary] =
    useState<BookSummary | null>(null);
  const [isLoadingBookDetails, setIsLoadingBookDetails] = useState(false);

  // Cache configuration
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const BACKGROUND_REFRESH_THRESHOLD = 2 * 60 * 1000; // 2 minutes

  // Manual cache invalidation method
  const invalidateCache = useCallback(() => {
    console.log('Cache manually invalidated');
    cacheRef.current = null;
    lastFetchRef.current = 0;
  }, []);

  // Check if cache is valid
  const isCacheValid = useCallback(() => {
    if (!cacheRef.current) return false;
    const now = Date.now();
    return now - cacheRef.current.timestamp < CACHE_DURATION;
  }, [CACHE_DURATION]);

  // Check if background refresh is needed
  const shouldBackgroundRefresh = useCallback(() => {
    const now = Date.now();
    return now - lastFetchRef.current > BACKGROUND_REFRESH_THRESHOLD;
  }, [BACKGROUND_REFRESH_THRESHOLD]);

  // Load data from cache
  const loadFromCache = useCallback(() => {
    if (cacheRef.current) {
      console.log('Loading data from cache');
      setSummary(cacheRef.current.summary);
      setRecentDonations(cacheRef.current.recentDonations);
      setBookSummaries(cacheRef.current.bookSummaries);
      setAvailableBooks(cacheRef.current.availableBooks);
      setIsLoading(false);
      return true;
    }
    return false;
  }, []);

  // Save data to cache
  const saveToCache = useCallback((data: Omit<CacheData, 'timestamp'>) => {
    cacheRef.current = {
      ...data,
      timestamp: Date.now(),
    };
    lastFetchRef.current = Date.now();
    console.log('Data saved to cache');
  }, []);

  // Load multiple book summaries
  const loadMultipleBookSummaries = useCallback(
    async (books: string[]): Promise<BookSummary[]> => {
      if (!token) return [];

      try {
        const summaries = await Promise.all(
          books.map(async book => {
            try {
              return await donationAPI.getBookSummary(book, token);
            } catch (error) {
              console.log(`Failed to load summary for book ${book}:`, error);
              return null;
            }
          }),
        );

        return summaries.filter((s): s is BookSummary => s !== null);
      } catch (error) {
        console.log('Error loading book summaries:', error);
        return [];
      }
    },
    [token],
  );

  // Load dashboard data with caching
  const loadDashboardData = useCallback(
    async (forceRefresh = false, silent = false) => {
      console.log('Loading dashboard data...', {forceRefresh, silent});

      // If not forcing refresh and cache is valid, use cache
      if (!forceRefresh && isCacheValid()) {
        console.log('Using valid cache data');
        loadFromCache();
        return;
      }

      try {
        if (!silent) {
          setIsLoading(true);
        } else {
          setIsBackgroundRefreshing(true);
        }

        console.log('Fetching fresh data from API...');

        const [summaryData, donatorsData] = await Promise.all([
          donationAPI.getDonationSummary(),
          donationAPI.getAllDonators(),
        ]);

        console.log('Fresh data received');

        // Process recent donations
        const recent = donatorsData
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          .slice(0, 10);

        // Extract unique book numbers
        const books = new Set<string>();
        donatorsData.forEach(donator => {
          donator.donations.forEach(donation => {
            if (donation.bookNumber) {
              books.add(donation.bookNumber);
            }
          });
        });

        const bookArray = Array.from(books).sort();

        // Load book summaries for first 3 books
        let bookSummariesData: BookSummary[] = [];
        if (token && bookArray.length > 0) {
          bookSummariesData = await loadMultipleBookSummaries(
            bookArray.slice(0, 3),
          );
        }

        // Update state
        setSummary(summaryData);
        setRecentDonations(recent);
        setAvailableBooks(bookArray);
        setBookSummaries(bookSummariesData);

        // Save to cache
        saveToCache({
          summary: summaryData,
          recentDonations: recent,
          bookSummaries: bookSummariesData,
          availableBooks: bookArray,
        });

        console.log('Dashboard data loaded and cached successfully!');
      } catch (error) {
        console.log('Error loading dashboard data:', error);

        if (error instanceof DonationApiError) {
          Alert.alert('API Error', `Status ${error.status}: ${error.message}`);
        } else {
          Alert.alert('Error', 'Failed to load dashboard data');
        }

        // If we have cache data and this was a background refresh, use cache
        if (silent && cacheRef.current) {
          console.log('Background refresh failed, using cache data');
          loadFromCache();
        }
      } finally {
        setIsLoading(false);
        setIsBackgroundRefreshing(false);
      }
    },
    [
      isCacheValid,
      loadFromCache,
      saveToCache,
      token,
      loadMultipleBookSummaries,
    ],
  );

  // MEMOIZED HELPER FUNCTIONS
  const getDonationStatus = useCallback(
    (donator: Donator): 'PAID' | 'PARTIAL' | 'PENDING' => {
      const totalAmount = getTotalAmount(donator);
      const totalPaid = getTotalPaidAmount(donator);
      if (totalPaid >= totalAmount) return 'PAID';
      if (totalPaid > 0) return 'PARTIAL';
      return 'PENDING';
    },
    [],
  );

  const getTotalAmount = useCallback((donator: Donator) => {
    return donator.donations.reduce(
      (sum, donation) => sum + donation.amount,
      0,
    );
  }, []);

  const getTotalPaidAmount = useCallback((donator: Donator) => {
    return donator.donations.reduce(
      (sum, donation) => sum + donation.paidAmount,
      0,
    );
  }, []);

  const getTotalBalance = useCallback((donator: Donator) => {
    return donator.donations.reduce(
      (sum, donation) => sum + donation.balance,
      0,
    );
  }, []);

  const getUniquePaymentMethods = useCallback((donator: Donator): string[] => {
    const methods = donator.donations
      .map(donation => donation.paymentMethod)
      .filter(method => method && method !== 'Not Done');
    return Array.from(new Set(methods));
  }, []);

  const getUniqueUsers = useCallback((donator: Donator): string[] => {
    const users = donator.donations
      .map(donation => donation.user?.name)
      .filter(Boolean) as string[];
    return Array.from(new Set(users));
  }, []);

  // MEMOIZED EVENT HANDLERS
  const handleAddDonator = useCallback(() => {
    navigation.navigate('AddDonator');
  }, [navigation]);

  const handleViewAll = useCallback(() => {
    navigation.navigate('ViewAll');
  }, [navigation]);

  const handleOpenBookModal = useCallback(() => {
    setShowBookModal(true);
  }, []);

  const handleCloseBookModal = useCallback(() => {
    setShowBookModal(false);
  }, []);

  const handleCloseBookDetailsModal = useCallback(() => {
    setShowBookDetailsModal(false);
  }, []);

  const handleBookNumberChange = useCallback((value: string) => {
    setBookNumber(value);
  }, []);

  const handleBookSelect = useCallback((value: string) => {
    setBookNumber(value);
  }, []);

  const handleNotificationPress = useCallback(() => {
    console.log('Notification pressed');
  }, []);

  // const handleLogout = useCallback(() => {
  //   Alert.alert('Logout', 'Are you sure you want to logout?', [
  //     {text: 'Cancel', style: 'cancel'},
  //     {text: 'Logout', style: 'destructive', onPress: logout},
  //   ]);
  // }, [logout]);

  const handleSearchBook = useCallback(async () => {
    if (!bookNumber.trim()) {
      Alert.alert('Error', 'Please enter a book number');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    try {
      setIsLoadingBook(true);

      const [bookSummary, bookDonations] = await Promise.all([
        donationAPI.getBookSummary(bookNumber.trim(), token),
        donationAPI.getDonationsByBook(bookNumber.trim(), token),
      ]);

      setBookSummaries(prev => {
        const existing = prev.findIndex(
          b => b.bookNumber === bookSummary.bookNumber,
        );
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = bookSummary;
          return updated;
        } else {
          return [bookSummary, ...prev].slice(0, 5);
        }
      });

      setBookNumber('');
      setShowBookModal(false);

      setSelectedBookSummary(bookSummary);
      setSelectedBookDonations(bookDonations);
      setShowBookDetailsModal(true);
    } catch (error) {
      if (error instanceof DonationApiError) {
        if (error.status === 404) {
          Alert.alert(
            'Book Not Found',
            `No donations found for book number "${bookNumber}"`,
          );
        } else {
          Alert.alert('Error', error.message);
        }
      } else {
        Alert.alert('Error', 'Failed to load book summary');
      }
    } finally {
      setIsLoadingBook(false);
    }
  }, [bookNumber, token]);

  const handleViewBookDetails = useCallback(
    async (bookSummary: BookSummary) => {
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      try {
        setIsLoadingBookDetails(true);
        const bookDonations = await donationAPI.getDonationsByBook(
          bookSummary.bookNumber,
          token,
        );
        setSelectedBookSummary(bookSummary);
        setSelectedBookDonations(bookDonations);
        setShowBookDetailsModal(true);
      } catch (error) {
        if (error instanceof DonationApiError) {
          Alert.alert('Error', error.message);
        } else {
          Alert.alert('Error', 'Failed to load book details');
        }
      } finally {
        setIsLoadingBookDetails(false);
      }
    },
    [token],
  );

  // Manual refresh (pull to refresh)
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadDashboardData(true); // Force refresh
    setIsRefreshing(false);
  }, [loadDashboardData]);

  // MEMOIZED COMPUTED VALUES
  const headerSubtitle = useMemo(() => {
    return `Welcome back, ${user?.email?.split('@')[0]}`;
  }, [user?.email]);

  const shouldShowEmptyState = useMemo(() => {
    return recentDonations.length === 0;
  }, [recentDonations.length]);

  const shouldShowBooksSection = useMemo(() => {
    return bookSummaries.length > 0;
  }, [bookSummaries.length]);

  // MEMOIZED PROCESSED DATA
  const processedRecentDonations = useMemo((): ProcessedDonationItem[] => {
    return recentDonations.map(donator => ({
      donator,
      totalAmount: getTotalAmount(donator),
      totalPaid: getTotalPaidAmount(donator),
      totalBalance: getTotalBalance(donator),
      status: getDonationStatus(donator),
      paymentMethods: getUniquePaymentMethods(donator),
      users: getUniqueUsers(donator),
    }));
  }, [
    recentDonations,
    getTotalAmount,
    getTotalPaidAmount,
    getTotalBalance,
    getDonationStatus,
    getUniquePaymentMethods,
    getUniqueUsers,
  ]);

  // MEMOIZED RENDERED COMPONENTS
  const renderedBookCards = useMemo(() => {
    return bookSummaries.map(book => (
      <BookCard
        key={book.bookNumber}
        book={book}
        onPress={() => {
          handleViewBookDetails(book); // 👈 capture `book` here
        }}
        // onPress={handleViewBookDetails}
      />
    ));
  }, [bookSummaries, handleViewBookDetails]);

  const renderedRecentDonations = useMemo(() => {
    return processedRecentDonations.map(item => (
      <RecentDonationItem
        key={item.donator.id}
        donator={item.donator}
        totalAmount={item.totalAmount}
        totalPaid={item.totalPaid}
        totalBalance={item.totalBalance}
        status={item.status}
        paymentMethods={item.paymentMethods}
        users={item.users}
      />
    ));
  }, [processedRecentDonations]);

  // Initial load
  useEffect(() => {
    console.log('Initial component mount');
    loadDashboardData();
  }, []);

  // Check for route parameters indicating data changes
  useEffect(() => {
    const params = route.params;
    if (params?.dataChanged) {
      console.log('Data change detected via route params, invalidating cache');
      invalidateCache();
      loadDashboardData(true); // Force refresh

      // Clear the params to prevent repeated refreshes
      navigation.setParams({dataChanged: undefined, timestamp: undefined});

      // Show success message if provided
      if (params.message) {
        Alert.alert('Success', params.message);
      }
    }
  }, [route.params, invalidateCache, loadDashboardData, navigation]);

  // Smart navigation focus handler with cache invalidation
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('Home screen focused');

      // Get navigation state to check previous screen
      const navigationState = navigation.getState();
      const routes = navigationState?.routes || [];
      const currentRouteIndex = navigationState?.index || 0;

      // Check if we're coming from a screen that might have modified data
      const dataModifyingScreens = ['AddDonator', 'EditDonator'];
      let comingFromDataModifyingScreen = false;

      if (currentRouteIndex > 0) {
        const previousRoute = routes[currentRouteIndex - 1];
        comingFromDataModifyingScreen = dataModifyingScreens.includes(
          previousRoute?.name || '',
        );
      }

      console.log('Previous screen check:', {
        currentRouteIndex,
        totalRoutes: routes.length,
        comingFromDataModifyingScreen,
        previousRoute:
          currentRouteIndex > 0 ? routes[currentRouteIndex - 1]?.name : 'none',
      });

      // If coming from data-modifying screen, invalidate cache and force refresh
      if (comingFromDataModifyingScreen) {
        console.log(
          'Coming from data-modifying screen, invalidating cache and refreshing',
        );
        cacheRef.current = null; // Invalidate cache
        loadDashboardData(true); // Force refresh
        return;
      }

      // Normal cache logic for other cases
      if (isCacheValid()) {
        console.log('Using cached data on focus');
        loadFromCache();

        // Optionally do background refresh if data is getting stale
        if (shouldBackgroundRefresh()) {
          console.log('Starting background refresh...');
          loadDashboardData(false, true); // silent background refresh
        }
      } else {
        console.log('Cache invalid, fetching fresh data');
        loadDashboardData(true); // force refresh with loading state
      }
    });

    return unsubscribe;
  }, [
    navigation,
    isCacheValid,
    loadFromCache,
    shouldBackgroundRefresh,
    loadDashboardData,
  ]);

  // Only show loading on initial load or when no cache exists
  if (isLoading && !cacheRef.current) {
    return <LoadingState message="Loading Dashboard" />;
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Header
          title="Dashboard"
          subtitle={headerSubtitle}
          onNotificationPress={handleNotificationPress}
          // onLogoutPress={handleLogout}
        />

        {/* Show background refresh indicator */}
        {isBackgroundRefreshing && (
          <View style={styles.backgroundRefreshIndicator}>
            <Text style={styles.backgroundRefreshText}>Updating data...</Text>
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }>
          <SummarySection summary={summary} />

          <QuickActions
            onAddDonator={handleAddDonator}
            onViewAll={handleViewAll}
            onSearchBook={handleOpenBookModal}
          />

          {shouldShowBooksSection && (
            <View style={styles.booksSection}>
              <Text style={styles.sectionTitle}>Book Analysis</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.booksContainer}>{renderedBookCards}</View>
              </ScrollView>
            </View>
          )}

          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>

            {shouldShowEmptyState ? (
              <EmptyState
                icon="📭"
                title="No Recent Activity"
                subtitle="Donations will appear here"
              />
            ) : (
              renderedRecentDonations
            )}
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>

      <BookSearchModal
        visible={showBookModal}
        bookNumber={bookNumber}
        availableBooks={availableBooks}
        isLoading={isLoadingBook}
        onClose={handleCloseBookModal}
        onBookNumberChange={handleBookNumberChange}
        onBookSelect={handleBookSelect}
        onSearch={handleSearchBook}
      />

      <BookDetailsModal
        visible={showBookDetailsModal}
        selectedBookSummary={selectedBookSummary}
        selectedBookDonations={selectedBookDonations}
        isLoadingBookDetails={isLoadingBookDetails}
        onClose={handleCloseBookDetailsModal}
      />
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
  scrollView: {
    flex: 1,
  },
  backgroundRefreshIndicator: {
    backgroundColor: 'rgba(96, 165, 250, 0.9)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  backgroundRefreshText: {
    color: '#F1F5F9',
    fontSize: 12,
    fontWeight: '500',
  },
  booksSection: {
    paddingTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F1F5F9',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  booksContainer: {
    flexDirection: 'row',
    paddingLeft: 20,
    gap: 16,
  },
  recentSection: {
    paddingTop: 32,
    paddingHorizontal: 20,
  },
  bottomSpacing: {
    height: 32,
  },
});

export default Home;
