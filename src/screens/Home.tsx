import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Repo = {
  id: number;
  name: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
  owner: {
    login: string;
    avatar_url: string;
  };
};

const GitRepoList = ({navigation}: any) => {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('react-native');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState<Repo[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);

  useEffect(() => {
    fetchRepos(searchQuery);
    loadFavorites();
  }, []);

  const fetchRepos = async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://api.github.com/search/repositories?q=${query}`,
      );
      if (!response.ok) {
        throw new Error('Failed to fetch repositories');
      }
      const data = await response.json();
      setRepos(data.items || []);
    } catch (err) {
      setError('Failed to fetch repositories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.length > 2) {
      fetchRepos(text);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRepos(searchQuery);
  };

  const toggleFavorite = async (repo: Repo) => {
    let updatedFavorites = [...favorites];
    const index = updatedFavorites.findIndex(fav => fav.id === repo.id);

    if (index !== -1) {
      updatedFavorites.splice(index, 1);
    } else {
      updatedFavorites.push(repo);
    }

    setFavorites(updatedFavorites);
    await AsyncStorage.setItem('favorites', JSON.stringify(updatedFavorites));
  };

  const loadFavorites = async () => {
    const storedFavorites = await AsyncStorage.getItem('favorites');
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
  };

  const isFavorite = (repoId: number) => {
    return favorites.some(fav => fav.id === repoId);
  };

  const renderItem = ({item}: {item: Repo}) => (
    <TouchableOpacity
      style={styles.repoItem}
      onPress={() => navigation.navigate('Details', {repo: item})}>
      <View style={styles.itemHeader}>
        <Image source={{uri: item.owner.avatar_url}} style={styles.avatar} />
        <View style={styles.headerText}>
          <Text style={styles.repoName}>{item.name}</Text>
          <Text style={styles.ownerName}>@{item.owner.login}</Text>
        </View>
        {/* Favorite Button */}
        <TouchableOpacity onPress={() => toggleFavorite(item)}>
          <Text style={styles.favoriteIcon}>
            {isFavorite(item.id) ? '⭐' : '☆'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text numberOfLines={2} style={styles.description}>
        {item.description || 'No description'}
      </Text>

      <View style={styles.statsContainer}>
        <Text style={styles.statNumber}>⭐ {item.stargazers_count}</Text>
        <Text style={styles.statNumber}>🍴 {item.forks_count}</Text>
        <Text style={styles.statNumber}>🏷 {item.language || 'N/A'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>GitHub Explorer</Text>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchBar}
            placeholder="Search repositories..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>

        <TouchableOpacity
          style={styles.favButton}
          onPress={() => setShowFavorites(!showFavorites)}>
          <Text style={styles.favButtonText}>
            {showFavorites ? 'Show All Repos' : 'Show Favorites'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing && (
        <ActivityIndicator style={styles.loader} size="large" color="#0366d6" />
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.error}>{error}</Text>
        </View>
      )}

      <FlatList
        data={showFavorites ? favorites : repos}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f8f9fa'},
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#eaecef',
  },
  title: {fontSize: 28, fontWeight: 'bold', color: '#24292e', marginBottom: 16},
  searchContainer: {marginBottom: 8},
  searchBar: {
    height: 46,
    backgroundColor: '#f6f8fa',
    borderWidth: 1,
    borderColor: '#e1e4e8',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#24292e',
  },
  favButton: {
    padding: 10,
    backgroundColor: '#0366d6',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  favButtonText: {color: 'white', fontWeight: 'bold'},
  listContainer: {padding: 16},
  repoItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eaecef',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: {width: 48, height: 48, borderRadius: 24, marginRight: 12},
  repoName: {fontSize: 18, fontWeight: 'bold', color: '#24292e'},
  ownerName: {fontSize: 14, color: '#0366d6'},
  description: {
    fontSize: 15,
    color: '#57606a',
    lineHeight: 22,
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  statNumber: {fontSize: 14, color: '#24292e', fontWeight: '500'},
  favoriteIcon: {fontSize: 22, paddingHorizontal: 10, color: '#0366d6'},
});

export default GitRepoList;
