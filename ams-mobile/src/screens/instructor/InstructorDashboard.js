import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';

const InstructorDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalAssignments: 0,
    pendingSubmissions: 0,
    gradedSubmissions: 0,
    totalStudents: 0,
    recentSubmissions: [],
    myAssignments: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      console.log('📥 Instructor Dashboard verileri getiriliyor...');

      // Tüm ödevleri çek (instructor'ın ödevleri)
      const assignmentsResponse = await apiClient.get('/Assignment');
      
      if (assignmentsResponse.data.isSuccess) {
        const allAssignments = assignmentsResponse.data.data || [];
        
        // Instructor'ın ödevleri (classId'ye göre filtreleme yapılabilir)
        const myAssignments = allAssignments.slice(0, 5); // Son 5 ödev
        
        // İstatistikler
        const totalAssignments = allAssignments.length;
        const totalSubmissions = allAssignments.reduce((sum, a) => sum + (a.totalSubmissions || 0), 0);
        
        setDashboardData({
          totalAssignments,
          pendingSubmissions: totalSubmissions, // Backend'den gerçek veri gelecek
          gradedSubmissions: 0,
          totalStudents: 0,
          recentSubmissions: [],
          myAssignments,
        });

        console.log('✅ Dashboard verileri yüklendi');
      }
    } catch (error) {
      console.error('❌ Dashboard veri hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setIsRefreshing(false);
  };

  const renderAssignmentCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.assignmentCard}
      onPress={() => navigation.navigate('Assignments', {
        screen: 'SubmissionsList',
        params: { assignmentId: item.id, assignmentTitle: item.title }
      })}
    >
      <View style={styles.assignmentHeader}>
        <Text style={styles.assignmentTitle}>{item.title}</Text>
        <Text style={styles.submissionCount}>{item.totalSubmissions || 0} teslim</Text>
      </View>
      <Text style={styles.assignmentClass}>{item.className}</Text>
      <Text style={styles.assignmentDate}>
        Son Tarih: {new Date(item.dueDate).toLocaleDateString('tr-TR')}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Dashboard yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>👋 Hoş geldin,</Text>
          <Text style={styles.userName}>{user?.firstName}!</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.profileIcon}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📚</Text>
          <Text style={styles.statValue}>{dashboardData.totalAssignments}</Text>
          <Text style={styles.statLabel}>Ödevler</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>⏳</Text>
          <Text style={styles.statValue}>{dashboardData.pendingSubmissions}</Text>
          <Text style={styles.statLabel}>Bekleyen</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>✅</Text>
          <Text style={styles.statValue}>{dashboardData.gradedSubmissions}</Text>
          <Text style={styles.statLabel}>Notlandı</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>👥</Text>
          <Text style={styles.statValue}>{dashboardData.totalStudents}</Text>
          <Text style={styles.statLabel}>Öğrenci</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Assignments', { screen: 'CreateAssignment' })}
          >
            <Text style={styles.actionIcon}>➕</Text>
            <Text style={styles.actionText}>Yeni Ödev</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Assignments')}
          >
            <Text style={styles.actionIcon}>📝</Text>
            <Text style={styles.actionText}>Değerlendir</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Students')}
          >
            <Text style={styles.actionIcon}>👥</Text>
            <Text style={styles.actionText}>Öğrenciler</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* My Assignments */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📚 Ödevlerim</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Assignments')}>
            <Text style={styles.seeAllText}>Tümünü Gör →</Text>
          </TouchableOpacity>
        </View>
        
        {dashboardData.myAssignments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Henüz ödev yok</Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => navigation.navigate('Assignments', { screen: 'CreateAssignment' })}
            >
              <Text style={styles.createButtonText}>+ Ödev Oluştur</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={dashboardData.myAssignments}
            renderItem={renderAssignmentCard}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />
        )}
      </View>

      {/* Bottom Spacing */}
      <View style={{ height: 80 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  assignmentCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
  },
  submissionCount: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  assignmentClass: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  assignmentDate: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default InstructorDashboard;