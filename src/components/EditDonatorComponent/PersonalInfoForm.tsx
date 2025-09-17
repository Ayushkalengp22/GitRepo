import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

interface DonatorForm {
  name: string;
  email: string;
  totalAmount: string;
  balanceAmount: string;
}

interface PersonalInfoFormProps {
  donatorForm: DonatorForm;
  onInputChange: (field: string, value: string) => void;
  onUpdate: () => void;
  isSaving: boolean;
}

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
  donatorForm,
  onInputChange,
  onUpdate,
  isSaving,
}) => {
  return (
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
          onChangeText={value => onInputChange('name', value)}
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
          onChangeText={value => onInputChange('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity
        style={[styles.updateButton, isSaving && styles.updateButtonDisabled]}
        onPress={onUpdate}
        disabled={isSaving}>
        {isSaving ? (
          <View style={styles.buttonLoadingContent}>
            <ActivityIndicator size="small" color="#F1F5F9" />
            <Text style={styles.buttonLoadingText}>Updating...</Text>
          </View>
        ) : (
          <View style={styles.buttonContent}>
            <Text style={styles.buttonIcon}>✓</Text>
            <Text style={styles.updateButtonText}>Update Information</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default PersonalInfoForm;
