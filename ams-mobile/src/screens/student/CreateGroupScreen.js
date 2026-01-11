import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import * as groupAPI from '../../api/endpoints/groups';
import { colors } from '../../theme/colors';

const CreateGroupScreen = ({ route, navigation }) => {
  const { assignmentId, assignment } = route.params;
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchAvailableStudents();
  }, []);

  const fetchAvailableStudents = async () => {
    try {
      setIsLoading(true);
      const response = await groupAPI.getAvailableStudents(assignmentId);
      
      if (response.isSuccess) {
        setAvailableStudents(response.data || []);
      }
    } catch (error) {
      console.error('❌ Müsait öğrenciler yüklenemedi:', error);
      Alert.alert('Hata', 'Öğrenciler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const searchStudentByNumber = () => {
    if (!studentNumber.trim()) {
      Alert.alert('Uyarı', 'Lütfen öğrenci numarası girin');
      return;
    }

    setIsSearching(true);
    const student = availableStudents.find(
      s => s.studentNumber && s.studentNumber.toLowerCase().includes(studentNumber.toLowerCase())
    );

    if (!student) {
      Alert.alert('Bulunamadı', 'Bu öğrenci numarasına sahip öğrenci bulunamadı');
      setIsSearching(false);
      return;
    }

    if (student.isInGroup) {
      Alert.alert('Uyarı', 'Bu öğrenci zaten bir grupta');
      setIsSearching(false);
      return;
    }

    if (selectedStudents.find(s => s.studentId === student.studentId)) {
      Alert.alert('Uyarı', 'Bu öğrenci zaten seçilmiş');
      setIsSearching(false);
      return;
    }

    setSelectedStudents([...selectedStudents, student]);
    setStudentNumber('');
    setIsSearching(false);
  };

  const removeStudent = (studentId) => {
    setSelectedStudents(selectedStudents.filter(s => s.studentId !== studentId));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Hata', 'Lütfen grup adı girin');
      return;
    }

    if (selectedStudents.length === 0) {
      Alert.alert('Hata', 'En az bir öğrenci seçmelisiniz');
      return;
    }

    try {
      setIsLoading(true);
      const response = await groupAPI.createGroup({
        assignmentId,
        groupName: groupName.trim(),
        memberIds: selectedStudents.map(s => s.studentId),
      });

      if (response.isSuccess) {
        Alert.alert(
          'Başarılı! 🎉',
          'Grup başarıyla oluşturuldu. Siz grup liderisiniz.',
          [
            {
              text: 'Tamam',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Hata', response.message || 'Grup oluşturulamadı');
      }
    } catch (error) {
      console.error('❌ Grup oluşturma hatası:', error);
      Alert.alert('Hata', error.message || 'Grup oluşturulamadı');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Grup Oluştur</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Assignment Info */}
        <View style={styles.assignmentInfo}>
          <Text style={styles.assignmentTitle}>{assignment?.title || 'Ödev'}</Text>
          <Text style={styles.assignmentType}>👥 Grup Ödevi</Text>
        </View>

        {/* Group Name Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Grup Adı *</Text>
          <TextInput
            style={styles.input}
            placeholder="Grup adını girin"
            value={groupName}
            onChangeText={setGroupName}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Student Search */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Öğrenci Ekle</Text>
          <Text style={styles.sectionSubtitle}>
            Öğrenci numarasına göre arayın
          </Text>
          
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Öğrenci numarası"
              value={studentNumber}
              onChangeText={setStudentNumber}
              placeholderTextColor={colors.textSecondary}
              onSubmitEditing={searchStudentByNumber}
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={searchStudentByNumber}
              disabled={isSearching}
            >
              {isSearching ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.searchButtonText}>Ara</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Selected Students */}
        {selectedStudents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Seçilen Öğrenciler ({selectedStudents.length})
            </Text>
            {selectedStudents.map((student) => (
              <View key={student.studentId} style={styles.selectedStudentCard}>
                <View style={styles.selectedStudentInfo}>
                  <Text style={styles.selectedStudentName}>{student.studentName}</Text>
                  <Text style={styles.selectedStudentNumber}>
                    {student.studentNumber}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeStudent(student.studentId)}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Available Students List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Müsait Öğrenciler ({availableStudents.filter(s => !s.isInGroup).length})
          </Text>
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <FlatList
              data={availableStudents.filter(s => !s.isInGroup)}
              keyExtractor={(item) => item.studentId.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.studentCard,
                    selectedStudents.find(s => s.studentId === item.studentId) && styles.studentCardSelected
                  ]}
                  onPress={() => {
                    if (selectedStudents.find(s => s.studentId === item.studentId)) {
                      removeStudent(item.studentId);
                    } else {
                      setSelectedStudents([...selectedStudents, item]);
                    }
                  }}
                >
                  <View>
                    <Text style={styles.studentName}>{item.studentName}</Text>
                    <Text style={styles.studentNumber}>{item.studentNumber}</Text>
                  </View>
                  {selectedStudents.find(s => s.studentId === item.studentId) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
              scrollEnabled={false}
            />
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Create Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createButton, (!groupName.trim() || selectedStudents.length === 0) && styles.createButtonDisabled]}
          onPress={handleCreateGroup}
          disabled={isLoading || !groupName.trim() || selectedStudents.length === 0}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.createButtonText}>
              Grup Oluştur ({selectedStudents.length + 1} kişi)
            </Text>
          )}
        </TouchableOpacity>
        <Text style={styles.footerNote}>
          * Grup oluşturan kişi otomatik olarak grup lideri olur
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  content: {
    flex: 1,
  },
  assignmentInfo: {
    backgroundColor: colors.white,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  assignmentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  assignmentType: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  section: {
    padding: 20,
    backgroundColor: colors.white,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  selectedStudentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedStudentInfo: {
    flex: 1,
  },
  selectedStudentName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  selectedStudentNumber: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  studentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  studentCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#E3F2FD',
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  studentNumber: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  checkmark: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 20,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  createButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerNote: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default CreateGroupScreen;
