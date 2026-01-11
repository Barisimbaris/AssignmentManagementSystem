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

const StudentsScreen = ({ navigation }) => {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      console.log('📥 Öğrenciler getiriliyor...');
      
      // Backend'den instructor'ın class'larındaki öğrencileri çek
      const response = await apiClient.get('/User/my-students');
      
      if (response.data.isSuccess) {
        // Response: [{ classId, className, students: [...] }, ...]
        const classStudents = response.data.data || [];
        
        // Tüm class'lardaki öğrencileri birleştir
        const allStudents = [];
        classStudents.forEach(classData => {
          classData.students.forEach(student => {
            allStudents.push({
              ...student,
              className: classData.className,
              classId: classData.classId
            });
          });
        });
        
        setStudents(allStudents);
      }
    } catch (error) {
      console.error('❌ Öğrenciler yüklenemedi:', error);
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchStudents();
    setIsRefreshing(false);
  };

  const renderStudentCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => {
        // Student detail sayfası (opsiyonel)
        console.log('Öğrenci detayı:', item.id);
      }}
    >
      <View style={styles.avatarContainer}>
        <Text style={styles.avatar}>👤</Text>
      </View>
      
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>
          {item.firstName} {item.lastName}
        </Text>
        <Text style={styles.studentEmail}>{item.email}</Text>
        {item.studentNumber && (
          <Text style={styles.studentNumber}>No: {item.studentNumber}</Text>
        )}
        {item.department && (
          <Text style={styles.department}>{item.department}</Text>
        )}
      </View>

      <Text style={styles.chevron}>›</Text>
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
        <Text style={styles.headerTitle}>👥 Öğrenciler</Text>
        <Text style={styles.headerSubtitle}>
          {students.length} öğrenci
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={students}
        renderItem={renderStudentCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>Henüz öğrenci yok</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    fontSize: 24,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  studentEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  studentNumber: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  department: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  chevron: {
    fontSize: 24,
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
  },
});

export default StudentsScreen;