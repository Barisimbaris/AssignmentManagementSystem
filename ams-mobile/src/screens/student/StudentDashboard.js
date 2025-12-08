import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { colors } from '../../theme/colors';

const StudentDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    activeAssignments: 0,
    completedAssignments: 0,
    totalAssignments: 0,
    averageGrade: 0,
    streak: 0,
    upcomingAssignments: [],
    courses: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      console.log('📥 Dashboard verileri getiriliyor...');

      // 1. Tüm ödevleri çek
      const assignmentsResponse = await apiClient.get('/Assignment');
      
      // 2. Teslimlerimi çek
      let mySubmissions = [];
      try {
        const submissionsResponse = await apiClient.get('/Submission/my-submissions');
        if (submissionsResponse.data.isSuccess) {
          mySubmissions = submissionsResponse.data.data || [];
        }
      } catch (error) {
        console.warn('⚠️ Teslimler alınamadı:', error.message);
      }

      if (assignmentsResponse.data.isSuccess) {
        const allAssignments = assignmentsResponse.data.data || [];

        // Her ödeve teslim durumunu ekle
        const assignmentsWithStatus = allAssignments.map(assignment => {
          const submission = mySubmissions.find(sub => sub.assignmentId === assignment.id);
          return {
            ...assignment,
            hasSubmission: !!submission,
            submission: submission || null,
          };
        });

        // Aktif ödevler (teslim edilmemiş ve süresi geçmemiş)
        const now = new Date();
        const activeAssignments = assignmentsWithStatus.filter(a => {
          const dueDate = new Date(a.dueDate);
          return !a.hasSubmission && dueDate > now;
        });

        // Tamamlanan ödevler
        const completedAssignments = assignmentsWithStatus.filter(a => a.hasSubmission);

        // Yaklaşan ödevler (en yakın 3 tane)
        const upcomingAssignments = activeAssignments
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
          .slice(0, 3)
          .map(assignment => ({
            id: assignment.id,
            title: assignment.title,
            courseName: assignment.className || 'Ders',
            dueDate: getDaysLeft(assignment.dueDate),
            progress: 0,
            status: 'pending',
          }));

        // Notlandırılmış ödevler
        const gradedSubmissions = mySubmissions.filter(s => s.score !== null && s.score !== undefined);
        const averageGrade = gradedSubmissions.length > 0
          ? Math.round(gradedSubmissions.reduce((sum, s) => sum + s.score, 0) / gradedSubmissions.length)
          : 0;

        // Seri hesaplama (son 7 gün içinde her gün teslim yapılmış mı?)
        const streak = calculateStreak(mySubmissions);

        // Dersler (unique className'ler)
        const uniqueClasses = [...new Set(allAssignments.map(a => a.className))];
        const courses = uniqueClasses.map((className, index) => {
          const classAssignments = allAssignments.filter(a => a.className === className);
          return {
            id: index + 1,
            name: className || 'Ders',
            icon: getRandomIcon(index),
            assignmentCount: classAssignments.length,
            color: getRandomColor(index),
          };
        });

        setDashboardData({
          activeAssignments: activeAssignments.length,
          completedAssignments: completedAssignments.length,
          totalAssignments: allAssignments.length,
          averageGrade,
          streak,
          upcomingAssignments,
          courses,
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

  const getDaysLeft = (dueDate) => {
    const due = new Date(dueDate);
    const now = new Date();
    const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return 'Süre doldu';
    if (daysLeft === 0) return 'Bugün';
    if (daysLeft === 1) return 'Yarın';
    return `${daysLeft} gün sonra`;
  };

  const calculateStreak = (submissions) => {
    if (submissions.length === 0) return 0;

    const sortedSubmissions = submissions
      .map(s => new Date(s.submittedAt).toDateString())
      .sort((a, b) => new Date(b) - new Date(a));

    let streak = 0;
    const today = new Date().toDateString();
    
    if (sortedSubmissions[0] === today) {
      streak = 1;
      for (let i = 1; i < Math.min(sortedSubmissions.length, 7); i++) {
        const prevDate = new Date(sortedSubmissions[i - 1]);
        const currDate = new Date(sortedSubmissions[i]);
        const diffDays = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          streak++;
        } else {
          break;
        }
      }
    }
    
    return streak;
  };

  const getRandomIcon = (index) => {
    const icons = ['🎨', '📱', '💻', '🗄️', '🧮', '🔬', '📊', '🎯'];
    return icons[index % icons.length];
  };

  const getRandomColor = (index) => {
    const colorsList = [
      colors.cardOrange,
      colors.cardBlue,
      colors.cardPurple,
      colors.cardGreen,
      colors.cardPink,
    ];
    return colorsList[index % colorsList.length];
  };

  const renderAssignmentCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.assignmentCard}
      onPress={() => navigation.navigate('Assignments', {
        screen: 'AssignmentDetail',
        params: { assignmentId: item.id }
      })}
    >
      <View style={styles.assignmentHeader}>
        <Text style={styles.assignmentTitle}>{item.title}</Text>
        <Text style={styles.assignmentChevron}>›</Text>
      </View>
      <Text style={styles.assignmentCourse}>{item.courseName}</Text>
      <View style={styles.assignmentFooter}>
        <Text style={styles.assignmentDueDate}>⏰ {item.dueDate}</Text>
        <TouchableOpacity style={styles.uploadButton}>
          <Text style={styles.uploadButtonText}>📎 Yükle</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.detailButton}>
          <Text style={styles.detailButtonText}>Detay →</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderCourseCard = ({ item }) => (
    <TouchableOpacity style={[styles.courseCard, { backgroundColor: item.color }]}>
      <Text style={styles.courseIcon}>{item.icon}</Text>
      <Text style={styles.courseName}>{item.name}</Text>
      <Text style={styles.courseAssignments}>{item.assignmentCount} ödev</Text>
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
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationButton}>
            <Text style={styles.notificationIcon}>🔔</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
        <TouchableOpacity 
  style={styles.profileButton}
  onPress={() => navigation.navigate('Profile')}
