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

const AssignmentListScreen = ({ navigation }) => {
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/Assignment');
      
      if (response.data.isSuccess) {
        setAssignments(response.data.data || []);
      }
    } catch (error) {
      console.error('❌ Ödevler yüklenemedi:', error);
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
      onPress={() => navigation.navigate('SubmissionsList', { 
        assignmentId: item.id,
        assignmentTitle: item.title 
      })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.submissionCount}>{item.totalSubmissions || 0}</Text>
      </View>
      
      <Text style={styles.className}>{item.className}</Text>
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
        <Text style={styles.headerTitle}>📚 Ödevlerim</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateAssignment')}
        >
          <Text style={styles.addButtonText}>+ Yeni</Text>
        </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
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
  className: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
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
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});

export default AssignmentListScreen;