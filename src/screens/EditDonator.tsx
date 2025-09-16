import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import {
  donationAPI,
  DonationApiError,
  PaymentMethod,
  Donator,
} from '../Api/donationAPI';
import {useAuth} from '../context/AuthContext';

// Navigation types
type RootStackParamList = {
  Home: undefined;
  Details: undefined;
  AddDonator: undefined;
  ViewAll: undefined;
  EditDonator: {donatorId: number};
};

type EditDonatorNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'EditDonator'
>;
type EditDonatorRouteProp = RouteProp<RootStackParamList, 'EditDonator'>;

const EditDonator = () => {
  const navigation = useNavigation<EditDonatorNavigationProp>();
  const route = useRoute<EditDonatorRouteProp>();
  const {token} = useAuth();

  const {donatorId} = route.params;

  const [donatorData, setDonatorData] = useState<Donator | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state for donator info
  const [donatorForm, setDonatorForm] = useState({
    name: '',
    email: '',
    totalAmount: '',
    balanceAmount: '',
  });

  // Form state for individual donations
  const [selectedDonation, setSelectedDonation] = useState<number | null>(null);
  const [donationForm, setDonationForm] = useState({
    paidAmount: '',
    paymentMethod: 'Not Done' as PaymentMethod,
    name: '',
  });

  useEffect(() => {
    loadDonatorData();
  }, []);

  const loadDonatorData = async () => {
    try {
      setIsLoading(true);
      const data = await donationAPI.getDonatorById(donatorId);
      setDonatorData(data);

      // Initialize form with current data
      setDonatorForm({
        name: data.name,
        email: data.email || '',
        totalAmount: data.totalAmount?.toString() || '',
        balanceAmount: data.balanceAmount?.toString() || '',
      });
    } catch (error) {
      if (error instanceof DonationApiError) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Error', 'Failed to load donator data');
      }
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDonatorInputChange = (field: string, value: string) => {
    setDonatorForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDonationInputChange = (field: string, value: string) => {
    setDonationForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const selectDonationForEdit = (donationId: number) => {
    const donation = donatorData?.donations.find(d => d.id === donationId);
    if (donation) {
      setSelectedDonation(donationId);
      setDonationForm({
        paidAmount: '', // Clear the form for additional payment
        paymentMethod: donation.paymentMethod,
        name: donatorData?.name || '',
      });
    }
  };

  const updateDonatorInfo = async () => {
    if (!token) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    try {
      setIsSaving(true);

      const updateData: any = {};

      if (donatorForm.name.trim()) updateData.name = donatorForm.name.trim();
      if (donatorForm.email.trim()) updateData.email = donatorForm.email.trim();
      if (donatorForm.totalAmount.trim()) {
        const amount = parseFloat(donatorForm.totalAmount);
        if (!isNaN(amount)) updateData.totalAmount = amount;
      }
      if (donatorForm.balanceAmount.trim()) {
        const amount = parseFloat(donatorForm.balanceAmount);
        if (!isNaN(amount)) updateData.balanceAmount = amount;
      }

      await donationAPI.updateDonator(donatorId, updateData, token);

      Alert.alert('Success', 'Donator information updated successfully');
      await loadDonatorData(); // Refresh data
    } catch (error) {
      if (error instanceof DonationApiError) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Error', 'Failed to update donator information');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const updateDonation = async () => {
    if (!token || !selectedDonation) {
      Alert.alert('Error', 'Please select a donation to update');
      return;
    }

    try {
      setIsSaving(true);

      const updateData: any = {
        donationId: selectedDonation,
      };

      if (donationForm.paidAmount.trim()) {
        const paidAmount = parseFloat(donationForm.paidAmount);
        if (isNaN(paidAmount) || paidAmount < 0) {
          Alert.alert('Error', 'Please enter a valid paid amount');
          return;
        }
        updateData.paidAmount = paidAmount;
      }

      if (donationForm.paymentMethod) {
        updateData.paymentMethod = donationForm.paymentMethod;
      }

      if (donationForm.name.trim()) {
        updateData.name = donationForm.name.trim();
      }

      await donationAPI.updateDonation(donatorId, updateData, token);

      Alert.alert('Success', 'Donation updated successfully');
      setSelectedDonation(null);
      await loadDonatorData(); // Refresh data
    } catch (error) {
      if (error instanceof DonationApiError) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Error', 'Failed to update donation');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const getTotalAmount = () => {
    return (
      donatorData?.donations.reduce(
        (sum, donation) => sum + donation.amount,
        0,
      ) || 0
    );
  };

  const getTotalPaid = () => {
    return (
      donatorData?.donations.reduce(
        (sum, donation) => sum + donation.paidAmount,
        0,
      ) || 0
    );
  };

  const getTotalBalance = () => {
    return (
      donatorData?.donations.reduce(
        (sum, donation) => sum + donation.balance,
        0,
      ) || 0
    );
  };

  const paymentMethods: PaymentMethod[] = ['Not Done', 'Cash', 'Online'];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#60A5FA" />
          <Text style={styles.loadingText}>Loading donator details...</Text>
        </View>
      </View>
    );
  }

  if (!donatorData) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>Donator not found</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
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
            <Text style={styles.title}>Edit Donator</Text>
            <Text style={styles.subtitle}>{donatorData.name}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {/* Current Summary */}
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Current Overview</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>
                  ₹{getTotalAmount().toLocaleString('en-IN')}
                </Text>
                <Text style={styles.summaryLabel}>Total Amount</Text>
                <View
                  style={[
                    styles.summaryIndicator,
                    {backgroundColor: '#60A5FA'},
                  ]}
                />
              </View>

              <View style={styles.summaryCard}>
                <Text style={[styles.summaryValue, {color: '#22C55E'}]}>
                  ₹{getTotalPaid().toLocaleString('en-IN')}
                </Text>
                <Text style={styles.summaryLabel}>Paid Amount</Text>
                <View
                  style={[
                    styles.summaryIndicator,
                    {backgroundColor: '#22C55E'},
                  ]}
                />
              </View>

              <View style={styles.summaryCard}>
                <Text style={[styles.summaryValue, {color: '#F59E0B'}]}>
                  ₹{getTotalBalance().toLocaleString('en-IN')}
                </Text>
                <Text style={styles.summaryLabel}>Balance Due</Text>
                <View
                  style={[
                    styles.summaryIndicator,
                    {backgroundColor: '#F59E0B'},
                  ]}
                />
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressSection}>
              <Text style={styles.progressText}>
                Collection Progress:{' '}
                {((getTotalPaid() / getTotalAmount()) * 100).toFixed(1)}%
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(getTotalPaid() / getTotalAmount()) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Donator Information Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              <View style={styles.sectionIcon}>
                <Text style={styles.sectionEmoji}>👤</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter donator name"
                placeholderTextColor="#64748B"
                value={donatorForm.name}
                onChangeText={value => handleDonatorInputChange('name', value)}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter email address"
                placeholderTextColor="#64748B"
                value={donatorForm.email}
                onChangeText={value => handleDonatorInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.updateButton,
                isSaving && styles.updateButtonDisabled,
              ]}
              onPress={updateDonatorInfo}
              disabled={isSaving}>
              {isSaving ? (
                <View style={styles.buttonLoadingContent}>
                  <ActivityIndicator size="small" color="#F1F5F9" />
                  <Text style={styles.buttonLoadingText}>Updating...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonIcon}>✓</Text>
                  <Text style={styles.updateButtonText}>
                    Update Information
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Donations Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Individual Donations</Text>
              <View style={styles.sectionIcon}>
                <Text style={styles.sectionEmoji}>💰</Text>
              </View>
            </View>

            <Text style={styles.donationsSubtext}>
              Tap on a donation to edit payment details
            </Text>

            {donatorData.donations.map((donation, index) => (
              <TouchableOpacity
                key={donation.id}
                style={[
                  styles.donationCard,
                  selectedDonation === donation.id &&
                    styles.donationCardSelected,
                ]}
                onPress={() => selectDonationForEdit(donation.id)}
                activeOpacity={0.8}>
                <View style={styles.donationHeader}>
                  <View style={styles.donationTitleContainer}>
                    <Text style={styles.donationTitle}>
                      Donation #{index + 1}
                    </Text>
                    {donation.bookNumber && (
                      <Text style={styles.donationBook}>
                        Book: {donation.bookNumber}
                      </Text>
                    )}
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {backgroundColor: getStatusBadgeColor(donation.status)},
                    ]}>
                    <Text
                      style={[
                        styles.statusText,
                        {color: getStatusTextColor(donation.status)},
                      ]}>
                      {donation.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.donationAmounts}>
                  <View style={styles.donationAmountItem}>
                    <Text style={styles.donationAmountLabel}>Amount</Text>
                    <Text
                      style={[styles.donationAmountValue, {color: '#60A5FA'}]}>
                      ₹{donation.amount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.donationAmountItem}>
                    <Text style={styles.donationAmountLabel}>Paid</Text>
                    <Text
                      style={[styles.donationAmountValue, {color: '#22C55E'}]}>
                      ₹{donation.paidAmount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.donationAmountItem}>
                    <Text style={styles.donationAmountLabel}>Balance</Text>
                    <Text
                      style={[styles.donationAmountValue, {color: '#F59E0B'}]}>
                      ₹{donation.balance.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                <View style={styles.donationMeta}>
                  <View style={styles.paymentMethodChip}>
                    <Text style={styles.paymentMethodIcon}>
                      {donation.paymentMethod === 'Cash'
                        ? '💵'
                        : donation.paymentMethod === 'Online'
                        ? '💳'
                        : '⏳'}
                    </Text>
                    <Text style={styles.paymentMethodName}>
                      {donation.paymentMethod}
                    </Text>
                  </View>
                  {selectedDonation === donation.id && (
                    <Text style={styles.selectedIndicator}>
                      Selected for editing
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}

            {/* Edit Donation Form */}
            {selectedDonation && (
              <View style={styles.editForm}>
                <Text style={styles.editFormTitle}>
                  Update Selected Donation
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Additional Payment</Text>
                  <View style={styles.amountInputContainer}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <TextInput
                      style={[styles.textInput, styles.amountInput]}
                      placeholder="0.00"
                      placeholderTextColor="#64748B"
                      value={donationForm.paidAmount}
                      onChangeText={value =>
                        handleDonationInputChange('paidAmount', value)
                      }
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Payment Method</Text>
                  <View style={styles.paymentMethodContainer}>
                    {paymentMethods.map(method => (
                      <TouchableOpacity
                        key={method}
                        style={[
                          styles.paymentMethodButton,
                          donationForm.paymentMethod === method &&
                            styles.paymentMethodActive,
                        ]}
                        onPress={() =>
                          handleDonationInputChange('paymentMethod', method)
                        }>
                        <View style={styles.paymentMethodContent}>
                          <Text style={styles.paymentMethodButtonIcon}>
                            {method === 'Cash'
                              ? '💵'
                              : method === 'Online'
                              ? '💳'
                              : '⏳'}
                          </Text>
                          <Text
                            style={[
                              styles.paymentMethodText,
                              donationForm.paymentMethod === method &&
                                styles.paymentMethodTextActive,
                            ]}>
                            {method}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.editFormButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setSelectedDonation(null)}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      isSaving && styles.saveButtonDisabled,
                    ]}
                    onPress={updateDonation}
                    disabled={isSaving}>
                    {isSaving ? (
                      <View style={styles.buttonLoadingContent}>
                        <ActivityIndicator size="small" color="#F1F5F9" />
                        <Text style={styles.buttonLoadingText}>Saving...</Text>
                      </View>
                    ) : (
                      <View style={styles.buttonContent}>
                        <Text style={styles.buttonIcon}>💾</Text>
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorContent: {
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F87171',
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: 'rgba(96, 165, 250, 0.9)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  errorButtonText: {
    color: '#F1F5F9',
    fontWeight: '600',
  },
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  summarySection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
    alignItems: 'center',
    position: 'relative',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 11,
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
  progressSection: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 12,
    textAlign: 'center',
  },
  progressBar: {
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
  section: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.2)',
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
  },
  sectionEmoji: {
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(51, 65, 85, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#F1F5F9',
    minHeight: 50,
  },
  updateButton: {
    backgroundColor: 'rgba(96, 165, 250, 0.9)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  updateButtonDisabled: {
    backgroundColor: 'rgba(100, 116, 139, 0.5)',
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  updateButtonText: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonIcon: {
    fontSize: 16,
    color: '#F1F5F9',
  },
  buttonLoadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buttonLoadingText: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '600',
  },
  donationsSubtext: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  donationCard: {
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  donationCardSelected: {
    borderColor: 'rgba(96, 165, 250, 0.6)',
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderWidth: 2,
  },
  donationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  donationTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  donationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 2,
  },
  donationBook: {
    fontSize: 12,
    color: '#94A3B8',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  donationAmounts: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  donationAmountItem: {
    flex: 1,
  },
  donationAmountLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 4,
  },
  donationAmountValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  donationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.2)',
    paddingTop: 12,
  },
  paymentMethodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  paymentMethodIcon: {
    fontSize: 12,
  },
  paymentMethodName: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '500',
  },
  selectedIndicator: {
    fontSize: 11,
    color: '#60A5FA',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  editForm: {
    backgroundColor: 'rgba(96, 165, 250, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  editFormTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#60A5FA',
    marginBottom: 16,
    textAlign: 'center',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(51, 65, 85, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    borderRadius: 12,
    paddingLeft: 16,
    minHeight: 50,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#60A5FA',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingLeft: 0,
    paddingVertical: 14,
    minHeight: 'auto',
  },
  paymentMethodContainer: {
    gap: 12,
  },
  paymentMethodButton: {
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  paymentMethodActive: {
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    borderColor: 'rgba(96, 165, 250, 0.5)',
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentMethodButtonIcon: {
    fontSize: 16,
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
    flex: 1,
  },
  paymentMethodTextActive: {
    color: '#60A5FA',
    fontWeight: '600',
  },
  editFormButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  cancelButtonText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    backgroundColor: 'rgba(96, 165, 250, 0.9)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(100, 116, 139, 0.5)',
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  saveButtonText: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default EditDonator;
