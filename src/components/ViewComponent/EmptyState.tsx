import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';

interface EmptyStateProps {
  searchQuery: string;
  activeFiltersCount: number;
  onClearFilters: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  searchQuery,
  activeFiltersCount,
  onClearFilters,
}) => {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={styles.emptyTitle}>No donations found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery || activeFiltersCount > 0
          ? 'Try adjusting your search or filters'
          : 'Add your first donator to get started'}
      </Text>
      {activeFiltersCount > 0 && (
        <TouchableOpacity
          style={styles.clearFiltersButton}
          onPress={onClearFilters}>
          <Text style={styles.clearFiltersIcon}>🔄</Text>
          <Text style={styles.clearFiltersText}>Clear all filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(96, 165, 250, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    gap: 8,
  },
  clearFiltersIcon: {
    fontSize: 16,
  },
  clearFiltersText: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default EmptyState;
