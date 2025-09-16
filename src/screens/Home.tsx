import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  donationAPI,
  DonationApiError,
  Donator,
  DonationSummary,
  BookSummary,
  donationUtils,
  PaymentMethod,
  Donation,
} from '../Api/donationAPI';
import {useAuth} from '../context/AuthContext';

// Navigation type
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

  const [summary, setSummary] = useState<DonationSummary | null>(null);
  const [recentDonations, setRecentDonations] = useState<Donator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // New state for book-wise features
  const [bookSummaries, setBookSummaries] = useState<BookSummary[]>([]);
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookNumber, setBookNumber] = useState('');
  const [isLoadingBook, setIsLoadingBook] = useState(false);
  const [availableBooks, setAvailableBooks] = useState<string[]>([]);

  // New state for detailed book donations
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

  // Add navigation listener to refresh data when returning to screen
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
      // Load summary first to debug it specifically
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
      console.log('❌ Error loading dashboard data:');
      console.log('   Error type:', typeof error);
      console.log('   Error:', error);

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

      // Load both summary and detailed donations
      const [bookSummary, bookDonations] = await Promise.all([
        donationAPI.getBookSummary(bookNumber.trim(), token),
        donationAPI.getDonationsByBook(bookNumber.trim(), token),
      ]);

      // Add or update this book summary
      setBookSummaries(prev => {
        const existing = prev.findIndex(
          b => b.bookNumber === bookSummary.bookNumber,
        );
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = bookSummary;
          return updated;
        } else {
          return [bookSummary, ...prev].slice(0, 5); // Keep only latest 5
        }
      });

      setBookNumber('');
      setShowBookModal(false);

      // Show detailed donations immediately
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

  const handleAddDonator = () => {
    navigation.navigate('AddDonator');
  };

  const handleViewAll = () => {
    navigation.navigate('ViewAll');
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  const getDonationStatus = (donator: Donator) => {
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

  // New helper functions for payment methods and users
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

  console.log(JSON.stringify(recentDonations, null, 2), 'recentDonations==');

  const renderBookDetailsModal = () => (
    <Modal
      visible={showBookDetailsModal}
      animationType="slide"
      presentationStyle="pageSheet">
      <SafeAreaView style={styles.bookDetailsContainer}>
        <View style={styles.bookDetailsHeader}>
          <TouchableOpacity onPress={() => setShowBookDetailsModal(false)}>
            <Text style={styles.bookDetailsClose}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.bookDetailsTitle}>
            Book {selectedBookSummary?.bookNumber} Details
          </Text>
          <View style={styles.bookDetailsPlaceholder} />
        </View>

        {selectedBookSummary && (
          <View style={styles.bookDetailsSummary}>
            <Text style={styles.bookDetailsSummaryTitle}>Summary</Text>
            <View style={styles.bookDetailsSummaryGrid}>
              <View style={styles.bookDetailsSummaryItem}>
                <Text
                  style={[styles.bookDetailsSummaryAmount, {color: '#60A5FA'}]}>
                  ₹{selectedBookSummary.totalAmount.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.bookDetailsSummaryLabel}>Total</Text>
              </View>

              <View style={styles.bookDetailsSummaryItem}>
                <Text
                  style={[styles.bookDetailsSummaryAmount, {color: '#22C55E'}]}>
                  ₹{selectedBookSummary.totalPaid.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.bookDetailsSummaryLabel}>Paid</Text>
              </View>

              <View style={styles.bookDetailsSummaryItem}>
                <Text
                  style={[styles.bookDetailsSummaryAmount, {color: '#F97316'}]}>
                  ₹{selectedBookSummary.totalBalance.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.bookDetailsSummaryLabel}>Balance</Text>
              </View>
            </View>

            <View style={styles.bookProgressContainer}>
              <Text style={styles.bookProgressText}>
                Collection Progress:{' '}
                {(
                  (selectedBookSummary.totalPaid /
                    selectedBookSummary.totalAmount) *
                  100
                ).toFixed(1)}
                %
              </Text>
              <View style={styles.bookProgressBar}>
                <View
                  style={[
                    styles.bookProgressFill,
                    {
                      width: `${
                        (selectedBookSummary.totalPaid /
                          selectedBookSummary.totalAmount) *
                        100
                      }%`,
                      backgroundColor:
                        selectedBookSummary.totalBalance === 0
                          ? '#22C55E'
                          : '#60A5FA',
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        )}

        <View style={styles.donationsListContainer}>
          <Text style={styles.donationsListTitle}>
            All Donations ({selectedBookDonations.length})
          </Text>

          {isLoadingBookDetails ? (
            <View style={styles.bookDetailsLoading}>
              <ActivityIndicator size="large" color="#60A5FA" />
              <Text style={styles.bookDetailsLoadingText}>
                Loading donations...
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.donationsList}
              showsVerticalScrollIndicator={false}>
              {selectedBookDonations.map(donation => (
                <View key={donation.id} style={styles.bookDonationCard}>
                  <View style={styles.bookDonationHeader}>
                    <Text style={styles.bookDonatorName}>
                      {donation.donator?.name || 'Unknown Donor'}
                    </Text>
                    <View
                      style={[
                        styles.bookDonationStatusBadge,
                        {backgroundColor: getStatusBadgeColor(donation.status)},
                      ]}>
                      <Text
                        style={[
                          styles.bookDonationStatusText,
                          {color: getStatusTextColor(donation.status)},
                        ]}>
                        {donation.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.bookDonationAmounts}>
                    <View style={styles.bookDonationAmountRow}>
                      <Text style={styles.bookDonationAmountLabel}>
                        Amount:
                      </Text>
                      <Text
                        style={[
                          styles.bookDonationAmountValue,
                          {color: '#60A5FA'},
                        ]}>
                        ₹{donation.amount.toLocaleString('en-IN')}
                      </Text>
                    </View>

                    <View style={styles.bookDonationAmountRow}>
                      <Text style={styles.bookDonationAmountLabel}>Paid:</Text>
                      <Text
                        style={[
                          styles.bookDonationAmountValue,
                          {color: '#22C55E'},
                        ]}>
                        ₹{donation.paidAmount.toLocaleString('en-IN')}
                      </Text>
                    </View>

                    <View style={styles.bookDonationAmountRow}>
                      <Text style={styles.bookDonationAmountLabel}>
                        Balance:
                      </Text>
                      <Text
                        style={[
                          styles.bookDonationAmountValue,
                          {color: '#F97316'},
                        ]}>
                        ₹{donation.balance.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.bookDonationInfo}>
                    <View style={styles.bookDonationInfoRow}>
                      <Text style={styles.bookDonationInfoLabel}>Payment:</Text>
                      <View
                        style={[
                          styles.paymentMethodBadge,
                          {
                            backgroundColor: getPaymentMethodColor(
                              donation.paymentMethod,
                            ),
                          },
                        ]}>
                        <Text style={styles.paymentMethodText}>
                          {donation.paymentMethod}
                        </Text>
                      </View>
                    </View>

                    {donation.user?.name && (
                      <View style={styles.bookDonationInfoRow}>
                        <Text style={styles.bookDonationInfoLabel}>
                          Added by:
                        </Text>
                        <Text style={styles.bookDonationInfoValue}>
                          {donation.user.name}
                        </Text>
                      </View>
                    )}

                    <View style={styles.bookDonationInfoRow}>
                      <Text style={styles.bookDonationInfoLabel}>Date:</Text>
                      <Text style={styles.bookDonationInfoValue}>
                        {new Date(donation.createdAt).toLocaleDateString(
                          'en-IN',
                        )}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}

              {selectedBookDonations.length === 0 && (
                <View style={styles.emptyDonationsList}>
                  <Text style={styles.emptyDonationsText}>
                    No donations found for this book
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );

  // Helper function to get payment method colors
  const getPaymentMethodColor = (method: PaymentMethod): string => {
    switch (method) {
      case 'Cash':
        return '#DCFCE7'; // Green background
      case 'Online':
        return '#DBEAFE'; // Blue background
      case 'Not Done':
        return '#FEE2E2'; // Red background
      default:
        return '#F3F4F6'; // Gray background
    }
  };

  const renderBookModal = () => (
    <Modal
      visible={showBookModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowBookModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Search Book Summary</Text>

          <TextInput
            style={styles.bookInput}
            placeholder="Enter book number (e.g., B001)"
            placeholderTextColor="#9CA3AF"
            value={bookNumber}
            onChangeText={setBookNumber}
            autoCapitalize="characters"
          />

          {availableBooks.length > 0 && (
            <View style={styles.availableBooksSection}>
              <Text style={styles.availableBooksTitle}>Available Books:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.bookChips}>
                  {availableBooks.map(book => (
                    <TouchableOpacity
                      key={book}
                      style={styles.bookChip}
                      onPress={() => setBookNumber(book)}>
                      <Text style={styles.bookChipText}>{book}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowBookModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalSearchButton,
                isLoadingBook && styles.modalButtonDisabled,
              ]}
              onPress={handleSearchBook}
              disabled={isLoadingBook}>
              <Text style={styles.modalSearchText}>
                {isLoadingBook ? 'Searching...' : 'Search'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#60A5FA" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>Collection Overview</Text>
            <Text style={styles.welcomeText}>Welcome, {user?.email}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.notificationIcon}>
              <Text style={styles.bellIcon}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}>
              <Text style={styles.logoutIcon}>🚪</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Overall Summary Cards */}
        <View style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>Overall Summary</Text>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryAmount, {color: '#60A5FA'}]}>
                ₹{summary?.totalAmount.toLocaleString('en-IN') || '0'}
              </Text>
              <Text style={styles.summaryLabel}>TOTAL AMOUNT</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={[styles.summaryAmount, {color: '#22C55E'}]}>
                ₹{summary?.totalPaid.toLocaleString('en-IN') || '0'}
              </Text>
              <Text style={styles.summaryLabel}>PAID AMOUNT</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={[styles.summaryAmount, {color: '#F97316'}]}>
                ₹{summary?.totalBalance.toLocaleString('en-IN') || '0'}
              </Text>
              <Text style={styles.summaryLabel}>BALANCE DUE</Text>
            </View>
          </View>
        </View>

        {/* Book-wise Analysis Section */}
        <View style={styles.bookAnalysisContainer}>
          <View style={styles.bookAnalysisHeader}>
            <Text style={styles.sectionTitle}>Book-wise Analysis</Text>
            <TouchableOpacity
              style={styles.addBookButton}
              onPress={() => setShowBookModal(true)}>
              <Text style={styles.addBookIcon}>📚</Text>
              <Text style={styles.addBookText}>Search Book</Text>
            </TouchableOpacity>
          </View>

          {bookSummaries.length === 0 ? (
            <View style={styles.emptyBooksState}>
              <Text style={styles.emptyBooksIcon}>📚</Text>
              <Text style={styles.emptyBooksTitle}>No Book Summaries</Text>
              <Text style={styles.emptyBooksSubtitle}>
                {availableBooks.length > 0
                  ? 'Tap "Search Book" to view book-wise summaries'
                  : 'No books found with donations yet'}
              </Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.bookSummariesRow}>
                {bookSummaries.map(book => (
                  <TouchableOpacity
                    key={book.bookNumber}
                    style={styles.bookSummaryCard}
                    onPress={() => handleViewBookDetails(book)}
                    activeOpacity={0.7}>
                    <View style={styles.bookHeader}>
                      <Text style={styles.bookNumber}>
                        Book {book.bookNumber}
                      </Text>
                      <View style={styles.bookStats}>
                        <Text style={styles.bookStatsText}>
                          {((book.totalPaid / book.totalAmount) * 100).toFixed(
                            0,
                          )}
                          % Complete
                        </Text>
                      </View>
                    </View>

                    <View style={styles.bookAmounts}>
                      <View style={styles.bookAmountRow}>
                        <Text style={styles.bookAmountLabel}>Total:</Text>
                        <Text
                          style={[styles.bookAmountValue, {color: '#60A5FA'}]}>
                          ₹{book.totalAmount.toLocaleString('en-IN')}
                        </Text>
                      </View>

                      <View style={styles.bookAmountRow}>
                        <Text style={styles.bookAmountLabel}>Paid:</Text>
                        <Text
                          style={[styles.bookAmountValue, {color: '#22C55E'}]}>
                          ₹{book.totalPaid.toLocaleString('en-IN')}
                        </Text>
                      </View>

                      <View style={styles.bookAmountRow}>
                        <Text style={styles.bookAmountLabel}>Balance:</Text>
                        <Text
                          style={[styles.bookAmountValue, {color: '#F97316'}]}>
                          ₹{book.totalBalance.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBackground}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${
                                (book.totalPaid / book.totalAmount) * 100
                              }%`,
                              backgroundColor:
                                book.totalBalance === 0 ? '#22C55E' : '#60A5FA',
                            },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Tap to view indicator */}
                    <Text style={styles.tapToViewText}>
                      Tap to view all donations
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleAddDonator}>
            <View style={styles.actionIcon}>
              <Text style={styles.plusIcon}>+</Text>
            </View>
            <Text style={styles.actionText}>Add Donator</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleViewAll}>
            <View style={styles.actionIcon}>
              <Text style={styles.clipboardIcon}>📋</Text>
            </View>
            <Text style={styles.actionText}>View All</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Donations */}
        <View style={styles.recentContainer}>
          <Text style={styles.sectionTitle}>Recent Donations</Text>

          {recentDonations.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No donations found</Text>
            </View>
          ) : (
            recentDonations.map(donator => {
              const paymentMethods = getUniquePaymentMethods(donator);
              const users = getUniqueUsers(donator);

              return (
                <TouchableOpacity key={donator.id} style={styles.donationCard}>
                  <View style={styles.donationInfo}>
                    <Text style={styles.donatorName}>{donator.name}</Text>

                    {/* Amount Details */}
                    <View style={styles.amountContainer}>
                      <View style={styles.amountRow}>
                        <Text style={styles.amountLabel}>Total:</Text>
                        <Text style={styles.amountValue}>
                          ₹{getTotalAmount(donator).toLocaleString('en-IN')}
                        </Text>
                      </View>

                      <View style={styles.amountRow}>
                        <Text style={styles.amountLabel}>Paid:</Text>
                        <Text style={[styles.amountValue, {color: '#22C55E'}]}>
                          ₹{getTotalPaidAmount(donator).toLocaleString('en-IN')}
                        </Text>
                      </View>

                      <View style={styles.amountRow}>
                        <Text style={styles.amountLabel}>Balance:</Text>
                        <Text style={[styles.amountValue, {color: '#F97316'}]}>
                          ₹{getTotalBalance(donator).toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>

                    {/* Phone Number */}
                    {donator.phone && (
                      <Text style={styles.donatorPhone}>
                        📞 {donator.phone}
                      </Text>
                    )}

                    {/* Book Numbers */}
                    {donator.donations.some(d => d.bookNumber) && (
                      <Text style={styles.donatorBooks}>
                        📚 Recipt Book:{' '}
                        {Array.from(
                          new Set(
                            donator.donations
                              .map(d => d.bookNumber)
                              .filter(Boolean),
                          ),
                        ).join(', ')}
                      </Text>
                    )}

                    {/* Payment Methods */}
                    {paymentMethods.length > 0 && (
                      <Text style={styles.donatorPaymentMethods}>
                        💳 Payment: {paymentMethods.join(', ')}
                      </Text>
                    )}

                    {/* Added By */}
                    {users.length > 0 && (
                      <Text style={styles.donatorAddedBy}>
                        👤 Added by: {users.join(', ')}
                      </Text>
                    )}
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: getStatusBadgeColor(
                          getDonationStatus(donator),
                        ),
                      },
                    ]}>
                    <Text
                      style={[
                        styles.statusText,
                        {color: getStatusTextColor(getDonationStatus(donator))},
                      ]}>
                      {getDonationStatus(donator)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {renderBookModal()}
      {renderBookDetailsModal()}
    </SafeAreaView>
  );
};

// Helper functions for status colors
const getStatusBadgeColor = (status: string) => {
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

const getStatusTextColor = (status: string) => {
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
  },
  welcomeText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutIcon: {
    fontSize: 16,
  },
  bellIcon: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  summaryGrid: {
    gap: 12,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    letterSpacing: 1,
  },

  // Book Analysis Styles
  bookAnalysisContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  bookAnalysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addBookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#60A5FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addBookIcon: {
    fontSize: 14,
  },
  addBookText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyBooksState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  emptyBooksIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyBooksTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyBooksSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  bookSummariesRow: {
    flexDirection: 'row',
    gap: 16,
    paddingRight: 24,
  },
  bookSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: 280,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  bookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bookNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  bookStats: {
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bookStatsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
  },
  bookAmounts: {
    marginBottom: 16,
  },
  bookAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookAmountLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  bookAmountValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBackground: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  tapToViewText: {
    fontSize: 11,
    color: '#60A5FA',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
    fontWeight: '500',
  },

  // Book Details Modal Styles
  bookDetailsContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  bookDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  bookDetailsClose: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: '500',
  },
  bookDetailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  bookDetailsPlaceholder: {
    width: 24,
  },
  bookDetailsSummary: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  bookDetailsSummaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  bookDetailsSummaryGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  bookDetailsSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  bookDetailsSummaryAmount: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  bookDetailsSummaryLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  bookProgressContainer: {
    marginTop: 12,
  },
  bookProgressText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  bookProgressBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  bookProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  bookDetailsLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  bookDetailsLoadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  donationsListContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  donationsListTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    marginHorizontal: 8,
  },
  donationsList: {
    flex: 1,
  },
  bookDonationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  bookDonationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bookDonatorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  bookDonationStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bookDonationStatusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  bookDonationAmounts: {
    marginBottom: 16,
  },
  bookDonationAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookDonationAmountLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  bookDonationAmountValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  bookDonationInfo: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
    gap: 8,
  },
  bookDonationInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookDonationInfoLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  bookDonationInfoValue: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  paymentMethodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  paymentMethodText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  emptyDonationsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 48,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyDonationsText: {
    fontSize: 16,
    color: '#9CA3AF',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  bookInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
    marginBottom: 20,
  },
  availableBooksSection: {
    marginBottom: 24,
  },
  availableBooksTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  bookChips: {
    flexDirection: 'row',
    gap: 8,
  },
  bookChip: {
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  bookChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1E40AF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  modalSearchButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#60A5FA',
    alignItems: 'center',
  },
  modalButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  modalSearchText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  plusIcon: {
    fontSize: 24,
    fontWeight: '600',
    color: '#374151',
  },
  clipboardIcon: {
    fontSize: 20,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  recentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  donationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  donationInfo: {
    flex: 1,
    marginRight: 16,
  },
  donatorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  amountContainer: {
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    minWidth: 60,
  },
  amountValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  donatorPhone: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  donatorBooks: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  donatorPaymentMethods: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  donatorAddedBy: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});

export default Home;
