import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { colors } from '../../theme/colors';
import { getWeeklySchedule } from '../../api/endpoints/schedules';
import { enrollInClass, unenrollFromClass } from '../../api/endpoints/classes';

const ClassScheduleScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [weeklySchedule, setWeeklySchedule] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState(null);

  useEffect(() => {
    fetchEnrolledClasses();
  }, []);

  useEffect(() => {
    if (enrolledClasses.length > 0 && !selectedClassId) {
      // İlk sınıfı seç
      setSelectedClassId(enrolledClasses[0].id);
    }
  }, [enrolledClasses]);

  useEffect(() => {
    if (selectedClassId) {
      fetchWeeklySchedule(selectedClassId);
    }
  }, [selectedClassId, currentWeek]);

  const fetchEnrolledClasses = async () => {
    try {
      setIsLoading(true);
      // Öğrencinin kayıtlı olduğu sınıfları çek
      const response = await apiClient.get('/Class/my-classes');
      if (response.data.isSuccess) {
        const enrolledClasses = response.data.data || [];
        setEnrolledClasses(enrolledClasses);
      }
    } catch (error) {
      console.error('❌ Sınıflar yüklenemedi:', error);
      setEnrolledClasses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWeeklySchedule = async (classId) => {
    try {
      const response = await getWeeklySchedule(classId);
      if (response.isSuccess) {
        setWeeklySchedule(response.data || []);
      }
    } catch (error) {
      console.error('❌ Haftalık program yüklenemedi:', error);
      setWeeklySchedule([]);
    }
  };

  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Pazartesi
    return new Date(d.setDate(diff));
  };

  const getWeekEnd = (date) => {
    const start = getWeekStart(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 6); // Pazar
    return end;
  };

  const formatWeekRange = (date) => {
    const start = getWeekStart(date);
    const end = getWeekEnd(date);
    return `${start.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newDate);
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  const getDayName = (dateString) => {
    const date = new Date(dateString);
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return days[date.getDay()];
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

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    // TimeSpan formatı (HH:mm:ss) veya Date string olabilir
    if (timeString.includes('T') || timeString.includes(' ')) {
      // Date string ise
      const date = new Date(timeString);
      return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } else {
      // TimeSpan formatı ise (HH:mm:ss)
      const time = parseTimeSpan(timeString);
      if (time) {
        return `${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}`;
      }
      return '-';
    }
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

  const groupScheduleByDay = (schedules) => {
    // ✅ YENİ: Önce schedule'ları filtrele ve işaretle
    const filteredSchedules = schedules
      .map(schedule => ({
        ...schedule,
        ...isSchedulePast(schedule, currentWeek)
      }))
      .filter(schedule => schedule.shouldShow);

    const grouped = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    };

    filteredSchedules.forEach(schedule => {
      // dayOfWeek: 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
      const dayKey = {
        1: 'Monday',
        2: 'Tuesday',
        3: 'Wednesday',
        4: 'Thursday',
        5: 'Friday',
        6: 'Saturday',
        0: 'Sunday',
      }[schedule.dayOfWeek];

      if (dayKey && grouped[dayKey]) {
        grouped[dayKey].push(schedule);
      }
    });

    // Her günü saatine göre sırala
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => {
        const timeA = parseTimeSpan(a.startTime);
        const timeB = parseTimeSpan(b.startTime);
        if (!timeA || !timeB) return 0;
        const totalA = timeA.hours * 60 + timeA.minutes;
        const totalB = timeB.hours * 60 + timeB.minutes;
        return totalA - totalB;
      });
    });

    return grouped;
  };

  const groupedSchedule = groupScheduleByDay(weeklySchedule);
  const days = [
    { key: 'Monday', label: 'Pazartesi', emoji: '📅' },
    { key: 'Tuesday', label: 'Salı', emoji: '📅' },
    { key: 'Wednesday', label: 'Çarşamba', emoji: '📅' },
    { key: 'Thursday', label: 'Perşembe', emoji: '📅' },
    { key: 'Friday', label: 'Cuma', emoji: '📅' },
  ];

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ders Programım</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Week Navigation */}
      <View style={styles.weekNavigation}>
        <TouchableOpacity
          style={styles.weekNavButton}
          onPress={() => navigateWeek('prev')}
        >
          <Text style={styles.weekNavText}>← Önceki</Text>
        </TouchableOpacity>
        
        <View style={styles.weekInfo}>
          <Text style={styles.weekText}>{formatWeekRange(currentWeek)}</Text>
          <TouchableOpacity onPress={goToCurrentWeek}>
            <Text style={styles.currentWeekButton}>Bu Hafta</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={styles.weekNavButton}
          onPress={() => navigateWeek('next')}
        >
          <Text style={styles.weekNavText}>Sonraki →</Text>
        </TouchableOpacity>
      </View>

      {/* Class Selector */}
      {enrolledClasses.length > 0 && (
        <View style={styles.classSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {enrolledClasses.map((cls) => (
              <TouchableOpacity
                key={cls.id}
                style={[
                  styles.classChip,
                  selectedClassId === cls.id && styles.classChipActive
                ]}
                onPress={() => setSelectedClassId(cls.id)}
              >
                <Text style={[
                  styles.classChipText,
                  selectedClassId === cls.id && styles.classChipTextActive
                ]}>
                  {cls.courseCode}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Schedule */}
      <ScrollView style={styles.content}>
        {weeklySchedule.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>
              Bu hafta için ders programı bulunmuyor
            </Text>
          </View>
        ) : (
          <View style={styles.scheduleContainer}>
            {days.map((day) => {
              const daySchedules = groupedSchedule[day.key] || [];
              if (daySchedules.length === 0) return null;

              return (
                <View key={day.key} style={styles.daySection}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayEmoji}>{day.emoji}</Text>
                    <Text style={styles.dayLabel}>{day.label}</Text>
                  </View>
                  
                  {daySchedules.map((schedule, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.scheduleItem,
                        schedule.isGray && styles.scheduleItemPast // ✅ YENİ: Gri stil
                      ]}
                    >
                      <View style={styles.scheduleTime}>
                        <Text style={styles.scheduleTimeText}>
                          {formatTime(schedule.startTime || schedule.startDate)}
                        </Text>
                        {schedule.endTime || schedule.endDate ? (
                          <Text style={styles.scheduleTimeText}>
                            - {formatTime(schedule.endTime || schedule.endDate)}
                          </Text>
                        ) : null}
                      </View>
                      <View style={styles.scheduleInfo}>
                        <Text style={styles.scheduleTitle}>
                          {schedule.className || schedule.courseCode || 'Ders'}
                        </Text>
                        {schedule.location && (
                          <Text style={styles.scheduleLocation}>📍 {schedule.location}</Text>
                        )}
                        {schedule.instructorName && (
                          <Text style={styles.scheduleInstructor}>
                            👤 {schedule.instructorName}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
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
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  weekNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  weekNavButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  weekNavText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  weekInfo: {
    alignItems: 'center',
  },
  weekText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  currentWeekButton: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  classSelector: {
    backgroundColor: colors.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  classChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    marginRight: 8,
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
    fontWeight: '500',
  },
  classChipTextActive: {
    color: colors.white,
  },
  content: {
    flex: 1,
  },
  scheduleContainer: {
    padding: 16,
  },
  daySection: {
    marginBottom: 24,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  dayLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  scheduleItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
  },
  scheduleItemPast: {
    opacity: 0.5,
    backgroundColor: '#F5F5F5',
  },
  scheduleTime: {
    width: 80,
    marginRight: 12,
  },
  scheduleTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  scheduleLocation: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  scheduleInstructor: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default ClassScheduleScreen;
