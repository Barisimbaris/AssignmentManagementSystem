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
import * as classAPI from '../../api/endpoints/classes';
import { getWeeklySchedule } from '../../api/endpoints/schedules';
import * as notificationAPI from '../../api/endpoints/notifications';

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
  const [weeklySchedule, setWeeklySchedule] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0); // ✅ YENİ: Okunmamış bildirim sayısı

  useEffect(() => {
    fetchDashboardData();
    fetchUnreadCount(); // ✅ YENİ: Okunmamış bildirim sayısını çek
  }, []);

  // Class seçildiğinde programı çek
  useEffect(() => {
    if (dashboardData.courses.length > 0 && !selectedClassId) {
      setSelectedClassId(dashboardData.courses[0].id);
    }
  }, [dashboardData.courses]);

  useEffect(() => {
    if (selectedClassId) {
      fetchWeeklySchedule(selectedClassId);
    }
  }, [selectedClassId]);

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

      // ✅ YENİ: 3. Kayıtlı olduğum class'ları çek
      let myClasses = [];
      try {
        const classesResponse = await classAPI.getMyClasses();
        if (classesResponse.isSuccess) {
          myClasses = classesResponse.data || [];
          console.log('📚 Kayıtlı class\'lar:', myClasses.length);
        }
      } catch (error) {
        console.warn('⚠️ Class\'lar alınamadı:', error.message);
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

        // ✅ YENİ: Dersler - Class'lardan al (ödev olmasa bile)
        const courses = myClasses.map((classItem, index) => {
          // Bu class'a ait ödev sayısını bul
          const classAssignments = allAssignments.filter(a => a.classId === classItem.id);
          return {
            id: classItem.id,
            name: classItem.className || classItem.courseName || 'Ders',
            icon: getRandomIcon(index),
            assignmentCount: classAssignments.length,
            color: getRandomColor(index),
            courseCode: classItem.courseCode,
            courseName: classItem.courseName,
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
    await fetchUnreadCount(); // ✅ YENİ: Refresh'te de notification sayısını güncelle
    setIsRefreshing(false);
  };

  // ✅ YENİ: Okunmamış bildirim sayısını çek
  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      if (response.isSuccess) {
        setUnreadCount(response.data || 0);
      }
    } catch (error) {
      console.warn('⚠️ Okunmamış bildirim sayısı alınamadı:', error.message);
      setUnreadCount(0);
    }
  };

  // ✅ YENİ: Haftalık programı çek
  const fetchWeeklySchedule = async (classId) => {
    try {
      const response = await getWeeklySchedule(classId);
      if (response.isSuccess) {
        setWeeklySchedule(response.data || []);
      }
    } catch (error) {
      console.error('❌ Program yüklenemedi:', error);
      setWeeklySchedule([]);
    }
  };

  // ✅ YENİ: Haftanın başlangıcını bul (Pazartesi)
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Pazartesi
    return new Date(d.setDate(diff));
  };

  // ✅ YENİ: TimeSpan formatını parse eden fonksiyon
  const parseTimeSpan = (timeSpan) => {
    if (!timeSpan) return null;
    const parts = timeSpan.split(':');
    return {
      hours: parseInt(parts[0]) || 0,
      minutes: parseInt(parts[1]) || 0,
      seconds: parseInt(parts[2]) || 0
    };
  };

  // ✅ YENİ: Program formatla
  const formatTime = (timeString) => {
    if (!timeString) return '';
    const time = timeString.split(':');
    return `${time[0]}:${time[1]}`;
  };

  const getDayName = (dayOfWeek) => {
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return days[dayOfWeek] || '';
  };

  // ✅ YENİ: Schedule'ın geçmiş olup olmadığını kontrol et
  const isSchedulePast = (schedule, referenceDate) => {
    if (!schedule || schedule.dayOfWeek === undefined) {
      return { isPast: false, shouldShow: true, isGray: false };
    }
    
    // Seçilen haftanın başlangıcını bul (Pazartesi)
    const weekStart = getWeekStart(referenceDate);
    
    // Schedule'ın gününü bul (0=Pazar, 1=Pazartesi, ..., 6=Cumartesi)
    const scheduleDay = schedule.dayOfWeek;
    
    // Haftanın o gününü hesapla
    const scheduleDate = new Date(weekStart);
    // Pazartesi = 1, Salı = 2, ..., Pazar = 0
    let dayOffset = scheduleDay - 1; // Pazartesi'den başlayarak offset
    if (scheduleDay === 0) dayOffset = 6; // Pazar için 6 gün sonra
    scheduleDate.setDate(weekStart.getDate() + dayOffset);
    
    // Schedule'ın bitiş saatini parse et ve o güne ekle
    const endTime = parseTimeSpan(schedule.endTime);
    if (!endTime) {
      return { isPast: false, shouldShow: true, isGray: false };
    }
    
    const scheduleEndDateTime = new Date(scheduleDate);
    scheduleEndDateTime.setHours(endTime.hours, endTime.minutes, 0, 0);
    
    // Şu anki zaman
    const now = new Date();
    
    // Bitiş saatinden geçmiş mi?
    const isPast = scheduleEndDateTime < now;
    
    if (!isPast) {
      return { isPast: false, shouldShow: true, isGray: false };
    }
    
    // Geçmişse, kaç saat geçti?
    const hoursPassed = (now - scheduleEndDateTime) / (1000 * 60 * 60);
    
    // 1 saatten az geçmişse: gri göster
    if (hoursPassed <= 1) {
      return { isPast: true, shouldShow: true, isGray: true };
    }
    
    // 1 saatten fazla geçmişse: gösterme
    return { isPast: true, shouldShow: false, isGray: false };
  };

  // ✅ YENİ: Haftalık programı günlere göre grupla ve filtrele
  const groupedSchedule = weeklySchedule
    .map(schedule => ({
      ...schedule,
      ...isSchedulePast(schedule, new Date())
    }))
    .filter(schedule => schedule.shouldShow)
    .reduce((acc, schedule) => {
      const day = schedule.dayOfWeek || 0;
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(schedule);
      return acc;
    }, {});

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
    <TouchableOpacity 
      style={[styles.courseCard, { backgroundColor: item.color }]}
      onPress={() => {
        // O class'ın ödevlerini gösteren ekrana git
        navigation.navigate('Assignments', {
          screen: 'AssignmentList',
          params: { classId: item.id }
        });
      }}
    >
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
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Notifications')} // ✅ YENİ: Notification ekranına git
          >
            <Text style={styles.notificationIcon}>🔔</Text>
            {unreadCount > 0 && ( // ✅ YENİ: Sadece okunmamış bildirim varsa badge göster
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
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

      {/* ✅ YENİ: Haftalık Program */}
      <View style={styles.section}>
        <View style={styles.scheduleHeader}>
          <Text style={styles.sectionTitle}>📅 Haftalık Program</Text>
          {dashboardData.courses.length > 0 && (
            <TouchableOpacity
              style={styles.viewFullScheduleButton}
              onPress={() => {
                // ClassScheduleScreen'e git (navigator'a eklenmeli)
                navigation.navigate('ClassSchedule');
              }}
            >
              <Text style={styles.viewFullScheduleText}>Tümünü Gör →</Text>
            </TouchableOpacity>
          )}
        </View>

        {dashboardData.courses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Henüz ders yok</Text>
          </View>
        ) : (
          <>
            {/* Class Selector */}
            {dashboardData.courses.length > 1 && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.classSelector}
                contentContainerStyle={styles.classSelectorContent}
              >
                {dashboardData.courses.map((course) => (
                  <TouchableOpacity
                    key={course.id}
                    style={[
                      styles.classChip,
                      selectedClassId === course.id && styles.classChipActive
                    ]}
                    onPress={() => setSelectedClassId(course.id)}
                  >
                    <Text style={[
                      styles.classChipText,
                      selectedClassId === course.id && styles.classChipTextActive
                    ]}>
                      {course.courseCode || course.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Schedule */}
            {weeklySchedule.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Bu ders için program yok</Text>
              </View>
            ) : (
              <View style={styles.scheduleContainer}>
                {(() => {
                  const daysWithSchedules = [1, 2, 3, 4, 5].filter(d => groupedSchedule[d]?.length > 0);
                  return daysWithSchedules.map((dayOfWeek, dayIndex) => {
                    const daySchedules = groupedSchedule[dayOfWeek] || [];
                    const isLastDay = dayIndex === daysWithSchedules.length - 1;

                    return (
                      <View key={dayOfWeek} style={[styles.scheduleDay, isLastDay && styles.scheduleDayLast]}>
                        <Text style={styles.scheduleDayName}>
                          {getDayName(dayOfWeek)}
                        </Text>
                        {daySchedules.map((schedule, index) => (
                          <View 
                            key={index} 
                            style={[
                              styles.scheduleItem,
                              schedule.isGray && styles.scheduleItemPast // ✅ YENİ: Gri stil
                            ]}
                          >
                            <Text style={styles.scheduleTime}>
                              {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                            </Text>
                            <Text style={styles.scheduleClassName}>
                              {schedule.className || schedule.courseName || 'Ders'}
                            </Text>
                            {schedule.roomNumber && (
                              <Text style={styles.scheduleLocation}>
                                📍 {schedule.roomNumber}
                              </Text>
                            )}
                          </View>
                        ))}
                      </View>
                    );
                  });
                })()}
              </View>
            )}
          </>
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
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewFullScheduleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewFullScheduleText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  classSelector: {
    marginBottom: 16,
  },
  classSelectorContent: {
    gap: 8,
    paddingRight: 20,
  },
  classChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  classChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  classChipText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  classChipTextActive: {
    color: colors.white,
  },
  scheduleContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scheduleDay: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scheduleDayLast: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  scheduleItem: {
    marginBottom: 12,
  },
  scheduleItemPast: {
    opacity: 0.5,
    backgroundColor: '#F5F5F5',
  },
  scheduleTime: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  scheduleClassName: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  scheduleLocation: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  scheduleDayName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
});

export default StudentDashboard;