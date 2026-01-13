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

const AssignmentListScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, completed

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setIsLoading(true);
      console.log('📥 Ödevler getiriliyor...');
      
      // 1. Tüm ödevleri çek
      const assignmentsResponse = await apiClient.get('/Assignment');
      
      if (!assignmentsResponse.data.isSuccess || !assignmentsResponse.data.data) {
        setAssignments([]);
        return;
      }
      
      const allAssignments = assignmentsResponse.data.data;
      
      // 2. Öğrencinin teslimlerini çek (hata olursa devam et)
      let mySubmissions = [];
      
      try {
        const submissionsResponse = await apiClient.get('/Submission/my-submissions');
        
        if (submissionsResponse.data.isSuccess && submissionsResponse.data.data) {
          mySubmissions = submissionsResponse.data.data;
        }
      } catch (submissionError) {
        console.warn('⚠️ Teslimler alınamadı, devam ediliyor:', submissionError.message);
        // Hata olsa da devam et, sadece teslim durumu olmadan göster
      }
      
      console.log('📋 Teslimler:', mySubmissions.length);
      
      // 3. Her ödeve teslim durumunu ekle
      const assignmentsWithStatus = allAssignments.map(assignment => {
        const submission = mySubmissions.find(sub => sub.assignmentId === assignment.id);
        return {
          ...assignment,
          hasSubmission: !!submission,
          submission: submission || null,
        };
      });
      
      console.log('✅ Toplam ödev sayısı:', assignmentsWithStatus.length);
      setAssignments(assignmentsWithStatus);
      
    } catch (error) {
      console.error('❌ Ödev listesi hatası:', error);
      setAssignments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchAssignments();
    setIsRefreshing(false);
  };

  const getStatusColor = (dueDate) => {
    const due = new Date(dueDate);
    const now = new Date();
    const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return colors.error;
    if (daysLeft <= 2) return colors.warning;
    return colors.success;
  };

  const getStatusText = (dueDate) => {
    const due = new Date(dueDate);
    const now = new Date();
    const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return 'Süre Doldu';
    if (daysLeft === 0) return 'Bugün';
    if (daysLeft === 1) return 'Yarın';
    return `${daysLeft} gün kaldı`;
  };

  const renderAssignmentCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('AssignmentDetail', { assignmentId: item.id })}
    >
      {/* Status Badge - SAĞ ÜSTTE (Absolute) */}
      <View style={[styles.statusBadgeAbsolute, { backgroundColor: getStatusColor(item.dueDate) }]}>
        <Text style={styles.statusText}>{getStatusText(item.dueDate)}</Text>
      </View>

      {/* Type Badge - SOL ÜSTTE (Absolute) */}
      <View style={styles.typeBadgeAbsolute}>
        <Text style={styles.typeText}>
          {item.assignmentType === 'Individual' ? '👤 Bireysel' : '👥 Grup'}
        </Text>
      </View>

      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.courseName}>{item.className || 'Ders Adı'}</Text>
          <Text style={styles.assignmentTitle}>{item.title}</Text>
        </View>
      </View>

      {/* Description */}
      {item.description && (
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.dueDateContainer}>
          <Text style={styles.dueDateIcon}>📅</Text>
          <Text style={styles.dueDateText}>
            Son Tarih: {new Date(item.dueDate).toLocaleDateString('tr-TR')}
          </Text>
        </View>
        
        {item.maxScore && (
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsText}>🏆 {item.maxScore} puan</Text>
          </View>
        )}
      </View>

      {/* Submission Badge */}
      {item.hasSubmission && (
        <View style={styles.submittedBadge}>
          <Text style={styles.submittedBadgeText}>✅ Teslim Edildi</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const filteredAssignments = assignments.filter(assignment => {
    if (filter === 'all') return true;
    
    if (filter === 'pending') {
      return !assignment.hasSubmission;
    }
    
    if (filter === 'completed') {
      return assignment.hasSubmission;
    }
    
    return true;
  });

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Ödevler yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📚 Ödevlerim</Text>
        <Text style={styles.headerSubtitle}>
          {assignments.length} ödev bulundu
        </Text>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            Tümü
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'pending' && styles.filterButtonActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
            Bekleyen
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'completed' && styles.filterButtonActive]}
          onPress={() => setFilter('completed')}
        >
          <Text style={[styles.filterText, filter === 'completed' && styles.filterTextActive]}>
            Tamamlanan
          </Text>
        </TouchableOpacity>
      </View>

      {/* Assignment List */}
      {filteredAssignments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>Henüz ödev yok</Text>
          <Text style={styles.emptySubtext}>
            {filter === 'all' 
              ? 'Öğretmeniniz size ödev atadığında burada görünecek' 
              : filter === 'pending'
              ? 'Teslim edilmemiş ödev bulunmuyor'
              : 'Teslim edilmiş ödev bulunmuyor'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredAssignments}
          renderItem={renderAssignmentCard}
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: colors.white,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
  },
  listContent: {
    padding: 16,
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 32,
  },
  cardHeaderLeft: {
    flex: 1,
    paddingRight: 80,
  },
  courseName: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  assignmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  statusBadgeAbsolute: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 10,
  },
  statusText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  typeBadgeAbsolute: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 10,
  },
  typeText: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dueDateIcon: {
    fontSize: 16,
  },
  dueDateText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  pointsContainer: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  submittedBadge: {
    marginTop: 12,
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  submittedBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
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

export default AssignmentListScreen;