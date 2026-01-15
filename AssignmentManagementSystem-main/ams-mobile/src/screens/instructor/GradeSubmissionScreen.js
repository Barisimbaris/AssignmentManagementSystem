import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Switch
} from 'react-native';
import apiClient from '../../api/client';
import { colors } from '../../theme/colors';
import { getGroupDetails } from '../../api/endpoints/groups';
import { getGradeBySubmissionId, updateGrade, deleteGrade } from '../../api/endpoints/grades';

const GradeSubmissionScreen = ({ route, navigation }) => {
  const { submissionId, studentName, assignmentTitle } = route.params;
  const [submission, setSubmission] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [groupInfo, setGroupInfo] = useState(null);
  const [currentGrade, setCurrentGrade] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [gradeData, setGradeData] = useState({
    score: '',
    feedback: '',
    isPublished: true,
  });

  useEffect(() => {
    fetchSubmissionDetail();
  }, []);

  const fetchSubmissionDetail = async () => {
    try {
      setIsLoading(true);
      console.log('📥 Teslim detayı getiriliyor:', submissionId);
      
      // Submission bilgisini çek
      const submissionResponse = await apiClient.get(`/Submission/${submissionId}`);
      
      if (submissionResponse.data.isSuccess && submissionResponse.data.data) {
        const data = submissionResponse.data.data;
        setSubmission(data);
        
        // Assignment bilgisini çek (maxScore için)
        if (data.assignmentId) {
          try {
            const assignmentResponse = await apiClient.get(`/Assignment/${data.assignmentId}`);
            if (assignmentResponse.data.isSuccess && assignmentResponse.data.data) {
              setAssignment(assignmentResponse.data.data);
              
              // Grup ödevi kontrolü
              const assignmentData = assignmentResponse.data.data;
              const isGroupAssignment = assignmentData.type === 'Group' || 
                                        assignmentData.assignmentType === 'Group' ||
                                        assignmentData.type === 2;
              
              if (isGroupAssignment && data.groupId) {
                // Grup bilgisini çek
                try {
                  const groupResponse = await getGroupDetails(data.groupId);
                  if (groupResponse.isSuccess && groupResponse.data) {
                    setGroupInfo(groupResponse.data);
                  }
                } catch (groupError) {
                  console.warn('⚠️ Grup bilgisi alınamadı:', groupError);
                }
              }
            }
          } catch (assignmentError) {
            console.warn('⚠️ Assignment bilgisi alınamadı:', assignmentError);
          }
        }
        
        // Mevcut grade bilgisini çek
        try {
          const gradeResponse = await getGradeBySubmissionId(submissionId);
          if (gradeResponse.isSuccess && gradeResponse.data) {
            const grade = gradeResponse.data;
            setCurrentGrade(grade);
            setGradeData({
              score: grade.score?.toString() || '',
              feedback: grade.feedback || '',
              isPublished: grade.isPublished !== undefined ? grade.isPublished : true,
            });
          }
        } catch (gradeError) {
          console.log('ℹ️ Mevcut not bulunamadı (yeni not verilecek)');
        }
      }
    } catch (error) {
      console.error('❌ Teslim detayı yüklenemedi:', error);
      Alert.alert('Hata', 'Teslim detayı yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrade = async () => {
    // Validasyon
    if (!gradeData.score.trim()) {
      Alert.alert('Hata', 'Not giriniz');
      return;
    }

    const score = parseFloat(gradeData.score);
    const maxScore = assignment?.maxScore || 100;
    
    if (isNaN(score) || score < 0) {
      Alert.alert('Hata', 'Not negatif olamaz');
      return;
    }
    
    if (score > maxScore) {
      Alert.alert('Hata', `Not maksimum ${maxScore} olabilir`);
      return;
    }

    // Grup ödevi uyarısı
    const isGroupAssignment = assignment?.type === 'Group' || 
                             assignment?.assignmentType === 'Group' ||
                             assignment?.type === 2;
    
    if (isGroupAssignment && !currentGrade) {
      Alert.alert(
        'Grup Ödevi',
        'Bu bir grup ödevidir. Verdiğiniz not tüm grup üyelerine uygulanacaktır.',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Devam Et', onPress: () => submitGrade(score) }
        ]
      );
      return;
    }

    await submitGrade(score);
  };

  const submitGrade = async (score) => {
    try {
      setIsSubmitting(true);
      
      // Mevcut not varsa güncelle, yoksa yeni oluştur
      if (currentGrade) {
        const payload = {
          score: score,
          feedback: gradeData.feedback || '',
          isPublished: gradeData.isPublished,
        };

        console.log('📤 Not güncelleniyor:', payload);

        const response = await updateGrade(currentGrade.id, payload);

        if (response.isSuccess) {
          Alert.alert('Başarılı! 🎉', 'Not başarıyla güncellendi', [
            {
              text: 'Tamam',
              onPress: () => navigation.goBack(),
            },
          ]);
        }
      } else {
        const payload = {
          submissionId: submissionId,
          score: score,
          feedback: gradeData.feedback || '',
          isPublished: gradeData.isPublished,
        };

        console.log('📤 Not veriliyor:', payload);

        const response = await apiClient.post('/Grade', payload);

        if (response.data.isSuccess) {
          Alert.alert('Başarılı! 🎉', 'Not başarıyla verildi', [
            {
              text: 'Tamam',
              onPress: () => navigation.goBack(),
            },
          ]);
        }
      }
    } catch (error) {
      console.error('❌ Not verme hatası:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Not verilemedi';
      Alert.alert('Hata', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGrade = () => {
    if (!currentGrade) {
      Alert.alert('Hata', 'Silinecek not bulunamadı');
      return;
    }

    Alert.alert(
      'Notu Sil',
      'Bu notu silmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              const response = await deleteGrade(currentGrade.id);
              
              if (response.isSuccess) {
                Alert.alert('Başarılı! ✅', 'Not başarıyla silindi', [
                  {
                    text: 'Tamam',
                    onPress: () => navigation.goBack(),
                  },
                ]);
              }
            } catch (error) {
              console.error('❌ Not silme hatası:', error);
              Alert.alert('Hata', error.message || 'Not silinemedi');
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const handleDownloadFile = () => {
    if (submission?.filePath) {
      Alert.alert(
        'Dosya',
        'Dosya indirme özelliği yakında eklenecek!',
        [{ text: 'Tamam' }]
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!submission) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Teslim bulunamadı</Text>
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
        <Text style={styles.headerTitle}>Not Ver</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Student Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Öğrenci Bilgileri</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ad Soyad:</Text>
              <Text style={styles.infoValue}>{studentName}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ödev:</Text>
              <Text style={styles.infoValue}>{assignmentTitle}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Teslim Tarihi:</Text>
              <Text style={styles.infoValue}>
                {new Date(submission.submittedAt).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
            {submission.isLate && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.lateBadge}>⚠️ Geç Teslim</Text>
                </View>
              </>
            )}
            {/* Grup Bilgisi */}
            {groupInfo && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Grup:</Text>
                  <Text style={styles.infoValue}>{groupInfo.groupName || `Grup ${groupInfo.id}`}</Text>
                </View>
                {groupInfo.members && groupInfo.members.length > 0 && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Grup Üyeleri:</Text>
                      <View style={styles.groupMembersContainer}>
                        {groupInfo.members.map((member, index) => (
                          <Text key={index} style={styles.groupMember}>
                            {member.isLeader ? '👑 ' : '👤 '}
                            {member.studentName || `${member.firstName} ${member.lastName}`}
                            {member.isLeader && ' (Lider)'}
                          </Text>
                        ))}
                      </View>
                    </View>
                  </>
                )}
                <View style={styles.groupWarningBox}>
                  <Text style={styles.groupWarningText}>
                    ⚠️ Bu bir grup ödevidir. Verdiğiniz not tüm grup üyelerine uygulanacaktır.
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Submitted File */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📎 Teslim Edilen Dosya</Text>
          <TouchableOpacity 
            style={styles.fileCard}
            onPress={handleDownloadFile}
          >
            <Text style={styles.fileIcon}>
              {submission.fileType === 'Image' ? '🖼️' : '📄'}
            </Text>
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>
                {submission.filePath?.split('/').pop() || 'Dosya'}
              </Text>
              <Text style={styles.fileSize}>
                {(submission.fileSizeInBytes / 1024 / 1024).toFixed(2)} MB
              </Text>
            </View>
            <Text style={styles.downloadIcon}>⬇️</Text>
          </TouchableOpacity>
        </View>

        {/* Grading Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ Değerlendirme</Text>
          
          {/* Score */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Not (0-{assignment?.maxScore || 100}) *
            </Text>
            <TextInput
              style={styles.input}
              placeholder={`Örn: ${Math.round((assignment?.maxScore || 100) * 0.85)}`}
              value={gradeData.score}
              onChangeText={(text) => setGradeData({ ...gradeData, score: text })}
              keyboardType="numeric"
            />
          </View>

          {/* Feedback */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Geri Bildirim</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Öğrenciye geri bildiriminizi yazın..."
              value={gradeData.feedback}
              onChangeText={(text) => setGradeData({ ...gradeData, feedback: text })}
              multiline
              numberOfLines={5}
            />
          </View>

          {/* Is Published Switch */}
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Notu Yayınla</Text>
            <Switch
              value={gradeData.isPublished}
              onValueChange={(value) => setGradeData({ ...gradeData, isPublished: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
          <Text style={styles.switchHint}>
            {gradeData.isPublished 
              ? 'Not öğrenciye görünür olacak' 
              : 'Not taslak olarak kaydedilecek'}
          </Text>
        </View>

        {/* Current Grade (if exists) */}
        {currentGrade && (
          <View style={styles.section}>
            <View style={styles.currentGradeBox}>
              <View>
                <Text style={styles.currentGradeLabel}>Mevcut Not:</Text>
                <Text style={styles.currentGradeValue}>
                  {currentGrade.score} / {assignment?.maxScore || 100}
                </Text>
                {currentGrade.feedback && (
                  <Text style={styles.currentGradeFeedback}>
                    {currentGrade.feedback}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeleteGrade}
                disabled={isSubmitting}
              >
                <Text style={styles.deleteButtonText}>🗑️ Sil</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleGrade}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>
              {submission.score !== null ? 'Notu Güncelle' : 'Not Ver'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
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
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  lateBadge: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '600',
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  fileIcon: {
    fontSize: 40,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  downloadIcon: {
    fontSize: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  currentGradeBox: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    marginHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentGradeLabel: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  currentGradeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  footer: {
    padding: 20,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  groupMembersContainer: {
    flex: 1,
    marginTop: 4,
  },
  groupMember: {
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  groupWarningBox: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  groupWarningText: {
    fontSize: 13,
    color: '#856404',
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  switchHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: -8,
    marginBottom: 8,
  },
  currentGradeFeedback: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  deleteButton: {
    backgroundColor: colors.error || '#F44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default GradeSubmissionScreen;