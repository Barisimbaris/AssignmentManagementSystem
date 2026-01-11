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

const ClassAssignmentsScreen = ({ route, navigation }) => {
  const { classId, className } = route.params;
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/Assignment/class/${classId}`);
      
      if (response.data.isSuccess) {
        setAssignments(response.data.data || []);
      }
    } catch (error) {
      console.error('❌ Ödevler yüklenemedi:', error);
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

  const renderAssignmentCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('AssignmentDetail', {
        assignmentId: item.id,
        assignment: item,
      })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.submissionCount}>{item.totalSubmissions || 0}</Text>
      </View>
      
      <Text style={styles.dueDate}>
        Son Tarih: {new Date(item.dueDate).toLocaleDateString('tr-TR')}
      </Text>
      
      <View style={styles.footer}>
        <Text style={styles.type}>
          {item.assignmentType === 'Individual' ? '👤 Bireysel' : '👥 Grup'}
        </Text>
        <Text style={styles.score}>🏆 {item.maxScore} puan</Text>
      </View>
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
          {className}
        </Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          📚 {assignments.length} ödev
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={assignments}
        renderItem={renderAssignmentCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyText}>Henüz ödev yok</Text>
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
    fontSize: 18,
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
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
  },
  submissionCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  dueDate: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  type: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  score: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
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

export default ClassAssignmentsScreen;
