import React from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';

interface QuickActionsProps {
  onAddDonator: () => void;
  onViewAll: () => void;
  onSearchBook: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onAddDonator,
  onViewAll,
  onSearchBook,
}) => {
  return (
    <View style={styles.quickActions}>
      <TouchableOpacity style={styles.primaryAction} onPress={onAddDonator}>
        <Text style={styles.actionIcon}>+</Text>
        <Text style={styles.actionText}>Add Donator</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryAction} onPress={onViewAll}>
        <Text style={styles.actionIcon}>📋</Text>
        <Text style={styles.actionText}>View All</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryAction} onPress={onSearchBook}>
        <Text style={styles.actionIcon}>📚</Text>
        <Text style={styles.actionText}>Books</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  primaryAction: {
    flex: 2,
    backgroundColor: 'rgba(96, 165, 250, 0.9)',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F1F5F9',
    textAlign: 'center',
  },
});
