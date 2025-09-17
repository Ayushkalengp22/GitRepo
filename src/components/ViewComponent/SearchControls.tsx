import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';

interface FilterState {
  status: string;
  amountRange: string;
  balanceRange: string;
  priority: string;
}

interface SearchControlsProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeFiltersCount: number;
  onOpenFilters: () => void;
  filteredCount: number;
  isGeneratingPDF: boolean;
  onDownloadPDF: () => void;
  filters: FilterState;
  onClearAllFilters: () => void;
}

const SearchControls: React.FC<SearchControlsProps> = ({
  searchQuery,
  setSearchQuery,
  activeFiltersCount,
  onOpenFilters,
  filteredCount,
  isGeneratingPDF,
  onDownloadPDF,
  filters,
  onClearAllFilters,
}) => {
  const renderActiveFilters = () => {
    if (activeFiltersCount === 0) return null;

    return (
      <View style={styles.activeFiltersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.activeFiltersRow}>
            {filters.status !== 'ALL' && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>
                  Status: {filters.status}
                </Text>
              </View>
            )}
            {filters.amountRange !== 'ALL' && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>
                  Amount: {filters.amountRange}
                </Text>
              </View>
            )}
            {filters.balanceRange !== 'ALL' && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>
                  Balance: {filters.balanceRange}
                </Text>
              </View>
            )}
            {filters.priority !== 'ALL' && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>
                  {filters.priority.replace('_', ' ')}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.clearAllChip}
              onPress={onClearAllFilters}>
              <Text style={styles.clearAllText}>Clear All ✕</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.controlsSection}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search donators..."
          placeholderTextColor="#64748B"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearSearchButton}
            onPress={() => setSearchQuery('')}>
            <Text style={styles.clearSearchIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Controls */}
      <View style={styles.filterControls}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFiltersCount > 0 && styles.filterButtonActive,
          ]}
          onPress={onOpenFilters}>
          <Text style={styles.filterButtonIcon}>⚙️</Text>
          <Text style={styles.filterButtonText}>
            Filters
            {activeFiltersCount > 0 && (
              <Text style={styles.filterBadge}> ({activeFiltersCount})</Text>
            )}
          </Text>
        </TouchableOpacity>

        <View style={styles.resultsCounter}>
          <Text style={styles.resultsText}>
            {filteredCount} result{filteredCount !== 1 ? 's' : ''}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.pdfButton,
            isGeneratingPDF && styles.pdfButtonDisabled,
          ]}
          onPress={onDownloadPDF}
          disabled={isGeneratingPDF}>
          <Text style={styles.pdfButtonText}>
            {isGeneratingPDF ? '⏳' : '📄'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Active Filters Preview */}
      {renderActiveFilters()}
    </View>
  );
};

const styles = StyleSheet.create({
  controlsSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(51, 65, 85, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#F1F5F9',
    paddingVertical: 0,
  },
  clearSearchButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearSearchIcon: {
    fontSize: 12,
    color: '#94A3B8',
  },
  filterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    flex: 1,
  },
  filterButtonActive: {
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    borderColor: 'rgba(96, 165, 250, 0.5)',
  },
  filterButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E2E8F0',
  },
  filterBadge: {
    color: '#60A5FA',
    fontWeight: '600',
  },
  resultsCounter: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  resultsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  pdfButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(96, 165, 250, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  pdfButtonDisabled: {
    backgroundColor: 'rgba(100, 116, 139, 0.5)',
  },
  pdfButtonText: {
    fontSize: 18,
  },
  activeFiltersContainer: {
    marginTop: 12,
  },
  activeFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 20,
  },
  activeFilterChip: {
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  activeFilterText: {
    fontSize: 12,
    color: '#60A5FA',
    fontWeight: '500',
  },
  clearAllChip: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  clearAllText: {
    fontSize: 12,
    color: '#F87171',
    fontWeight: '500',
  },
});

export default SearchControls;
