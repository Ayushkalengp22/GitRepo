import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
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

// Import components
import SummaryOverview from '../components/EditDonatorComponent/SummaryOverview';
import PersonalInfoForm from '../components/EditDonatorComponent/PersonalInfoForm';
import DonationCard from '../components/EditDonatorComponent/DonationCard';
import EditDonationForm from '../components/EditDonatorComponent/EditDonationForm';
import {LoadingState} from '../components/HomeComponent/common/LoadingState';

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

  if (isLoading) {
    return <LoadingState message="Loading" />;
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
          <SummaryOverview donatorData={donatorData} />

          {/* Personal Information Form */}
          <PersonalInfoForm
            donatorForm={donatorForm}
            onInputChange={handleDonatorInputChange}
            onUpdate={updateDonatorInfo}
            isSaving={isSaving}
          />

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
              <DonationCard
                key={donation.id}
                donation={donation}
                index={index}
                isSelected={selectedDonation === donation.id}
                onSelect={selectDonationForEdit}
              />
            ))}

            {/* Edit Donation Form */}
            {selectedDonation && (
              <EditDonationForm
                donationForm={donationForm}
                onInputChange={handleDonationInputChange}
                onUpdate={updateDonation}
                onCancel={() => setSelectedDonation(null)}
                isSaving={isSaving}
              />
            )}
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F1F5F9',
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
  donationsSubtext: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default EditDonator;
