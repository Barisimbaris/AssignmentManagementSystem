import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { colors } from '../../theme/colors';

const GradesScreen = () => {
  const { user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalGraded: 0,
    averageGrade: 0,
    highestGrade: 0,
    lowestGrade: 0,
  });

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      setIsLoading(true);
      console.log('📥 Notlar getiriliyor...');
      
      // Teslimlerimi çek
      const response = await apiClient.get('/Submission/my-submissions');
      
      console.log('✅ Notlar geldi:', response.data);
      
      if (response.data.isSuccess && response.data.data) {
        const allSubmissions = response.data.data;
        
        // Sadece notlandırılmış olanları al
        const gradedSubmissions = allSubmissions.filter(
          sub => sub.score !== null && sub.score !== undefined
        );
        
        // İstatistikleri hesapla
        if (gradedSubmissions.length > 0) {
          const scores = gradedSubmissions.map(g => g.score);
          const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
          
          setStats({
            totalGraded: gradedSubmissions.length,
            averageGrade: Math.round(average),
            highestGrade: Math.max(...scores),
            lowestGrade: Math.min(...scores),
          });
        }
        
        // Tarihe göre sırala (en yeni önce)
        const sortedGrades = gradedSubmissions.sort(
          (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
        );
        
        setGrades(sortedGrades);
      } else {
        setGrades([]);
      }
      
    } catch (error) {
      console.error('❌ Notlar getirme hatası:', error);
      setGrades([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchGrades();
    setIsRefreshing(false);
  };

  const getGradeColor = (score, maxScore = 100) => {
    const percentage = (score / maxScore) * 100;
    
    if (percentage >= 90) return colors.success;
    if (percentage >= 75) return colors.info;
    if (percentage >= 60) return colors.warning;
    return colors.error;
  };

  const getGradeEmoji = (score, maxScore = 100) => {
    const percentage = (score / maxScore) * 100;
    
    if (percentage >= 90) return '🌟';
    if (percentage >= 75) return '👍';
    if (percentage >= 60) return '👌';
    return '📚';
  };

  const renderGradeCard = ({ item }) => {
    const percentage = Math.round((item.score / 100) * 100);
    
    return (
      <View style={styles.gradeCard}>
        {/* Header */}
        <View style={styles.gradeHeader}>
          <View style={styles.gradeHeaderLeft}>
            <Text style={styles.assignmentTitle}>{item.assignmentTitle}</Text>
            <Text style={styles.submittedDate}>
              Teslim: {new Date(item.submittedAt).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
              })}
            </Text>
          </View>
          <View style={styles.emojiContainer}>
            <Text style={styles.gradeEmoji}>{getGradeEmoji(item.score)}</Text>
          </View>
        </View>

        {/* Score */}
        <View style={[styles.scoreBox, { backgroundColor: getGradeColor(item.score) }]}>
          <Text style={styles.scoreText}>{item.score}</Text>
          <Text style={styles.scoreMaxText}>/ 100</Text>
        </View>

        {/* Percentage Bar */}
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              { 
                width: `${percentage}%`,
                backgroundColor: getGradeColor(item.score)
              }
            ]} 
          />
        </View>
        <Text style={styles.percentageText}>{percentage}%</Text>

        {/* Feedback */}
        {item.feedback && (
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackLabel}>💬 Geri Bildirim:</Text>
            <Text style={styles.feedbackText}>{item.feedback}</Text>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Notlar yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Notlarım</Text>
        <Text style={styles.headerSubtitle}>
          {grades.length} notlandırılmış ödev
        </Text>
      </View>

      {/* Stats Cards */}
      {grades.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📈</Text>
            <Text style={styles.statValue}>{stats.averageGrade}</Text>
            <Text style={styles.statLabel}>Ortalama</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🌟</Text>
            <Text style={styles.statValue}>{stats.highestGrade}</Text>
            <Text style={styles.statLabel}>En Yüksek</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📚</Text>
            <Text style={styles.statValue}>{stats.lowestGrade}</Text>
            <Text style={styles.statLabel}>En Düşük</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>✅</Text>
            <Text style={styles.statValue}>{stats.totalGraded}</Text>
            <Text style={styles.statLabel}>Toplam</Text>
          </View>
        </View>
      )}

      {/* Grades List */}
      {grades.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>Henüz notlandırılmış ödev yok</Text>
          <Text style={styles.emptySubtext}>
            Öğretmeniniz ödevlerinizi değerlendirdiğinde burada görünecek
          </Text>
        </View>
      ) : (
        <FlatList
          data={grades}
          renderItem={renderGradeCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}
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
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
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
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  listContent: {
    padding: 16,
  },
  gradeCard: {
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
  gradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gradeHeaderLeft: {
    flex: 1,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  submittedDate: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  emojiContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradeEmoji: {
    fontSize: 28,
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  scoreText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.white,
  },
  scoreMaxText: {
    fontSize: 20,
    color: colors.white,
    marginLeft: 4,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  feedbackBox: {
    backgroundColor: '#FFF9C4',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFF176',
  },
  feedbackLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  feedbackText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default GradesScreen;