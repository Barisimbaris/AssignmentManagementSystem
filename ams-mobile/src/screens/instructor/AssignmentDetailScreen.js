import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import apiClient from '../../api/client';
import { colors } from '../../theme/colors';

const AssignmentDetailScreen = ({ route, navigation }) => {
  const { assignmentId, assignment: initialAssignment } = route.params;
  const [assignment, setAssignment] = useState(initialAssignment);
  const [isLoading, setIsLoading] = useState(!initialAssignment);

  useEffect(() => {
    if (!initialAssignment) {
      fetchAssignmentDetail();
    }
  }, []);

  const fetchAssignmentDetail = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/Assignment/${assignmentId}`);
      
      if (response.data.isSuccess && response.data.data) {
        setAssignment(response.data.data);
      }
    } catch (error) {
      console.error('❌ Ödev detayı hatası:', error);
    } finally {
      setIsLoading(false);
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

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 İstatistikler</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{assignment.totalSubmissions || 0}</Text>
              <Text style={styles.statLabel}>Teslim</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{assignment.gradedSubmissions || 0}</Text>
              <Text style={styles.statLabel}>Notlandı</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{assignment.pendingSubmissions || 0}</Text>
              <Text style={styles.statLabel}>Bekliyor</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              if (assignment.type === 'Group' || assignment.assignmentType === 'Group') {
                navigation.navigate('GroupsList', {
                  assignmentId: assignment.id,
                  assignmentTitle: assignment.title,
                });
              } else {
                navigation.navigate('SubmissionsList', {
                  assignmentId: assignment.id,
                  assignmentTitle: assignment.title,
                });
              }
            }}
          >
            <Text style={styles.actionButtonText}>
              {assignment.type === 'Group' || assignment.assignmentType === 'Group' 
                ? '👥 Grupları Gör' 
                : '📤 Teslimleri Gör'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AssignmentDetailScreen;
