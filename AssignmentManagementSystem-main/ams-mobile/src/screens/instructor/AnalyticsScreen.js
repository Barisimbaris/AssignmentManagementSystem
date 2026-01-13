import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import apiClient from '../../api/client';
import { colors } from '../../theme/colors';

const AnalyticsScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [classStatistics, setClassStatistics] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      
      // Instructor dashboard verilerini çek
      const dashboardResponse = await apiClient.get('/Dashboard/instructor');
      
      // Class statistics çek
      const statsResponse = await apiClient.get('/Dashboard/statistics/my-classes');
      
      if (dashboardResponse.data.isSuccess) {
        setDashboardData(dashboardResponse.data.data);
      }
      
      if (statsResponse.data.isSuccess) {
        setClassStatistics(statsResponse.data.data || []);
      }
    } catch (error) {
      console.error('❌ Analiz verileri yüklenemedi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchAnalytics();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Analizler yükleniyor...</Text>
      </View>
    );
  }

  if (!dashboardData) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Veri yüklenemedi</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📊 Analizler</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Genel İstatistikler */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📈 Genel İstatistikler</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📚</Text>
            <Text style={styles.statValue}>{dashboardData.totalClasses || 0}</Text>
            <Text style={styles.statLabel}>Class</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>👥</Text>
            <Text style={styles.statValue}>{dashboardData.totalStudents || 0}</Text>
            <Text style={styles.statLabel}>Öğrenci</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📝</Text>
            <Text style={styles.statValue}>{dashboardData.totalAssignments || 0}</Text>
            <Text style={styles.statLabel}>Ödev</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⏳</Text>
            <Text style={styles.statValue}>{dashboardData.pendingGrades || 0}</Text>
            <Text style={styles.statLabel}>Bekleyen</Text>
          </View>
        </View>
      </View>

      {/* Class Bazında İstatistikler */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📚 Class İstatistikleri</Text>
        {classStatistics.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Henüz class istatistiği yok</Text>
          </View>
        ) : (
          classStatistics.map((stat) => (
            <View key={stat.classId} style={styles.classStatCard}>
              <View style={styles.classStatHeader}>
                <View style={styles.classStatHeaderLeft}>
                  <Text style={styles.classStatName}>{stat.className}</Text>
                  <Text style={styles.classStatCode}>{stat.courseCode}</Text>
                </View>
                <View style={styles.classStatGrade}>
                  <Text style={styles.classStatGradeValue}>
                    {stat.averageGrade.toFixed(1)}%
                  </Text>
                  <Text style={styles.classStatGradeLabel}>Ortalama</Text>
                </View>
              </View>
              
              <View style={styles.classStatDetails}>
                <View style={styles.classStatDetailItem}>
                  <Text style={styles.classStatDetailLabel}>Öğrenci</Text>
                  <Text style={styles.classStatDetailValue}>{stat.totalStudents}</Text>
                </View>
                <View style={styles.classStatDetailItem}>
                  <Text style={styles.classStatDetailLabel}>Ödev</Text>
                  <Text style={styles.classStatDetailValue}>{stat.totalAssignments}</Text>
                </View>
                <View style={styles.classStatDetailItem}>
                  <Text style={styles.classStatDetailLabel}>Teslim</Text>
                  <Text style={styles.classStatDetailValue}>{stat.totalSubmissions}</Text>
                </View>
                <View style={styles.classStatDetailItem}>
                  <Text style={styles.classStatDetailLabel}>Bekleyen</Text>
                  <Text style={[styles.classStatDetailValue, { color: colors.warning || colors.error }]}>
                    {stat.pendingSubmissions}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Yaklaşan Deadline'lar */}
      {dashboardData.upcomingDeadlines && dashboardData.upcomingDeadlines.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏰ Yaklaşan Deadline'lar</Text>
          {dashboardData.upcomingDeadlines.map((deadline) => (
            <View key={deadline.assignmentId} style={styles.deadlineCard}>
              <Text style={styles.deadlineTitle}>{deadline.title}</Text>
              <Text style={styles.deadlineClass}>{deadline.className}</Text>
              <View style={styles.deadlineStats}>
                <Text style={styles.deadlineStat}>
                  📅 {new Date(deadline.dueDate).toLocaleDateString('tr-TR')}
                </Text>
                <Text style={styles.deadlineStat}>
                  📊 {deadline.submissionCount}/{deadline.totalStudents} teslim
                </Text>
                <Text style={styles.deadlineStat}>
                  {deadline.daysUntilDue} gün kaldı
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${deadline.submissionRate || 0}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                %{deadline.submissionRate?.toFixed(1) || 0} teslim oranı
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Son Teslimler */}
      {dashboardData.recentSubmissions && dashboardData.recentSubmissions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📤 Son Teslimler</Text>
          {dashboardData.recentSubmissions.map((submission) => (
            <View key={submission.submissionId} style={styles.submissionCard}>
              <View style={styles.submissionHeader}>
                <Text style={styles.submissionStudent}>{submission.studentName}</Text>
                <View style={[
                  styles.submissionBadge,
                  { backgroundColor: submission.isGraded ? (colors.success || colors.primary) : (colors.warning || colors.error) }
                ]}>
                  <Text style={styles.submissionBadgeText}>
                    {submission.isGraded ? '✅ Notlandı' : '⏳ Bekliyor'}
                  </Text>
                </View>
              </View>
              <Text style={styles.submissionAssignment}>{submission.assignmentTitle}</Text>
              <Text style={styles.submissionClass}>{submission.className}</Text>
              <Text style={styles.submissionTime}>{submission.timeAgo}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
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
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    fontSize: 16,
    color: colors.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIcon: {
    fontSize: 32,
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
  classStatCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  classStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  classStatHeaderLeft: {
    flex: 1,
  },
  classStatName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  classStatCode: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  classStatGrade: {
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  classStatGradeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  classStatGradeLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  classStatDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  classStatDetailItem: {
    alignItems: 'center',
  },
  classStatDetailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  classStatDetailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  deadlineCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deadlineTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  deadlineClass: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  deadlineStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  deadlineStat: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  submissionCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  submissionStudent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
  },
  submissionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  submissionBadgeText: {
    fontSize: 11,
    color: colors.white,
    fontWeight: '600',
  },
  submissionAssignment: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  submissionClass: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  submissionTime: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});

export default AnalyticsScreen;
