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
        <ActivityIndicator size="large" color="#60A5FA" />
        <Text style={styles.loadingText}>Loading donator details...</Text>
      </View>
    );
  }

  if (!donatorData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Donator not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Donator</Text>
        </View>

        {/* Current Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>Current Summary</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={[styles.summaryValue, {color: '#60A5FA'}]}>
                ₹{getTotalAmount().toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Paid</Text>
              <Text style={[styles.summaryValue, {color: '#22C55E'}]}>
                ₹{getTotalPaid().toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Balance</Text>
              <Text style={[styles.summaryValue, {color: '#F97316'}]}>
                ₹{getTotalBalance().toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>

        {/* Donator Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Donator Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter donator name"
              placeholderTextColor="#9CA3AF"
              value={donatorForm.name}
              onChangeText={value => handleDonatorInputChange('name', value)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter email address"
              placeholderTextColor="#9CA3AF"
              value={donatorForm.email}
              onChangeText={value => handleDonatorInputChange('email', value)}
              keyboardType="email-address"
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
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.updateButtonText}>Update Donator Info</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Donations Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Individual Donations</Text>

          {donatorData.donations.map((donation, index) => (
            <TouchableOpacity
              key={donation.id}
              style={[
                styles.donationCard,
                selectedDonation === donation.id && styles.donationCardSelected,
              ]}
              onPress={() => selectDonationForEdit(donation.id)}>
              <View style={styles.donationHeader}>
                <Text style={styles.donationTitle}>Donation #{index + 1}</Text>
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

              <View style={styles.donationDetails}>
                <Text style={styles.donationDetailText}>
                  Amount: ₹{donation.amount.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.donationDetailText}>
                  Paid: ₹{donation.paidAmount.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.donationDetailText}>
                  Balance: ₹{donation.balance.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.donationDetailText}>
                  Method: {donation.paymentMethod}
                </Text>
                {donation.bookNumber && (
                  <Text style={styles.donationDetailText}>
                    Book: {donation.bookNumber}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}

          {/* Edit Donation Form */}
          {selectedDonation && (
            <View style={styles.editForm}>
              <Text style={styles.editFormTitle}>Edit Selected Donation</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Paid Amount</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter paid amount"
                  placeholderTextColor="#9CA3AF"
                  value={donationForm.paidAmount}
                  onChangeText={value =>
                    handleDonationInputChange('paidAmount', value)
                  }
                  keyboardType="numeric"
                />
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
                      <Text
                        style={[
                          styles.paymentMethodText,
                          donationForm.paymentMethod === method &&
                            styles.paymentMethodTextActive,
                        ]}>
                        {method}
                      </Text>
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
                    styles.updateButton,
                    isSaving && styles.updateButtonDisabled,
                  ]}
                  onPress={updateDonation}
                  disabled={isSaving}>
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.updateButtonText}>Update Donation</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
  },
  scrollView: {
    flex: 1,
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
  summaryContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
  },
  updateButton: {
    backgroundColor: '#60A5FA',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  updateButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    paddingLeft: 10,
    paddingRight: 10,
  },
  donationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  donationCardSelected: {
    borderColor: '#60A5FA',
    backgroundColor: '#EFF6FF',
  },
  donationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  donationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  donationDetails: {
    gap: 4,
  },
  donationDetailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  editForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#60A5FA',
  },
  editFormTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentMethodButton: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  paymentMethodActive: {
    backgroundColor: '#60A5FA',
    borderColor: '#60A5FA',
  },
  paymentMethodText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  paymentMethodTextActive: {
    color: '#FFFFFF',
  },
  editFormButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditDonator;
