import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Linking,
  TouchableOpacity,
} from 'react-native';

const Details = ({route}: any) => {
  const {repo} = route.params;

  const openGitHub = () => {
    Linking.openURL(repo.html_url);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image source={{uri: repo.owner.avatar_url}} style={styles.avatar} />
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>{repo.name}</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL(repo.owner.html_url)}>
            <Text style={styles.owner}>@{repo.owner.login}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>
            {repo.description || 'No description available'}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{repo.stargazers_count}</Text>
            <Text style={styles.statLabel}>⭐ Stars</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{repo.forks_count}</Text>
            <Text style={styles.statLabel}>🍴 Forks</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{repo.open_issues_count}</Text>
            <Text style={styles.statLabel}>⚠️ Issues</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Language</Text>
            <Text style={styles.detailValue}>{repo.language || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created</Text>
            <Text style={styles.detailValue}>
              {new Date(repo.created_at).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last Updated</Text>
            <Text style={styles.detailValue}>
              {new Date(repo.updated_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={openGitHub}>
          <Text style={styles.buttonText}>View on GitHub</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eaecef',
  },
  headerTextContainer: {
    alignItems: 'center',
    marginTop: 15,
  },
  content: {
    padding: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#eaecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#24292e',
    textAlign: 'center',
  },
  owner: {
    fontSize: 16,
    color: '#0366d6',
    marginTop: 5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eaecef',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#24292e',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#57606a',
    lineHeight: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eaecef',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#24292e',
  },
  statLabel: {
    fontSize: 14,
    color: '#57606a',
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eaecef',
  },
  detailLabel: {
    fontSize: 16,
    color: '#57606a',
  },
  detailValue: {
    fontSize: 16,
    color: '#24292e',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#2ea44f',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Details;
