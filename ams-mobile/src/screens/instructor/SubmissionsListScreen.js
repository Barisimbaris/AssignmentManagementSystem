import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import apiClient from '../../api/client';
import { colors } from '../../theme/colors';

const SubmissionsListScreen = ({ route, navigation }) => {
  const { assignmentId, assignmentTitle } = route.params;
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setIsLoading(true);
      console.log('📥 Teslimler getiriliyor:', assignmentId);
      
      // Backend'den bu ödeve ait tüm teslimleri çek
      const response = await apiClient.get(`/Submission/assignment/${assignmentId}`);
      
      if (response.data.isSuccess) {
        setSubmissions(response.data.data || []);
      }
    } catch (error) {
      console.error('❌ Teslimler yüklenemedi:', error);
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
    if (submission.score !== null && submission.score !== undefined) {
      return colors.success;
    }
    return colors.warning;
  };

  const renderSubmissionCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('GradeSubmission', { 
        submissionId: item.id,
        studentName: item.studentName,
        assignmentTitle: assignmentTitle,
      })}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.studentName}>{item.studentName}</Text>
          <Text style={styles.submittedDate}>
            {new Date(item.submittedAt).toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item) }]}>
          <Text style={styles.statusText}>
            {item.score !== null && item.score !== undefined
              ? `${item.score} puan`
              : 'Bekliyor'}
          </Text>
        </View>
      </View>

      {item.isLate && (
        <View style={styles.lateTag}>
          <Text style={styles.lateText}>⚠️ Geç Teslim</Text>
        </View>
      )}
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle} numberOfLines={1}>
          {assignmentTitle}
        </Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          📊 {submissions.length} teslim
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={submissions}
        renderItem={renderSubmissionCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>Henüz teslim yok</Text>
          </View>
        }
      />
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
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  statsBar: {
    backgroundColor: colors.backgroundSecondary,
    padding: 12,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  submittedDate: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  lateTag: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  lateText: {
    fontSize: 12,
    color: colors.error,
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
  },
});

export default SubmissionsListScreen;