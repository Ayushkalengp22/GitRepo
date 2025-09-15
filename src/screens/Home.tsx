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
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  donationAPI,
  DonationApiError,
  Donator,
  DonationSummary,
  donationUtils,
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
  const {user, logout} = useAuth();

  const [summary, setSummary] = useState<DonationSummary | null>(null);
  const [recentDonations, setRecentDonations] = useState<Donator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const handleAddDonator = () => {
    // Navigate to Add Donator screen
    navigation.navigate('AddDonator');
  };

  const handleViewAll = () => {
    // Navigate to View All Donations screen
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
    // Get the overall status based on all donations
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

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          {/* Total Amount */}
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryAmount, {color: '#60A5FA'}]}>
              ₹{summary?.totalAmount.toLocaleString('en-IN') || '0'}
            </Text>
            <Text style={styles.summaryLabel}>TOTAL AMOUNT</Text>
          </View>

          {/* Paid Amount */}
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryAmount, {color: '#22C55E'}]}>
              ₹{summary?.totalPaid.toLocaleString('en-IN') || '0'}
            </Text>
            <Text style={styles.summaryLabel}>PAID AMOUNT</Text>
          </View>

          {/* Balance Due */}
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryAmount, {color: '#F97316'}]}>
              ₹{summary?.totalBalance.toLocaleString('en-IN') || '0'}
            </Text>
            <Text style={styles.summaryLabel}>BALANCE DUE</Text>
          </View>
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
          <Text style={styles.recentTitle}>Recent Donations</Text>

          {recentDonations.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No donations found</Text>
            </View>
          ) : (
            recentDonations.map(donator => (
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
                    <Text style={styles.donatorPhone}>📞 {donator.phone}</Text>
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
            ))
          )}
        </View>
      </ScrollView>
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
  summaryContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
    letterSpacing: 1,
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
    shadowOffset: {
      width: 0,
      height: 1,
    },
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
  recentTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
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
    shadowOffset: {
      width: 0,
      height: 1,
    },
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
  donationDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  donationAmount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  separator: {
    fontSize: 14,
    color: '#D1D5DB',
    marginHorizontal: 8,
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
