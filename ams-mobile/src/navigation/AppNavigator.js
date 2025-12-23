import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';
import AuthNavigator from './AuthNavigator';
import InstructorNavigator from './InstructorNavigator';
import StudentNavigator from './StudentNavigator';

const AppNavigator = () => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  console.log('🔍 Auth State:', { isAuthenticated, isLoading, user });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8A65" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthNavigator />
      ) : user?.role === ROLES.STUDENT ? (
        <StudentNavigator />
      ) : user?.role === ROLES.INSTRUCTOR ? (
        <InstructorNavigator />
      ) : user?.role === ROLES.ADMIN ? (
        <View style={styles.adminContainer}>
          <Text style={styles.title}>👔 Admin Dashboard</Text>
          <Text style={styles.subtitle}>Yakında...</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>⚠️ Hata</Text>
          <Text style={styles.errorText}>Kullanıcı rolü bulunamadı</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 10,
    color: '#757575',
    fontSize: 16,
  },
  adminContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 32,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#EF5350',
  },
  errorText: {
    fontSize: 18,
    color: '#757575',
    marginBottom: 32,
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#FF8A65',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AppNavigator;