>
  <Text style={styles.profileIcon}>👤</Text>
</TouchableOpacity>
        </View>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          📊 {dashboardData.activeAssignments} aktif ödevin var
        </Text>
      </View>

      {/* Yaklaşan Ödevler */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📚 Yaklaşan Ödevler</Text>
        {dashboardData.upcomingAssignments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>🎉 Tüm ödevlerini tamamladın!</Text>
          </View>
        ) : (
          <FlatList
            data={dashboardData.upcomingAssignments}
            renderItem={renderAssignmentCard}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />
        )}
      </View>

      {/* Derslerim */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📖 Derslerim</Text>
        {dashboardData.courses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Henüz ders yok</Text>
          </View>
        ) : (
          <FlatList
            data={dashboardData.courses}
            renderItem={renderCourseCard}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.coursesList}
          />
        )}
      </View>

      {/* Bu Hafta İstatistikleri */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📈 Bu Hafta</Text>
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>✅ Tamamlanan:</Text>
            <Text style={styles.statValue}>
              {dashboardData.completedAssignments}/{dashboardData.totalAssignments}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>⭐ Ortalama Not:</Text>
            <Text style={styles.statValue}>{dashboardData.averageGrade || '-'}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>🔥 Seri:</Text>
            <Text style={styles.statValue}>{dashboardData.streak} gün</Text>
          </View>
        </View>
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
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  notificationButton: {
    position: 'relative',
  },
  notificationIcon: {
    fontSize: 24,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
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
  statsBar: {
    backgroundColor: colors.backgroundSecondary,
    padding: 16,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 16,
    fontWeight: '600',
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
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  assignmentCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  assignmentChevron: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  assignmentCourse: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  assignmentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  assignmentDueDate: {
    fontSize: 14,
    color: colors.warning,
    fontWeight: '600',
    flex: 1,
  },
  uploadButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  uploadButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  detailButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  detailButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  coursesList: {
    gap: 12,
  },
  courseCard: {
    width: 120,
    height: 140,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-between',
  },
  courseIcon: {
    fontSize: 40,
  },
  courseName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  courseAssignments: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statsCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statLabel: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
});

export default StudentDashboard;