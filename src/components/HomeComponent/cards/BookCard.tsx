import React from 'react';
import {TouchableOpacity, View, Text, StyleSheet} from 'react-native';
import {BookSummary} from '../../../Api/donationAPI';

interface BookCardProps {
  book: BookSummary;
  onPress: () => void;
}

export const BookCard: React.FC<BookCardProps> = ({book, onPress}) => {
  const progressPercentage = (
    (book.totalPaid / book.totalAmount) *
    100
  ).toFixed(0);

  return (
    <TouchableOpacity
      style={styles.bookCard}
      onPress={onPress}
      activeOpacity={0.8}>
      <View style={styles.bookHeader}>
        <Text style={styles.bookTitle}>Book {book.bookNumber}</Text>
        <Text style={styles.bookProgress}>{progressPercentage}%</Text>
      </View>

      <View style={styles.bookStats}>
        <View style={styles.bookStat}>
          <Text style={styles.bookStatValue}>
            ₹{(book.totalAmount / 1000).toFixed(0)}K
          </Text>
          <Text style={styles.bookStatLabel}>Total</Text>
        </View>
        <View style={styles.bookStat}>
          <Text style={styles.bookStatValue}>
            ₹{(book.totalPaid / 1000).toFixed(0)}K
          </Text>
          <Text style={styles.bookStatLabel}>Paid</Text>
        </View>
      </View>

      <View style={styles.bookProgressBar}>
        <View
          style={[
            styles.bookProgressFill,
            {width: `${(book.totalPaid / book.totalAmount) * 100}%`},
          ]}
        />
      </View>

      <Text style={styles.tapHint}>Tap for details</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  bookCard: {
    width: 200,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
    marginRight: 4,
  },
  bookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  bookProgress: {
    fontSize: 12,
    fontWeight: '600',
    color: '#60A5FA',
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
  },
  bookStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  bookStat: {
    flex: 1,
  },
  bookStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  bookStatLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  bookProgressBar: {
    height: 4,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  bookProgressFill: {
    height: '100%',
    backgroundColor: '#60A5FA',
    borderRadius: 2,
  },
  tapHint: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
