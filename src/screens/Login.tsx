import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import {authAPI, ApiError} from '../Api/auth';
import {useAuth} from '../context/AuthContext';

const {width, height} = Dimensions.get('window');

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {login} = useAuth();

  const handleLogin = async () => {
    // Basic validation
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authAPI.login({
        email: email.trim(),
        password: password.trim(),
      });

      console.log('📥 Login response:', response);

      // Store authentication data using AuthContext
      await login(response.token, response.user);

      console.log('✅ User authenticated and data stored');
    } catch (error) {
      console.log('❌ Login error:', error);

      if (error instanceof ApiError) {
        Alert.alert('Login Failed', error.message);
      } else {
        Alert.alert('Error', 'An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        {/* Background Decorations */}
        <View style={styles.backgroundDecoration}>
          <View style={styles.circle1} />
          <View style={styles.circle2} />
          <View style={styles.circle3} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.brandContainer}>
              <View style={styles.logoContainer}>
                <View style={styles.chartIcon}>
                  <View style={styles.chartBar1} />
                  <View style={styles.chartBar2} />
                  <View style={styles.chartBar3} />
                  <View style={styles.chartBar4} />
                </View>
              </View>
              <Text style={styles.brandName}>DonationManager</Text>
            </View>

            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Welcome Back</Text>
              <Text style={styles.subtitleText}>
                Sign in to manage your donations
              </Text>
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <View style={styles.formCard}>
              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email or Phone</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputIcon}>📧</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your email or phone"
                    placeholderTextColor="#64748B"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isLoading}
                    returnKeyType="next"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your password"
                    placeholderTextColor="#64748B"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}>
                    <Text style={styles.eyeIcon}>
                      {showPassword ? '🙈' : '👁️'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sign In Button */}
              <TouchableOpacity
                style={[
                  styles.signInButton,
                  isLoading && styles.signInButtonDisabled,
                ]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.8}>
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#F1F5F9" />
                    <Text style={styles.loadingText}>Signing in...</Text>
                  </View>
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.signInButtonText}>Sign In</Text>
                    <Text style={styles.buttonIcon}>→</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Forgot Password */}
              <TouchableOpacity style={styles.forgotPasswordButton}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footerSection}>
            <Text style={styles.footerText}>
              Secure login with end-to-end encryption
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    minHeight: height,
  },
  backgroundDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  circle1: {
    position: 'absolute',
    top: height * 0.1,
    right: -width * 0.1,
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    opacity: 0.5,
  },
  circle2: {
    position: 'absolute',
    top: height * 0.3,
    left: -width * 0.15,
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    opacity: 0.3,
  },
  circle3: {
    position: 'absolute',
    bottom: height * 0.2,
    right: -width * 0.08,
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: width * 0.15,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    opacity: 0.4,
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: height * 0.08,
    paddingHorizontal: width * 0.05,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: height * 0.04,
  },
  logoContainer: {
    width: Math.min(width * 0.2, 80),
    height: Math.min(width * 0.2, 80),
    borderRadius: Math.min(width * 0.1, 40),
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartIcon: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  chartBar1: {
    width: 6,
    height: 16,
    backgroundColor: '#22C55E',
    borderRadius: 3,
  },
  chartBar2: {
    width: 6,
    height: 24,
    backgroundColor: '#60A5FA',
    borderRadius: 3,
  },
  chartBar3: {
    width: 6,
    height: 20,
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  chartBar4: {
    width: 6,
    height: 28,
    backgroundColor: '#8B5CF6',
    borderRadius: 3,
  },
  brandName: {
    fontSize: Math.min(width * 0.04, 16),
    fontWeight: '600',
    color: '#60A5FA',
    letterSpacing: 0.5,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingBottom: height * 0.03,
  },
  welcomeText: {
    fontSize: Math.min(width * 0.08, 32),
    fontWeight: '800',
    color: '#F1F5F9',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: Math.min(width * 0.04, 16),
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: width * 0.05,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.05,
    minHeight: height * 0.4,
  },
  formCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 24,
    padding: Math.min(width * 0.08, 32),
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  inputGroup: {
    marginBottom: height * 0.03,
  },
  inputLabel: {
    fontSize: Math.min(width * 0.035, 14),
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(51, 65, 85, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 4 : 2,
    minHeight: height * 0.065,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 16 : 12,
    fontSize: Math.min(width * 0.04, 16),
    color: '#F1F5F9',
    fontWeight: '500',
  },
  eyeButton: {
    padding: 8,
    minWidth: 32,
    alignItems: 'center',
  },
  eyeIcon: {
    fontSize: 16,
  },
  signInButton: {
    backgroundColor: 'rgba(96, 165, 250, 0.9)',
    borderRadius: 16,
    paddingVertical: height * 0.02,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    shadowColor: '#60A5FA',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    minHeight: height * 0.06,
  },
  signInButtonDisabled: {
    backgroundColor: 'rgba(100, 116, 139, 0.5)',
    borderColor: 'rgba(100, 116, 139, 0.3)',
    shadowOpacity: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signInButtonText: {
    color: '#F1F5F9',
    fontSize: Math.min(width * 0.045, 18),
    fontWeight: '700',
  },
  buttonIcon: {
    fontSize: Math.min(width * 0.045, 18),
    color: '#F1F5F9',
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#F1F5F9',
    fontSize: Math.min(width * 0.04, 16),
    fontWeight: '600',
  },
  forgotPasswordButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  forgotPasswordText: {
    color: '#60A5FA',
    fontSize: Math.min(width * 0.04, 16),
    fontWeight: '500',
  },
  footerSection: {
    alignItems: 'center',
    paddingBottom: height * 0.05,
    paddingHorizontal: width * 0.05,
  },
  footerText: {
    fontSize: Math.min(width * 0.03, 12),
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 12,
  },
});
export default Login;
