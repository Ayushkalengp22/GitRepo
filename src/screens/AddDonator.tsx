import React, {useState} from 'react';
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
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {donationAPI, DonationApiError, PaymentMethod} from '../Api/donationAPI';
import {useAuth} from '../context/AuthContext';

// Navigation type
type RootStackParamList = {
  Home: undefined;
  Details: undefined;
  AddDonator: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AddDonator = () => {
  const navigation = useNavigation<NavigationProp>();
  const {token, user} = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    amount: '',
    paidAmount: '',
    paymentMethod: 'Not Done' as PaymentMethod,
    bookNumber: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    // Required fields validation
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Donator Name is required');
      return false;
    }

    if (!formData.amount.trim()) {
      Alert.alert('Validation Error', 'Donation Amount is required');
      return false;
    }

    // Validate amount is a valid number
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid donation amount');
      return false;
    }

    // Validate paid amount if provided
    if (formData.paidAmount.trim()) {
      const paidAmount = parseFloat(formData.paidAmount);
      if (isNaN(paidAmount) || paidAmount < 0) {
        Alert.alert('Validation Error', 'Please enter a valid paid amount');
        return false;
      }

      if (paidAmount > amount) {
        Alert.alert(
          'Validation Error',
          'Paid amount cannot be greater than donation amount',
        );
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    // Check if user is authenticated and has token
    if (!token) {
      Alert.alert('Authentication Error', 'Please login again');
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const donatorData = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        amount: parseFloat(formData.amount),
        paidAmount: formData.paidAmount.trim()
          ? parseFloat(formData.paidAmount)
          : undefined,
        paymentMethod: formData.paymentMethod,
        bookNumber: formData.bookNumber.trim() || undefined,
      };

      console.log('📤 Submitting donator data:', donatorData);
      console.log('🔑 Using token from AuthContext');
      console.log('👤 Current user:', user?.email);

      const newDonator = await donationAPI.addDonator(donatorData, token);

      console.log('✅ Donator added successfully:', newDonator);

      Alert.alert('Success', 'Donator added successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Navigate back and refresh the home screen
            navigation.goBack();

            // Optional: Add a small delay to ensure the navigation completes
            // setTimeout(() => {
            //   console.log(
            //     '✅ Navigated back to Home, data should refresh automatically',
            //   );
            // }, 100);
          },
        },
      ]);
    } catch (error) {
      console.log('❌ Error adding donator:', error);

      if (error instanceof DonationApiError) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Error', 'Failed to add donator. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const paymentMethods: PaymentMethod[] = ['Not Done', 'Cash', 'Online'];

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
            <Text style={styles.title}>Add New Donator</Text>
            <Text style={styles.subtitle}>Fill in the donation details</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.formContainer}>
            {/* Personal Information Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                <View style={styles.sectionIcon}>
                  <Text style={styles.sectionEmoji}>👤</Text>
                </View>
              </View>

              {/* Donator Name - Required */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Donator Name <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter full name"
                  placeholderTextColor="#64748B"
                  value={formData.name}
                  onChangeText={value => handleInputChange('name', value)}
                  autoCapitalize="words"
                />
              </View>

              {/* Phone Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter 10-digit phone number"
                  placeholderTextColor="#64748B"
                  value={formData.phone}
                  onChangeText={value => handleInputChange('phone', value)}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>

              {/* Address */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Enter complete address"
                  placeholderTextColor="#64748B"
                  value={formData.address}
                  onChangeText={value => handleInputChange('address', value)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Donation Details Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Donation Details</Text>
                <View style={styles.sectionIcon}>
                  <Text style={styles.sectionEmoji}>💰</Text>
                </View>
              </View>

              {/* Donation Amount - Required */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Donation Amount <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={[styles.textInput, styles.amountInput]}
                    placeholder="0.00"
                    placeholderTextColor="#64748B"
                    value={formData.amount}
                    onChangeText={value => handleInputChange('amount', value)}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Paid Amount */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Paid Amount</Text>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={[styles.textInput, styles.amountInput]}
                    placeholder="0.00 (optional)"
                    placeholderTextColor="#64748B"
                    value={formData.paidAmount}
                    onChangeText={value =>
                      handleInputChange('paidAmount', value)
                    }
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Balance Preview */}
              {formData.amount && (
                <View style={styles.balancePreview}>
                  <View style={styles.balanceRow}>
                    <Text style={styles.balanceLabel}>Balance Due:</Text>
                    <Text style={styles.balanceValue}>
                      ₹
                      {(
                        parseFloat(formData.amount || '0') -
                        parseFloat(formData.paidAmount || '0')
                      ).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              )}

              {/* Payment Method */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Payment Method</Text>
                <View style={styles.paymentMethodContainer}>
                  {paymentMethods.map(method => (
                    <TouchableOpacity
                      key={method}
                      style={[
                        styles.paymentMethodButton,
                        formData.paymentMethod === method &&
                          styles.paymentMethodActive,
                      ]}
                      onPress={() =>
                        handleInputChange('paymentMethod', method)
                      }>
                      <View style={styles.paymentMethodContent}>
                        <Text style={styles.paymentMethodIcon}>
                          {method === 'Cash'
                            ? '💵'
                            : method === 'Online'
                            ? '💳'
                            : '⏳'}
                        </Text>
                        <Text
                          style={[
                            styles.paymentMethodText,
                            formData.paymentMethod === method &&
                              styles.paymentMethodTextActive,
                          ]}>
                          {method}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Book Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Book Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter book number (optional)"
                  placeholderTextColor="#64748B"
                  value={formData.bookNumber}
                  onChangeText={value => handleInputChange('bookNumber', value)}
                  autoCapitalize="characters"
                />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Fixed Bottom Submit Button */}
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              isLoading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isLoading}>
            {isLoading ? (
              <View style={styles.loadingContent}>
                <ActivityIndicator size="small" color="#F1F5F9" />
                <Text style={styles.loadingText}>Adding Donator...</Text>
              </View>
            ) : (
              <View style={styles.submitContent}>
                <Text style={styles.submitIcon}>+</Text>
                <Text style={styles.submitButtonText}>Add Donator</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
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
    paddingBottom: 100, // Space for fixed submit button
  },
  formContainer: {
    padding: 20,
  },
  section: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 8,
  },
  required: {
    color: '#F87171',
    fontWeight: '700',
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
  textArea: {
    height: 80,
    paddingTop: 14,
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
  balancePreview: {
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#60A5FA',
  },
  paymentMethodContainer: {
    gap: 12,
  },
  paymentMethodButton: {
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    borderRadius: 12,
    paddingVertical: 14,
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
  paymentMethodIcon: {
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
  submitContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  submitButton: {
    backgroundColor: 'rgba(96, 165, 250, 0.9)',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    minHeight: 56,
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(100, 116, 139, 0.5)',
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitIcon: {
    fontSize: 18,
    color: '#F1F5F9',
    fontWeight: '600',
  },
  submitButtonText: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddDonator;
