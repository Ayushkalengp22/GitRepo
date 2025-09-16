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
  Dimensions,
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

const {width} = Dimensions.get('window');

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
      animationType="fade"
      presentationStyle="pageSheet">
      <View style={styles.modalBackground}>
        <SafeAreaView style={styles.bookDetailsContainer}>
          <View style={styles.bookDetailsHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowBookDetailsModal(false)}>
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

  const renderBookModal = () => (
    <Modal
      visible={showBookModal}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setShowBookModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Search Book</Text>

          <TextInput
            style={styles.bookInput}
            placeholder="Enter book number"
            placeholderTextColor="#9CA3AF"
            value={bookNumber}
            onChangeText={setBookNumber}
            autoCapitalize="characters"
          />

          {availableBooks.length > 0 && (
            <View style={styles.availableBooksSection}>
              <Text style={styles.availableBooksTitle}>Available Books</Text>
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
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#60A5FA" />
          <Text style={styles.loadingTitle}>Loading Dashboard</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Compact Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Dashboard</Text>
            <Text style={styles.headerSubtitle}>
              Welcome back, {user?.email?.split('@')[0]}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerButton}>
              <Text style={styles.headerButtonIcon}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleLogout}>
              <Text style={styles.headerButtonIcon}>🚪</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }>
          {/* Summary Section - Horizontal Layout */}
          <View style={styles.summarySection}>
            <View style={styles.summaryGrid}>
              <View style={[styles.summaryCard, styles.totalCard]}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardAmount}>
                    ₹{summary?.totalAmount.toLocaleString('en-IN') || '0'}
                  </Text>
                  <Text style={styles.cardLabel}>Total Amount</Text>
                </View>
                <View
                  style={[styles.cardAccent, {backgroundColor: '#60A5FA'}]}
                />
              </View>

              <View style={[styles.summaryCard, styles.paidCard]}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardAmount}>
                    ₹{summary?.totalPaid.toLocaleString('en-IN') || '0'}
                  </Text>
                  <Text style={styles.cardLabel}>Paid Amount</Text>
                </View>
                <View
                  style={[styles.cardAccent, {backgroundColor: '#22C55E'}]}
                />
              </View>

              <View style={[styles.summaryCard, styles.balanceCard]}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardAmount}>
                    ₹{summary?.totalBalance.toLocaleString('en-IN') || '0'}
                  </Text>
                  <Text style={styles.cardLabel}>Balance Due</Text>
                </View>
                <View
                  style={[styles.cardAccent, {backgroundColor: '#F59E0B'}]}
                />
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.primaryAction}
              onPress={handleAddDonator}>
              <Text style={styles.actionIcon}>+</Text>
              <Text style={styles.actionText}>Add Donator</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={handleViewAll}>
              <Text style={styles.actionIcon}>📋</Text>
              <Text style={styles.actionText}>View All</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() => setShowBookModal(true)}>
              <Text style={styles.actionIcon}>📚</Text>
              <Text style={styles.actionText}>Books</Text>
            </TouchableOpacity>
          </View>

          {/* Book Analysis Section */}
          {bookSummaries.length > 0 && (
            <View style={styles.booksSection}>
              <Text style={styles.sectionTitle}>Book Analysis</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.booksContainer}>
                  {bookSummaries.map(book => (
                    <TouchableOpacity
                      key={book.bookNumber}
                      style={styles.bookCard}
                      onPress={() => handleViewBookDetails(book)}
                      activeOpacity={0.8}>
                      <View style={styles.bookHeader}>
                        <Text style={styles.bookTitle}>
                          Book {book.bookNumber}
                        </Text>
                        <Text style={styles.bookProgress}>
                          {((book.totalPaid / book.totalAmount) * 100).toFixed(
                            0,
                          )}
                          %
                        </Text>
                      </View>

                      <View style={styles.bookStats}>
                        <View style={styles.bookStat}>
                          <Text style={styles.bookStatValue}>
                            ₹{(book.totalAmount / 1000).toFixed(0)}K
                          </Text>
                          <Text style={styles.bookStatLabel}>Total</Text>
                        </View>
                        <View style={styles.bookStat}>
                          <Text style={styles.bookStatValue}>
                            ₹{(book.totalPaid / 1000).toFixed(0)}K
                          </Text>
                          <Text style={styles.bookStatLabel}>Paid</Text>
                        </View>
                      </View>

                      <View style={styles.bookProgressBar}>
                        <View
                          style={[
                            styles.bookProgressFill,
                            {
                              width: `${
                                (book.totalPaid / book.totalAmount) * 100
                              }%`,
                            },
                          ]}
                        />
                      </View>

                      <Text style={styles.tapHint}>Tap for details</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Recent Donations */}
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>

            {recentDonations.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyTitle}>No Recent Activity</Text>
                <Text style={styles.emptySubtitle}>
                  Donations will appear here
                </Text>
              </View>
            ) : (
              recentDonations.map(donator => {
                const paymentMethods = getUniquePaymentMethods(donator);
                const users = getUniqueUsers(donator);

                return (
                  <View key={donator.id} style={styles.recentItem}>
                    <View style={styles.recentHeader}>
                      <Text style={styles.recentName}>{donator.name}</Text>
                      <View
                        style={[
                          styles.recentStatus,
                          {
                            backgroundColor: getStatusBadgeColor(
                              getDonationStatus(donator),
                            ),
                          },
                        ]}>
                        <Text
                          style={[
                            styles.recentStatusText,
                            {
                              color: getStatusTextColor(
                                getDonationStatus(donator),
                              ),
                            },
                          ]}>
                          {getDonationStatus(donator)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.recentAmounts}>
                      <View style={styles.recentAmount}>
                        <Text style={styles.recentAmountLabel}>Total</Text>
                        <Text style={styles.recentAmountValue}>
                          ₹{getTotalAmount(donator).toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View style={styles.recentAmount}>
                        <Text style={styles.recentAmountLabel}>Paid</Text>
                        <Text
                          style={[
                            styles.recentAmountValue,
                            {color: '#22C55E'},
                          ]}>
                          ₹{getTotalPaidAmount(donator).toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View style={styles.recentAmount}>
                        <Text style={styles.recentAmountLabel}>Balance</Text>
                        <Text
                          style={[
                            styles.recentAmountValue,
                            {color: '#F59E0B'},
                          ]}>
                          ₹{getTotalBalance(donator).toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.recentMeta}>
                      {donator.phone && (
                        <Text style={styles.recentMetaText}>
                          📞 {donator.phone}
                        </Text>
                      )}

                      {donator.donations.some(d => d.bookNumber) && (
                        <Text style={styles.recentMetaText}>
                          📚{' '}
                          {Array.from(
                            new Set(
                              donator.donations
                                .map(d => d.bookNumber)
                                .filter(Boolean),
                            ),
                          ).join(', ')}
                        </Text>
                      )}

                      {paymentMethods.length > 0 && (
                        <Text style={styles.recentMetaText}>
                          💳 {paymentMethods.join(', ')}
                        </Text>
                      )}

                      {users.length > 0 && (
                        <Text style={styles.recentMetaText}>
                          👤 {users.join(', ')}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>

      {renderBookModal()}
      {renderBookDetailsModal()}
    </View>
  );
};

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
  loadingTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  scrollView: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.1)',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  headerButtonIcon: {
    fontSize: 16,
  },

  // Summary Section
  summarySection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
    overflow: 'hidden',
    position: 'relative',
  },
  cardContent: {
    padding: 16,
    paddingRight: 20,
  },
  cardAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 4,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  primaryAction: {
    flex: 2,
    backgroundColor: 'rgba(96, 165, 250, 0.9)',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F1F5F9',
    textAlign: 'center',
  },

  // Books Section
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
  bookCard: {
    width: 200,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
    marginRight: 4,
  },
  bookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  bookProgress: {
    fontSize: 12,
    fontWeight: '600',
    color: '#60A5FA',
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
  },
  bookStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  bookStat: {
    flex: 1,
  },
  bookStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  bookStatLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  bookProgressBar: {
    height: 4,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  bookProgressFill: {
    height: '100%',
    backgroundColor: '#60A5FA',
    borderRadius: 2,
  },
  tapHint: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Recent Section
  recentSection: {
    paddingTop: 32,
    paddingHorizontal: 20,
  },
  emptyState: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 16,
    paddingVertical: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.1)',
    borderStyle: 'dashed',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
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
  recentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recentStatusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 20,
    textAlign: 'center',
  },
  bookInput: {
    backgroundColor: 'rgba(51, 65, 85, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#F1F5F9',
    marginBottom: 20,
  },
  availableBooksSection: {
    marginBottom: 24,
  },
  availableBooksTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 12,
  },
  bookChips: {
    flexDirection: 'row',
    gap: 8,
  },
  bookChip: {
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  bookChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#60A5FA',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#94A3B8',
  },
  modalSearchButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(96, 165, 250, 0.9)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  modalButtonDisabled: {
    backgroundColor: 'rgba(100, 116, 139, 0.5)',
  },
  modalSearchText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
  },

  // Book Details Modal
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

  bottomSpacing: {
    height: 32,
  },
  totalCard: {},
  paidCard: {},
  balanceCard: {},
});

export default Home;
