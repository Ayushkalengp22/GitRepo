import React from 'react';
import {
  View,
  Text,
  Modal,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

// Filter types
type FilterType = 'ALL' | 'PAID' | 'PARTIAL' | 'PENDING';
type AmountRangeFilter = 'ALL' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'CUSTOM';
type BalanceRangeFilter = 'ALL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'ZERO';
type SortOption =
  | 'NAME_ASC'
  | 'NAME_DESC'
  | 'AMOUNT_ASC'
  | 'AMOUNT_DESC'
  | 'BALANCE_ASC'
  | 'BALANCE_DESC'
  | 'DONATIONS_COUNT';

interface FilterState {
  status: FilterType;
  amountRange: AmountRangeFilter;
  balanceRange: BalanceRangeFilter;
  addedBy: string;
  donationsCount: 'ALL' | 'SINGLE' | 'MULTIPLE';
  priority: 'ALL' | 'HIGH_PRIORITY' | 'LOW_PRIORITY';
  sortBy: SortOption;
  customAmountMin: string;
  customAmountMax: string;
}

interface FilterModalProps {
  visible: boolean;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  filteredDonatorsCount: number;
  onClose: () => void;
  onClearAll: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  filters,
  setFilters,
  filteredDonatorsCount,
  onClose,
  onClearAll,
}) => {
  return (
    <Modal visible={visible} animationType="fade" presentationStyle="pageSheet">
      <View style={styles.modalBackground}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalHeaderButton}
              onPress={onClose}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filters & Sort</Text>
            <TouchableOpacity
              style={styles.modalHeaderButton}
              onPress={onClearAll}>
              <Text style={styles.modalClear}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}>
            {/* Status Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Payment Status</Text>
              <View style={styles.filterOptionsGrid}>
                {(['ALL', 'PAID', 'PARTIAL', 'PENDING'] as FilterType[]).map(
                  status => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.filterOption,
                        filters.status === status && styles.filterOptionActive,
                      ]}
                      onPress={() => setFilters(prev => ({...prev, status}))}>
                      <Text
                        style={[
                          styles.filterOptionText,
                          filters.status === status &&
                            styles.filterOptionTextActive,
                        ]}>
                        {status}
                      </Text>
                    </TouchableOpacity>
                  ),
                )}
              </View>
            </View>

            {/* Amount Range Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Amount Range</Text>
              <View style={styles.filterOptionsList}>
                {[
                  {key: 'ALL', label: 'All Amounts', icon: '💰'},
                  {key: 'SMALL', label: 'Under ₹5,000', icon: '🔸'},
                  {key: 'MEDIUM', label: '₹5,000 - ₹25,000', icon: '🔹'},
                  {key: 'LARGE', label: 'Above ₹25,000', icon: '🔷'},
                ].map(option => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.filterOptionRow,
                      filters.amountRange === option.key &&
                        styles.filterOptionRowActive,
                    ]}
                    onPress={() =>
                      setFilters(prev => ({
                        ...prev,
                        amountRange: option.key as AmountRangeFilter,
                      }))
                    }>
                    <Text style={styles.filterOptionIcon}>{option.icon}</Text>
                    <Text
                      style={[
                        styles.filterOptionRowText,
                        filters.amountRange === option.key &&
                          styles.filterOptionRowTextActive,
                      ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Balance Range Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Outstanding Balance</Text>
              <View style={styles.filterOptionsList}>
                {[
                  {key: 'ALL', label: 'All Balances', icon: '⚖️'},
                  {key: 'ZERO', label: 'Fully Paid (₹0)', icon: '✅'},
                  {key: 'LOW', label: 'Low (₹1 - ₹1,000)', icon: '🟢'},
                  {
                    key: 'MEDIUM',
                    label: 'Medium (₹1,001 - ₹10,000)',
                    icon: '🟡',
                  },
                  {key: 'HIGH', label: 'High (₹10,000+)', icon: '🔴'},
                ].map(option => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.filterOptionRow,
                      filters.balanceRange === option.key &&
                        styles.filterOptionRowActive,
                    ]}
                    onPress={() =>
                      setFilters(prev => ({
                        ...prev,
                        balanceRange: option.key as BalanceRangeFilter,
                      }))
                    }>
                    <Text style={styles.filterOptionIcon}>{option.icon}</Text>
                    <Text
                      style={[
                        styles.filterOptionRowText,
                        filters.balanceRange === option.key &&
                          styles.filterOptionRowTextActive,
                      ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Priority Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Priority Level</Text>
              <View style={styles.filterOptionsList}>
                {[
                  {key: 'ALL', label: 'All Priority', icon: '📋'},
                  {
                    key: 'HIGH_PRIORITY',
                    label: 'High Priority (₹10,000+ balance)',
                    icon: '🔥',
                  },
                  {
                    key: 'LOW_PRIORITY',
                    label: 'Low Priority (≤₹1,000 balance)',
                    icon: '❄️',
                  },
                ].map(option => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.filterOptionRow,
                      filters.priority === option.key &&
                        styles.filterOptionRowActive,
                    ]}
                    onPress={() =>
                      setFilters(prev => ({
                        ...prev,
                        priority: option.key as
                          | 'ALL'
                          | 'HIGH_PRIORITY'
                          | 'LOW_PRIORITY',
                      }))
                    }>
                    <Text style={styles.filterOptionIcon}>{option.icon}</Text>
                    <Text
                      style={[
                        styles.filterOptionRowText,
                        filters.priority === option.key &&
                          styles.filterOptionRowTextActive,
                      ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sort Options */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Sort By</Text>
              <View style={styles.filterOptionsList}>
                {[
                  {key: 'NAME_ASC', label: 'Name (A-Z)', icon: '🔤'},
                  {key: 'NAME_DESC', label: 'Name (Z-A)', icon: '🔣'},
                  {
                    key: 'AMOUNT_DESC',
                    label: 'Highest Amount First',
                    icon: '⬆️',
                  },
                  {key: 'AMOUNT_ASC', label: 'Lowest Amount First', icon: '⬇️'},
                  {
                    key: 'BALANCE_DESC',
                    label: 'Highest Balance First',
                    icon: '📈',
                  },
                  {
                    key: 'BALANCE_ASC',
                    label: 'Lowest Balance First',
                    icon: '📉',
                  },
                  {
                    key: 'DONATIONS_COUNT',
                    label: 'Most Donations First',
                    icon: '🔢',
                  },
                ].map(option => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.filterOptionRow,
                      filters.sortBy === option.key &&
                        styles.filterOptionRowActive,
                    ]}
                    onPress={() =>
                      setFilters(prev => ({
                        ...prev,
                        sortBy: option.key as SortOption,
                      }))
                    }>
                    <Text style={styles.filterOptionIcon}>{option.icon}</Text>
                    <Text
                      style={[
                        styles.filterOptionRowText,
                        filters.sortBy === option.key &&
                          styles.filterOptionRowTextActive,
                      ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.applyButton} onPress={onClose}>
              <Text style={styles.applyButtonIcon}>✓</Text>
              <Text style={styles.applyButtonText}>
                Apply Filters ({filteredDonatorsCount})
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.2)',
  },
  modalHeaderButton: {
    minWidth: 60,
  },
  modalCancel: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  modalClear: {
    fontSize: 16,
    color: '#F87171',
    fontWeight: '600',
    textAlign: 'right',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  filterSection: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 16,
  },
  filterOptionsGrid: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
  },
  filterOptionActive: {
    backgroundColor: 'rgba(96, 165, 250, 0.9)',
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  filterOptionText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#F1F5F9',
    fontWeight: '600',
  },
  filterOptionsList: {
    gap: 8,
  },
  filterOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
  },
  filterOptionRowActive: {
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    borderColor: 'rgba(96, 165, 250, 0.5)',
  },
  filterOptionIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 20,
  },
  filterOptionRowText: {
    fontSize: 14,
    color: '#E2E8F0',
    fontWeight: '500',
    flex: 1,
  },
  filterOptionRowTextActive: {
    color: '#60A5FA',
    fontWeight: '600',
  },
  modalFooter: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.2)',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(96, 165, 250, 0.9)',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    gap: 8,
  },
  applyButtonIcon: {
    fontSize: 16,
    color: '#F1F5F9',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F1F5F9',
  },
});

export default FilterModal;
