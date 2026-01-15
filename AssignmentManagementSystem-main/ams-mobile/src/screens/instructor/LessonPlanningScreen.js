import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import apiClient from '../../api/client';
import { colors } from '../../theme/colors';
import { getMyClasses } from '../../api/endpoints/classes';
import { getAllLessonPlans, getLessonPlansByClass, createLessonPlan, updateLessonPlan, deleteLessonPlan } from '../../api/endpoints/lessonPlans';

const LessonPlanningScreen = ({ navigation }) => {
  const [classes, setClasses] = useState([]);
  const [lessonPlans, setLessonPlans] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    classId: '',
    weekNumber: '',
    topic: '',
    description: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [classesResponse, plansResponse] = await Promise.all([
        getMyClasses(),
        getAllLessonPlans(),
      ]);

      if (classesResponse.isSuccess) {
        setClasses(classesResponse.data || []);
      }

      if (plansResponse.isSuccess) {
        setLessonPlans(plansResponse.data || []);
      }
    } catch (error) {
      console.error('❌ Veriler yüklenemedi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const handleClassSelect = async (classId) => {
    setSelectedClassId(classId);
    try {
      const response = await getLessonPlansByClass(classId);
      if (response.isSuccess) {
        setLessonPlans(response.data || []);
      }
    } catch (error) {
      console.error('❌ Ders planları yüklenemedi:', error);
    }
  };

  const handleCreatePlan = async () => {
    if (!formData.classId || !formData.weekNumber || !formData.topic || !formData.startDate || !formData.endDate) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const payload = {
        classId: parseInt(formData.classId),
        weekNumber: parseInt(formData.weekNumber),
        topic: formData.topic,
        description: formData.description,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      };

      const response = await createLessonPlan(payload);
      
      if (response.isSuccess) {
        Alert.alert('Başarılı! ✅', 'Ders planı oluşturuldu');
        setShowCreateModal(false);
        setFormData({
          classId: '',
          weekNumber: '',
          topic: '',
          description: '',
          startDate: '',
          endDate: '',
        });
        await fetchData();
      } else {
        Alert.alert('Hata', response.message || 'Ders planı oluşturulamadı');
      }
    } catch (error) {
      console.error('❌ Ders planı oluşturma hatası:', error);
      Alert.alert('Hata', error.response?.data?.message || error.message || 'Ders planı oluşturulamadı');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlan = (planId) => {
    Alert.alert(
      'Ders Planını Sil',
      'Bu ders planını silmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deleteLessonPlan(planId);
              if (response.isSuccess) {
                Alert.alert('Başarılı! ✅', 'Ders planı silindi');
                await fetchData();
              } else {
                Alert.alert('Hata', response.message || 'Ders planı silinemedi');
              }
            } catch (error) {
              console.error('❌ Ders planı silme hatası:', error);
              Alert.alert('Hata', error.message || 'Ders planı silinemedi');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderLessonPlanCard = ({ item }) => {
    const classInfo = classes.find(c => c.id === item.classId);
    
    return (
      <View style={styles.planCard}>
        <View style={styles.planHeader}>
          <View style={styles.planHeaderLeft}>
            <Text style={styles.planWeek}>Hafta {item.weekNumber}</Text>
            <Text style={styles.planTopic}>{item.topic}</Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeletePlan(item.id)}
          >
            <Text style={styles.deleteButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
        
        {classInfo && (
          <Text style={styles.planClass}>
            {classInfo.courseCode} - {classInfo.className}
          </Text>
        )}
        
        {item.description && (
          <Text style={styles.planDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        
        <View style={styles.planDates}>
          <Text style={styles.planDateLabel}>Başlangıç:</Text>
          <Text style={styles.planDateValue}>{formatDate(item.startDate)}</Text>
        </View>
        <View style={styles.planDates}>
          <Text style={styles.planDateLabel}>Bitiş:</Text>
          <Text style={styles.planDateValue}>{formatDate(item.endDate)}</Text>
        </View>
      </View>
    );
  };

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
        <Text style={styles.headerTitle}>Ders Planlama</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Class Filter */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classFilter}>
          <TouchableOpacity
            style={[styles.filterChip, !selectedClassId && styles.filterChipActive]}
            onPress={() => {
              setSelectedClassId(null);
              fetchData();
            }}
          >
            <Text style={[styles.filterChipText, !selectedClassId && styles.filterChipTextActive]}>
              Tümü
            </Text>
          </TouchableOpacity>
          {classes.map((cls) => (
            <TouchableOpacity
              key={cls.id}
              style={[styles.filterChip, selectedClassId === cls.id && styles.filterChipActive]}
              onPress={() => handleClassSelect(cls.id)}
            >
              <Text style={[styles.filterChipText, selectedClassId === cls.id && styles.filterChipTextActive]}>
                {cls.courseCode}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.addButtonText}>➕ Yeni Plan</Text>
        </TouchableOpacity>
      </View>

      {/* Lesson Plans List */}
      <FlatList
        data={lessonPlans}
        renderItem={renderLessonPlanCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyText}>
              {selectedClassId ? 'Bu sınıf için ders planı yok' : 'Henüz ders planı oluşturulmamış'}
            </Text>
          </View>
        }
      />

      {/* Create Plan Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Yeni Ders Planı</Text>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Sınıf *</Text>
                <View style={styles.classSelectContainer}>
                  {classes.map((cls) => (
                    <TouchableOpacity
                      key={cls.id}
                      style={[
                        styles.classOption,
                        formData.classId === String(cls.id) && styles.classOptionSelected
                      ]}
                      onPress={() => setFormData({ ...formData, classId: String(cls.id) })}
                    >
                      <Text style={[
                        styles.classOptionText,
                        formData.classId === String(cls.id) && styles.classOptionTextSelected
                      ]}>
                        {cls.courseCode} - {cls.className}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Hafta Numarası *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1-16"
                  value={formData.weekNumber}
                  onChangeText={(text) => setFormData({ ...formData, weekNumber: text })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Konu Başlığı *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Örn: Türev ve Uygulamaları"
                  value={formData.topic}
                  onChangeText={(text) => setFormData({ ...formData, topic: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Ders Açıklaması</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Bu hafta işlenecek konular ve detaylar..."
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Başlangıç Tarihi *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DDTHH:mm (örn: 2025-01-15T09:00)"
                  value={formData.startDate}
                  onChangeText={(text) => setFormData({ ...formData, startDate: text })}
                />
                <Text style={styles.hint}>Format: YYYY-MM-DDTHH:mm</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Bitiş Tarihi *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DDTHH:mm (örn: 2025-01-15T10:30)"
                  value={formData.endDate}
                  onChangeText={(text) => setFormData({ ...formData, endDate: text })}
                />
                <Text style={styles.hint}>Format: YYYY-MM-DDTHH:mm</Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => {
                    setShowCreateModal(false);
                    setFormData({
                      classId: '',
                      weekNumber: '',
                      topic: '',
                      description: '',
                      startDate: '',
                      endDate: '',
                    });
                  }}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonTextCancel]}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonAdd]}
                  onPress={handleCreatePlan}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.modalButtonText}>Oluştur</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
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
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  filterBar: {
    backgroundColor: colors.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  classFilter: {
    flex: 1,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: colors.white,
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
  planCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  planHeaderLeft: {
    flex: 1,
  },
  planWeek: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  planTopic: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  planClass: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  planDates: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  planDateLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    width: 80,
  },
  planDateValue: {
    fontSize: 13,
    color: colors.textPrimary,
    flex: 1,
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
    textAlign: 'center',
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
    maxHeight: '90%',
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
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  classSelectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  classOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  classOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  classOptionText: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  classOptionTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
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
  modalButtonTextCancel: {
    color: colors.textPrimary,
  },
});

export default LessonPlanningScreen;
