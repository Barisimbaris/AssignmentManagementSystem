import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import apiClient from '../../api/client';
import { colors } from '../../theme/colors';

const GradeSubmissionScreen = ({ route, navigation }) => {
  const { submissionId, studentName, assignmentTitle } = route.params;
  const [submission, setSubmission] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [gradeData, setGradeData] = useState({
    score: '',
    feedback: '',
  });

  useEffect(() => {
    fetchSubmissionDetail();
  }, []);

  const fetchSubmissionDetail = async () => {
    try {
      setIsLoading(true);
      console.log('📥 Teslim detayı getiriliyor:', submissionId);
      
      const response = await apiClient.get(`/Submission/${submissionId}`);
      
      if (response.data.isSuccess && response.data.data) {
        const data = response.data.data;
        setSubmission(data);
        
        // Eğer daha önce notlandırılmışsa, mevcut notu göster
        if (data.score !== null && data.score !== undefined) {
          setGradeData({
            score: data.score.toString(),
            feedback: data.feedback || '',
          });
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
    if (isNaN(score) || score < 0 || score > 100) {
      Alert.alert('Hata', 'Not 0-100 arasında olmalıdır');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const payload = {
        submissionId: submissionId,
        score: score,
        feedback: gradeData.feedback || '',
        isPublished: true,
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
    } catch (error) {
      console.error('❌ Not verme hatası:', error);
      Alert.alert('Hata', error.message || 'Not verilemedi');
    } finally {
      setIsSubmitting(false);
    }
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
            <Text style={styles.label}>Not (0-100) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: 85"
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
        </View>

        {/* Current Grade (if exists) */}
        {submission.score !== null && submission.score !== undefined && (
          <View style={styles.currentGradeBox}>
            <Text style={styles.currentGradeLabel}>Mevcut Not:</Text>
            <Text style={styles.currentGradeValue}>{submission.score} / 100</Text>
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
});

export default GradeSubmissionScreen;