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
            setTimeout(() => {
              console.log(
                '✅ Navigated back to Home, data should refresh automatically',
              );
            }, 100);
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
          <Text style={styles.title}>Add New Donator</Text>
        </View>

        <View style={styles.form}>
          {/* Donator Name - Required */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Donator Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter donator name"
              placeholderTextColor="#9CA3AF"
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
              placeholder="Enter phone number"
              placeholderTextColor="#9CA3AF"
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
              placeholder="Enter address"
              placeholderTextColor="#9CA3AF"
              value={formData.address}
              onChangeText={value => handleInputChange('address', value)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Donation Amount - Required */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Donation Amount <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter donation amount"
              placeholderTextColor="#9CA3AF"
              value={formData.amount}
              onChangeText={value => handleInputChange('amount', value)}
              keyboardType="numeric"
            />
          </View>

          {/* Paid Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Paid Amount</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter paid amount (optional)"
              placeholderTextColor="#9CA3AF"
              value={formData.paidAmount}
              onChangeText={value => handleInputChange('paidAmount', value)}
              keyboardType="numeric"
            />
          </View>

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
                  onPress={() => handleInputChange('paymentMethod', method)}>
                  <Text
                    style={[
                      styles.paymentMethodText,
                      formData.paymentMethod === method &&
                        styles.paymentMethodTextActive,
                    ]}>
                    {method}
                  </Text>
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
              placeholderTextColor="#9CA3AF"
              value={formData.bookNumber}
              onChangeText={value => handleInputChange('bookNumber', value)}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isLoading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Add Donator</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  form: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#374151',
  },
  textArea: {
    height: 80,
    paddingTop: 16,
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentMethodButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  paymentMethodActive: {
    backgroundColor: '#60A5FA',
    borderColor: '#60A5FA',
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  paymentMethodTextActive: {
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#60A5FA',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default AddDonator;
