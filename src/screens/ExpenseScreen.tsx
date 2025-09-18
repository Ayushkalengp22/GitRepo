import {StyleSheet, Text, View} from 'react-native';
const ExpenseScreen = () => {
  return (
    <View style={styles.placeholderContainer}>
      <View style={styles.placeholderContent}>
        <Text style={styles.placeholderIcon}>💸</Text>
        <Text style={styles.placeholderTitle}>Expense Tracking</Text>
        <Text style={styles.placeholderSubtitle}>
          Track your organization's expenses and budgets
        </Text>
        <Text style={styles.placeholderNote}>Coming Soon...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  placeholderContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  placeholderContent: {
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 32,
    paddingVertical: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
    maxWidth: 320,
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 12,
    textAlign: 'center',
  },
  placeholderSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  placeholderNote: {
    fontSize: 14,
    color: '#60A5FA',
    fontWeight: '600',
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
});
export default ExpenseScreen;
