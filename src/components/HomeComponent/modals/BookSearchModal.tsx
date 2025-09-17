import React from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';

interface BookSearchModalProps {
  visible: boolean;
  bookNumber: string;
  availableBooks: string[];
  isLoading: boolean;
  onClose: () => void;
  onBookNumberChange: (text: string) => void;
  onBookSelect: (book: string) => void;
  onSearch: () => void;
}

export const BookSearchModal: React.FC<BookSearchModalProps> = ({
  visible,
  bookNumber,
  availableBooks,
  isLoading,
  onClose,
  onBookNumberChange,
  onBookSelect,
  onSearch,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Search Book</Text>

          <TextInput
            style={styles.bookInput}
            placeholder="Enter book number"
            placeholderTextColor="#9CA3AF"
            value={bookNumber}
            onChangeText={onBookNumberChange}
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
                      onPress={() => onBookSelect(book)}>
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
              onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalSearchButton,
                isLoading && styles.modalButtonDisabled,
              ]}
              onPress={onSearch}
              disabled={isLoading}>
              <Text style={styles.modalSearchText}>
                {isLoading ? 'Searching...' : 'Search'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
});
