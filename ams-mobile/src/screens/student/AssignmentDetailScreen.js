import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { colors } from '../../theme/colors';
import * as DocumentPicker from 'expo-document-picker';

const AssignmentDetailScreen = ({ route, navigation }) => {
  const { assignmentId } = route.params;
  const { user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAssignmentDetail();
  }, []);

  const fetchAssignmentDetail = async () => {
    try {
      setIsLoading(true);
      console.log('📥 Ödev detayı getiriliyor...', assignmentId);
      
      const response = await apiClient.get(`/Assignment/${assignmentId}`);
      
      console.log('✅ Ödev detayı geldi:', response.data);
      
      if (response.data.isSuccess && response.data.data) {
        setAssignment(response.data.data);
        
        // Öğrencinin bu ödeve teslimi var mı kontrol et
        try {
          const submissionsResponse = await apiClient.get('/Submission/my-submissions');
          
          if (submissionsResponse.data.isSuccess && submissionsResponse.data.data) {
            const mySubmission = submissionsResponse.data.data.find(
              sub => sub.assignmentId === assignmentId
            );
            
            if (mySubmission) {
              console.log('📤 Bu ödev için teslim var:', mySubmission);
              setAssignment(prev => ({
                ...prev,
                mySubmission: mySubmission,
                hasSubmission: true,
              }));
            }
          }
        } catch (submissionError) {
          console.warn('⚠️ Teslim kontrolü başarısız:', submissionError.message);
        }
      }
    } catch (error) {
      console.error('❌ Ödev detayı hatası:', error);
      Alert.alert('Hata', 'Ödev detayı yüklenemedi');
    } finally {
      setIsLoading(false);
    }
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

  const handleFileUpload = async () => {
    try {
      console.log('📎 Dosya seçici açılıyor...');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
        copyToCacheDirectory: true,
      });

      console.log('📄 Seçilen dosya:', result);

      if (result.canceled) {
        console.log('❌ Kullanıcı iptal etti');
        return;
      }

      const file = result.assets[0];

      if (file.size > 10 * 1024 * 1024) {
        Alert.alert('Hata', 'Dosya boyutu 10MB\'dan küçük olmalıdır');
        return;
      }

      setIsSubmitting(true);

      const formData = new FormData();
      formData.append('assignmentId', assignmentId);
      
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/pdf',
      });

      console.log('📤 Dosya yükleniyor...', {
        assignmentId,
        fileName: file.name,
        fileSize: file.size,
      });

      const response = await apiClient.post('/Submission', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ Upload yanıtı:', response.data);

      if (response.data.isSuccess) {
        Alert.alert(
          'Başarılı! 🎉',
          assignment.hasSubmission 
            ? 'Ödeviniz başarıyla yeniden teslim edildi!' 
            : 'Ödeviniz başarıyla teslim edildi!',
          [
            {
              text: 'Tamam',
              onPress: () => {
                // Sayfayı yenile
                fetchAssignmentDetail();
              },
            },
          ]
        );
      } else {
        Alert.alert('Hata', response.data.message || 'Teslim başarısız oldu');
      }

    } catch (error) {
      console.error('❌ Dosya yükleme hatası:', error);
      Alert.alert(
        'Hata',
        'Dosya yüklenirken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  if (!assignment) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>❌</Text>
        <Text style={styles.errorText}>Ödev bulunamadı</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backIcon}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIconText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ödev Detayı</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Badge */}
        <View style={[styles.statusBanner, { backgroundColor: getStatusColor(assignment.dueDate) }]}>
          <Text style={styles.statusBannerText}>
            ⏰ {getStatusText(assignment.dueDate)}
          </Text>
        </View>

        {/* Title & Info */}
        <View style={styles.titleSection}>
          <Text style={styles.className}>{assignment.className || 'Ders Adı'}</Text>
          <Text style={styles.title}>{assignment.title}</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>📅</Text>
              <View>
                <Text style={styles.infoLabel}>Son Tarih</Text>
                <Text style={styles.infoValue}>
                  {new Date(assignment.dueDate).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>🏆</Text>
              <View>
                <Text style={styles.infoLabel}>Puan</Text>
                <Text style={styles.infoValue}>{assignment.maxScore}</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>
                {assignment.assignmentType === 'Individual' ? '👤' : '👥'}
              </Text>
              <View>
                <Text style={styles.infoLabel}>Tür</Text>
                <Text style={styles.infoValue}>
                  {assignment.assignmentType === 'Individual' ? 'Bireysel' : 'Grup'}
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>🔄</Text>
              <View>
                <Text style={styles.infoLabel}>Yeniden Teslim</Text>
                <Text style={styles.infoValue}>
                  {assignment.allowResubmission ? 'İzin var' : 'İzin yok'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Açıklama</Text>
          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionText}>
              {assignment.description || 'Açıklama bulunmuyor'}
            </Text>
          </View>
        </View>

        {/* Late Submission Info */}
        {assignment.allowLateSubmission && (
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxIcon}>ℹ️</Text>
            <Text style={styles.infoBoxText}>
              Geç teslim kabul edilir
            </Text>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Submit Button - Fixed at Bottom */}
      {/* Submit Button - Fixed at Bottom */}
      <View style={styles.footer}>
        {assignment.hasSubmission ? (
          <View style={styles.submittedContainer}>
            <View style={styles.submittedBadgeCompact}>
              <Text style={styles.submittedBadgeIcon}>✅</Text>
              <View style={styles.submittedTextContainer}>
                <Text style={styles.submittedBadgeText}>Teslim Edildi</Text>
                <Text style={styles.submittedDateSmall}>
                  {new Date(assignment.mySubmission.submittedAt).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>

            {assignment.mySubmission.score !== null && assignment.mySubmission.score !== undefined ? (
              <View style={styles.scoreCompact}>
                <Text style={styles.scoreCompactText}>
                  📊 {assignment.mySubmission.score}/{assignment.maxScore}
                </Text>
              </View>
            ) : (
              <Text style={styles.waitingTextSmall}>⏳ Değerlendiriliyor</Text>
            )}

            {assignment.allowResubmission && (
              <TouchableOpacity
                style={styles.resubmitButtonCompact}
                onPress={handleFileUpload}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <Text style={styles.resubmitButtonTextCompact}>🔄 Yeniden Teslim Et</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleFileUpload}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Text style={styles.submitButtonIcon}>📎</Text>
                <Text style={styles.submitButtonText}>Ödev Teslim Et</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
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
  backIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIconText: {
    fontSize: 28,
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
  statusBanner: {
    padding: 16,
    alignItems: 'center',
  },
  statusBannerText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  titleSection: {
    padding: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  className: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  infoIcon: {
    fontSize: 24,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  descriptionBox: {
    backgroundColor: colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  descriptionText: {
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 16,
    marginHorizontal: 20,
    borderRadius: 12,
    gap: 12,
  },
  infoBoxIcon: {
    fontSize: 24,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  footer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonIcon: {
    fontSize: 20,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  submittedContainer: {
    padding: 16,
    gap: 10,
  },
  submittedBadgeCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 10,
  },
  submittedBadgeIcon: {
    fontSize: 20,
  },
  submittedTextContainer: {
    flex: 1,
  },
  submittedBadgeText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
  submittedDateSmall: {
    color: colors.white,
    fontSize: 12,
    opacity: 0.9,
    marginTop: 2,
  },
  scoreCompact: {
    backgroundColor: '#E3F2FD',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  scoreCompactText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  waitingTextSmall: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  resubmitButtonCompact: {
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  resubmitButtonTextCompact: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AssignmentDetailScreen;