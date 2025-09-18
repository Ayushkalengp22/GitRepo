import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import {useAuth} from '../context/AuthContext';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const isSmallScreen = SCREEN_WIDTH < 375;

const SettingsScreen = () => {
  const {user, logout} = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ],
      {cancelable: true},
    );
  };

  const handleEditProfile = () => {
    // TODO: Navigate to edit profile screen
    Alert.alert('Coming Soon', 'Profile editing will be available soon!');
  };

  const handleChangePassword = () => {
    // TODO: Navigate to change password screen
    Alert.alert('Coming Soon', 'Password change will be available soon!');
  };

  const handleNotificationSettings = () => {
    // TODO: Navigate to notification settings
    Alert.alert('Coming Soon', 'Notification settings will be available soon!');
  };

  const handlePrivacyPolicy = () => {
    // TODO: Navigate to privacy policy
    Alert.alert('Coming Soon', 'Privacy policy will be available soon!');
  };

  const handleTermsOfService = () => {
    // TODO: Navigate to terms of service
    Alert.alert('Coming Soon', 'Terms of service will be available soon!');
  };

  const handleAbout = () => {
    Alert.alert(
      'About',
      'Donation Management App\nVersion 1.0.0\n\nBuilt with React Native',
      [{text: 'OK', style: 'default'}],
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>
            Manage your account and preferences
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {/* User Profile Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Profile Information</Text>
            </View>

            <View style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
                <View style={styles.profileInfo}>
                  {/* <Text style={styles.profileName}>
                    {user?.name || user?.email?.split('@')[0] || 'User'}
                  </Text> */}
                  <Text style={styles.profileEmail}>
                    {user?.email || 'No email'}
                  </Text>
                  <View style={styles.statusBadge}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Active</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={handleEditProfile}
                  activeOpacity={0.7}>
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Account Settings */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Account Settings</Text>
            </View>

            <View style={styles.settingsGroup}>
              <TouchableOpacity
                style={styles.settingItem}
                onPress={handleEditProfile}
                activeOpacity={0.7}>
                <View style={styles.settingItemLeft}>
                  <Text style={styles.settingIcon}>👤</Text>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>Edit Profile</Text>
                    <Text style={styles.settingSubtitle}>
                      Update your personal information
                    </Text>
                  </View>
                </View>
                <Text style={styles.settingArrow}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingItem}
                onPress={handleChangePassword}
                activeOpacity={0.7}>
                <View style={styles.settingItemLeft}>
                  <Text style={styles.settingIcon}>🔐</Text>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>Change Password</Text>
                    <Text style={styles.settingSubtitle}>
                      Update your account password
                    </Text>
                  </View>
                </View>
                <Text style={styles.settingArrow}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingItem}
                onPress={handleNotificationSettings}
                activeOpacity={0.7}>
                <View style={styles.settingItemLeft}>
                  <Text style={styles.settingIcon}>🔔</Text>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>Notifications</Text>
                    <Text style={styles.settingSubtitle}>
                      Manage notification preferences
                    </Text>
                  </View>
                </View>
                <Text style={styles.settingArrow}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* App Settings */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>App Settings</Text>
            </View>

            <View style={styles.settingsGroup}>
              <TouchableOpacity
                style={styles.settingItem}
                onPress={handlePrivacyPolicy}
                activeOpacity={0.7}>
                <View style={styles.settingItemLeft}>
                  <Text style={styles.settingIcon}>🛡️</Text>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>Privacy Policy</Text>
                    <Text style={styles.settingSubtitle}>
                      View our privacy policy
                    </Text>
                  </View>
                </View>
                <Text style={styles.settingArrow}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingItem}
                onPress={handleTermsOfService}
                activeOpacity={0.7}>
                <View style={styles.settingItemLeft}>
                  <Text style={styles.settingIcon}>📋</Text>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>Terms of Service</Text>
                    <Text style={styles.settingSubtitle}>
                      Read our terms and conditions
                    </Text>
                  </View>
                </View>
                <Text style={styles.settingArrow}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingItem}
                onPress={handleAbout}
                activeOpacity={0.7}>
                <View style={styles.settingItemLeft}>
                  <Text style={styles.settingIcon}>ℹ️</Text>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>About</Text>
                    <Text style={styles.settingSubtitle}>
                      App version and information
                    </Text>
                  </View>
                </View>
                <Text style={styles.settingArrow}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Logout Section */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.8}>
              <View style={styles.logoutContent}>
                <Text style={styles.logoutIcon}>🚪</Text>
                <Text style={styles.logoutText}>Logout</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.2)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '400',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },

  // Section Styles
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F1F5F9',
  },

  // Profile Card
  profileCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(96, 165, 250, 0.4)',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#60A5FA',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  profileEmail: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: 'rgba(96, 165, 250, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  editButtonText: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '600',
  },

  // Settings Group
  settingsGroup: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.1)',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
  },
  settingArrow: {
    fontSize: 20,
    color: '#64748B',
    fontWeight: '300',
  },

  // Logout Button
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    overflow: 'hidden',
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F87171',
  },

  bottomSpacing: {
    height: 32,
  },
});

export default SettingsScreen;
