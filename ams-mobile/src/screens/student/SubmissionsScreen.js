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

const SubmissionsScreen = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setIsLoading(true);
      console.log('📥 Teslimler getiriliyor...');
      
      const response = await apiClient.get('/Submission/my-submissions');
      
      console.log('✅ Teslimler geldi:', response.data);
      
      if (response.data.isSuccess && response.data.data) {
        setSubmissions(response.data.data);
      } else {
        setSubmissions([]);
      }
      
    } catch (error) {
      console.error('❌ Teslim listesi hatası:', error);
      setSubmissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchSubmissions();
    setIsRefreshing(false);
  };

  const getStatusColor = (submission) => {
    if (submission.grade !== null && submission.grade !== undefined) {
      return colors.success; // Notlandırıldı
    }
    return colors.info; // Beklemede
  };

  const getStatusText = (submission) => {
    if (submission.grade !== null && submission.grade !== undefined) {
      return `✅ ${submission.grade} / ${submission.maxScore || 100}`;
    }
    return '⏳ Değerlendiriliyor';
  };

  const renderSubmissionCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => console.log('Teslim detayı:', item.id)}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.assignmentTitle}>{item.assignmentTitle || 'Ödev'}</Text>
          <Text style={styles.submittedDate}>
            📅 Teslim: {new Date(item.submittedAt).toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>

      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item) }]}>
        <Text style={styles.statusText}>{getStatusText(item)}</Text>
      </View>

      {/* File Info */}
      {item.filePath && (
        <View style={styles.fileInfo}>
          <Text style={styles.fileIcon}>📎</Text>
          <Text style={styles.fileName} numberOfLines={1}>
            {item.filePath.split('/').pop() || 'Dosya'}
          </Text>
        </View>
      )}

      {/* Comments */}
      {item.comments && (
        <View style={styles.commentsBox}>
          <Text style={styles.commentsLabel}>💬 Öğretmen Yorumu:</Text>
          <Text style={styles.commentsText}>{item.comments}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Teslimler yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📤 Teslimlerim</Text>
        <Text style={styles.headerSubtitle}>
          {submissions.length} teslim bulundu
        </Text>
      </View>

      {/* Submission List */}
      {submissions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>Henüz teslim yok</Text>
          <Text style={styles.emptySubtext}>
            Teslim ettiğiniz ödevler burada görünecek
          </Text>
        </View>
      ) : (
        <FlatList
          data={submissions}
          renderItem={renderSubmissionCard}
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
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  assignmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  submittedDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  statusText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  fileIcon: {
    fontSize: 20,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  commentsBox: {
    backgroundColor: '#FFF9C4',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFF176',
  },
  commentsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  commentsText: {
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

export default SubmissionsScreen;