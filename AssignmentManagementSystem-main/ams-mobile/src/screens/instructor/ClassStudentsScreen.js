import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import apiClient from '../../api/client';
import { colors } from '../../theme/colors';
import { getClassStudents, enrollStudentToClass, unenrollStudentFromClass } from '../../api/endpoints/classes';
import { getAllStudents } from '../../api/endpoints/users';

const ClassStudentsScreen = ({ route, navigation }) => {
  const { classId, className } = route.params;
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const response = await getClassStudents(classId);
      
      if (response.isSuccess) {
        setStudents(response.data || []);
      }
    } catch (error) {
      console.error('❌ Öğrenciler yüklenemedi:', error);
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const response = await getAllStudents();
      if (response.isSuccess) {
        setAllStudents(response.data || []);
      }
    } catch (error) {
      console.error('❌ Tüm öğrenciler yüklenemedi:', error);
      setAllStudents([]);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchAllStudents();
  }, []);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchStudents(), fetchAllStudents()]);
    setIsRefreshing(false);
  };

  const handleSearch = (text) => {
    setSearchTerm(text);
    if (!text.trim()) {
      setSearchResults([]);
      setSelectedStudent(null);
      return;
    }

    const searchLower = text.toLowerCase();
    const filtered = allStudents.filter(student => {
      const fullName = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase();
      const email = (student.email || '').toLowerCase();
      const studentNumber = (student.studentNumber || '').toLowerCase();
      const id = String(student.id || '');

      return fullName.includes(searchLower) ||
             email.includes(searchLower) ||
             studentNumber.includes(searchLower) ||
             id.includes(searchLower);
    });

    setSearchResults(filtered.slice(0, 5)); // İlk 5 sonuç
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setSearchTerm(`${student.firstName} ${student.lastName}`);
    setSearchResults([]);
  };

  const handleEnrollStudent = async () => {
    if (!selectedStudent) {
      Alert.alert('Hata', 'Lütfen bir öğrenci seçin');
      return;
    }

    // Öğrenci zaten sınıfta mı kontrol et
    const isAlreadyEnrolled = students.some(s => s.id === selectedStudent.id);
    if (isAlreadyEnrolled) {
      Alert.alert('Bilgi', 'Bu öğrenci zaten sınıfta');
      return;
    }

    Alert.alert(
      'Öğrenci Ekle',
      `${selectedStudent.firstName} ${selectedStudent.lastName} sınıfa eklenecek. Devam etmek istiyor musunuz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Ekle',
          onPress: async () => {
            try {
              const response = await enrollStudentToClass(classId, selectedStudent.id);
              if (response.isSuccess) {
                Alert.alert('Başarılı! ✅', 'Öğrenci sınıfa eklendi');
                setShowAddModal(false);
                setSearchTerm('');
                setSelectedStudent(null);
                await fetchStudents();
              } else {
                Alert.alert('Hata', response.message || 'Öğrenci eklenemedi');
              }
            } catch (error) {
              console.error('❌ Öğrenci ekleme hatası:', error);
              Alert.alert('Hata', error.response?.data?.message || error.message || 'Öğrenci eklenemedi');
            }
          }
        }
      ]
    );
  };

  const handleUnenrollStudent = (student) => {
    Alert.alert(
      'Öğrenci Çıkar',
      `${student.firstName} ${student.lastName} sınıftan çıkarılacak. Devam etmek istiyor musunuz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await unenrollStudentFromClass(classId, student.id);
              if (response.isSuccess) {
                Alert.alert('Başarılı! ✅', 'Öğrenci sınıftan çıkarıldı');
                await fetchStudents();
              } else {
                Alert.alert('Hata', response.message || 'Öğrenci çıkarılamadı');
              }
            } catch (error) {
              console.error('❌ Öğrenci çıkarma hatası:', error);
              Alert.alert('Hata', error.response?.data?.message || error.message || 'Öğrenci çıkarılamadı');
            }
          }
        }
      ]
    );
  };

  const renderStudentCard = ({ item }) => (
    <View style={styles.card}>
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
      </View>
      
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleUnenrollStudent(item)}
      >
        <Text style={styles.removeButtonText}>Çıkar</Text>
      </TouchableOpacity>
    </View>
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
          👥 {students.length} öğrenci
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>➕ Öğrenci Ekle</Text>
        </TouchableOpacity>
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

      {/* Add Student Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Öğrenci Ekle</Text>
              <TouchableOpacity onPress={() => {
                setShowAddModal(false);
                setSearchTerm('');
                setSelectedStudent(null);
                setSearchResults([]);
              }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Text style={styles.searchLabel}>Öğrenci Ara (Ad, Soyad, Email, No)</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Öğrenci ara..."
                value={searchTerm}
                onChangeText={handleSearch}
                autoCapitalize="none"
              />
              
              {searchResults.length > 0 && (
                <View style={styles.searchResults}>
                  {searchResults.map((student) => (
                    <TouchableOpacity
                      key={student.id}
                      style={styles.searchResultItem}
                      onPress={() => handleSelectStudent(student)}
                    >
                      <Text style={styles.searchResultName}>
                        {student.firstName} {student.lastName}
                      </Text>
                      <Text style={styles.searchResultEmail}>{student.email}</Text>
                      {student.studentNumber && (
                        <Text style={styles.searchResultNumber}>No: {student.studentNumber}</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {selectedStudent && (
                <View style={styles.selectedStudentBox}>
                  <Text style={styles.selectedLabel}>Seçilen Öğrenci:</Text>
                  <Text style={styles.selectedName}>
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </Text>
                  <Text style={styles.selectedEmail}>{selectedStudent.email}</Text>
                </View>
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowAddModal(false);
                  setSearchTerm('');
                  setSelectedStudent(null);
                  setSearchResults([]);
                }}
              >
                <Text style={styles.modalButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonAdd]}
                onPress={handleEnrollStudent}
                disabled={!selectedStudent}
              >
                <Text style={[styles.modalButtonText, !selectedStudent && styles.modalButtonTextDisabled]}>
                  Ekle
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
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
    fontWeight: '600',
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
  removeButton: {
    backgroundColor: colors.error || '#F44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  removeButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  modalClose: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  searchResults: {
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 200,
    marginBottom: 12,
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchResultName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  searchResultEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  searchResultNumber: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  selectedStudentBox: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  selectedLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  selectedName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  selectedEmail: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtonAdd: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  modalButtonTextDisabled: {
    opacity: 0.5,
  },
});

export default ClassStudentsScreen;
