// Home.tsx - Using separate components
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
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

type RootStackParamList = {
  Home: undefined;
  Details: undefined;
  AddDonator: undefined;
  ViewAll: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Home = () => {
  const navigation = useNavigation<NavigationProp>();
  const {user, logout, token} = useAuth();

  // All state
  const [summary, setSummary] = useState<DonationSummary | null>(null);
  const [recentDonations, setRecentDonations] = useState<Donator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
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

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('📱 Home screen focused, refreshing data...');
      loadDashboardData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadDashboardData = async () => {
    console.log('🏠 Starting to load dashboard data...');
    try {
      setIsLoading(true);

      console.log('📊 Calling getDonationSummary...');
      const summaryData = await donationAPI.getDonationSummary();
      console.log('✅ Summary data received:', summaryData);
      setSummary(summaryData);

      console.log('👥 Calling getAllDonators...');
      const donatorsData = await donationAPI.getAllDonators();
      console.log('✅ Donators data received:', donatorsData);

      // Get recent donations (last 10, sorted by latest)
      const recent = donatorsData
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 10);

      console.log('📋 Recent donations prepared:', recent);
      setRecentDonations(recent);

      // Extract unique book numbers from donations
      const books = new Set<string>();
      donatorsData.forEach(donator => {
        donator.donations.forEach(donation => {
          if (donation.bookNumber) {
            books.add(donation.bookNumber);
          }
        });
      });

      const bookArray = Array.from(books).sort();
      setAvailableBooks(bookArray);
      console.log('📚 Available books:', bookArray);

      // Load summaries for first 3 books automatically
      if (token && bookArray.length > 0) {
        loadMultipleBookSummaries(bookArray.slice(0, 3));
      }

      console.log('🎉 Dashboard data loaded successfully!');
    } catch (error) {
      console.log('❌ Error loading dashboard data:', error);

      if (error instanceof DonationApiError) {
        console.log(
          '   DonationApiError - Status:',
          error.status,
          'Message:',
          error.message,
        );
        Alert.alert('API Error', `Status ${error.status}: ${error.message}`);
      } else {
        console.log('   Unknown error:', error);
        Alert.alert(
          'Error',
          'Failed to load dashboard data - Check console for details',
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadMultipleBookSummaries = async (books: string[]) => {
    if (!token) return;

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

      const validSummaries = summaries.filter(
        (s): s is BookSummary => s !== null,
      );
      setBookSummaries(validSummaries);
    } catch (error) {
      console.log('Error loading book summaries:', error);
    }
  };

  const handleSearchBook = async () => {
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
  };

  const handleViewBookDetails = async (bookSummary: BookSummary) => {
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
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Logout', style: 'destructive', onPress: logout},
    ]);
  };

  // Helper functions
  const getDonationStatus = (
    donator: Donator,
  ): 'PAID' | 'PARTIAL' | 'PENDING' => {
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

  const getUniquePaymentMethods = (donator: Donator): string[] => {
    const methods = donator.donations
      .map(donation => donation.paymentMethod)
      .filter(method => method && method !== 'Not Done');
    return Array.from(new Set(methods));
  };

  const getUniqueUsers = (donator: Donator): string[] => {
    const users = donator.donations
      .map(donation => donation.user?.name)
      .filter(Boolean) as string[];
    return Array.from(new Set(users));
  };

  if (isLoading) {
    return <LoadingState message="Loading Dashboard" />;
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Header
          title="Dashboard"
          subtitle={`Welcome back, ${user?.email?.split('@')[0]}`}
          onNotificationPress={() => {}}
          onLogoutPress={handleLogout}
        />

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }>
          <SummarySection summary={summary} />

          <QuickActions
            onAddDonator={() => navigation.navigate('AddDonator')}
            onViewAll={() => navigation.navigate('ViewAll')}
            onSearchBook={() => setShowBookModal(true)}
          />

          {bookSummaries.length > 0 && (
            <View style={styles.booksSection}>
              <Text style={styles.sectionTitle}>Book Analysis</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.booksContainer}>
                  {bookSummaries.map(book => (
                    <BookCard
                      key={book.bookNumber}
                      book={book}
                      onPress={() => handleViewBookDetails(book)}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>

            {recentDonations.length === 0 ? (
              <EmptyState
                icon="📭"
                title="No Recent Activity"
                subtitle="Donations will appear here"
              />
            ) : (
              recentDonations.map(donator => {
                const paymentMethods = getUniquePaymentMethods(donator);
                const users = getUniqueUsers(donator);

                return (
                  <RecentDonationItem
                    key={donator.id}
                    donator={donator}
                    totalAmount={getTotalAmount(donator)}
                    totalPaid={getTotalPaidAmount(donator)}
                    totalBalance={getTotalBalance(donator)}
                    status={getDonationStatus(donator)}
                    paymentMethods={paymentMethods}
                    users={users}
                  />
                );
              })
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
        onClose={() => setShowBookModal(false)}
        onBookNumberChange={setBookNumber}
        onBookSelect={setBookNumber}
        onSearch={handleSearchBook}
      />

      <BookDetailsModal
        visible={showBookDetailsModal}
        selectedBookSummary={selectedBookSummary}
        selectedBookDonations={selectedBookDonations}
        isLoadingBookDetails={isLoadingBookDetails}
        onClose={() => setShowBookDetailsModal(false)}
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
