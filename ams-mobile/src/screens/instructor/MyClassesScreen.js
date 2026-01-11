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
import { useAuth } from '../../context/AuthContext';
import * as classAPI from '../../api/endpoints/classes';
import { colors } from '../../theme/colors';

const MyClassesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user && user.id) {
      fetchClasses();
    }
  }, [user]);

  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      const response = await classAPI.getMyClasses();
      
      if (response.isSuccess) {
        setClasses(response.data || []);
      }
    } catch (error) {
      console.error('❌ Classlar yüklenemedi:', error);
      setClasses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchClasses();
    setIsRefreshing(false);
  };

  const renderClassCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.className}>{item.className}</Text>
          <Text style={styles.courseName}>{item.courseName} ({item.courseCode})</Text>
          <Text style={styles.studentCount}>
            👥 {item.currentEnrollment || 0} öğrenci
          </Text>
        </View>
      </View>

      {/* Küçük linkler */}
      <View style={styles.linksContainer}>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('ClassStudents', { 
            classId: item.id, 
            className: item.className 
          })}
        >
          <Text style={styles.linkText}>👥 Öğrenciler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('ClassSchedules', { 
            classId: item.id, 
            className: item.className 
          })}
        >
          <Text style={styles.linkText}>📅 Schedule</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('ClassAssignments', { 
            classId: item.id, 
            className: item.className 
          })}
        >
          <Text style={styles.linkText}>📚 Ödevler</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Classlar yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📚 Derslerim</Text>
        <Text style={styles.headerSubtitle}>
          {classes.length} ders
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={classes}
        renderItem={renderClassCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyText}>Henüz ders yok</Text>
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
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  className: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  courseName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  studentCount: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  linksContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  linkButton: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 12,
    color: colors.primary,
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

export default MyClassesScreen;
