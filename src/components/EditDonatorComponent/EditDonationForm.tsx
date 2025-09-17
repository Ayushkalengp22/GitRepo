import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {PaymentMethod} from '../../Api/donationAPI';

interface DonationForm {
  paidAmount: string;
  paymentMethod: PaymentMethod;
  name: string;
}

interface EditDonationFormProps {
  donationForm: DonationForm;
  onInputChange: (field: string, value: string) => void;
  onUpdate: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

const EditDonationForm: React.FC<EditDonationFormProps> = ({
  donationForm,
  onInputChange,
  onUpdate,
  onCancel,
  isSaving,
}) => {
  const paymentMethods: PaymentMethod[] = ['Not Done', 'Cash', 'Online'];

  return (
    <View style={styles.editForm}>
      <Text style={styles.editFormTitle}>Update Selected Donation</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Additional Payment</Text>
        <View style={styles.amountInputContainer}>
          <Text style={styles.currencySymbol}>₹</Text>
          <TextInput
            style={[styles.textInput, styles.amountInput]}
            placeholder="0.00"
            placeholderTextColor="#64748B"
            value={donationForm.paidAmount}
            onChangeText={value => onInputChange('paidAmount', value)}
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
              onPress={() => onInputChange('paymentMethod', method)}>
              <View style={styles.paymentMethodContent}>
                <Text style={styles.paymentMethodButtonIcon}>
                  {method === 'Cash' ? '💵' : method === 'Online' ? '💳' : '⏳'}
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
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={onUpdate}
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
  );
};

const styles = StyleSheet.create({
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
});

export default EditDonationForm;
