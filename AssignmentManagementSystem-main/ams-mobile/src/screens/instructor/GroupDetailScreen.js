import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Linking,
  Alert,
} from 'react-native';
import * as groupAPI from '../../api/endpoints/groups';
import apiClient from '../../api/client';
import { colors } from '../../theme/colors';

const GroupDetailScreen = ({ route, navigation }) => {
  const { groupId, groupName, assignmentTitle } = route.params;
  const [group, setGroup] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Fonksiyonları useEffect'lerden önce tanımla
  const fetchGroupSubmission = async () => {
    try {
      console.log('🔍 Grup submission çekiliyor, groupId:', groupId);
      const response = await groupAPI.getGroupSubmission(groupId);
      console.log('📥 Submission response:', response);
      
      // ✅ DÜZELTME: response zaten data objesi, isSuccess yok
      if (response.hasSubmission && response.submission) {
        console.log('✅ Submission bulundu:', response.submission);
        setSubmission(response.submission);
      } else {
        console.log('⚠️ Submission bulunamadı veya hasSubmission false');
      }
    } catch (error) {
      console.warn('⚠️ Submission bilgisi alınamadı:', error);
    }
  };

  const fetchGroupDetails = async () => {
    try {
      setIsLoading(true);
      const response = await groupAPI.getGroupDetails(groupId);
      
      if (response.isSuccess) {
        setGroup(response.data);
      }
    } catch (error) {
      console.error('❌ Grup detayları yüklenemedi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupDetails();
  }, []);

  useEffect(() => {
    if (group?.hasSubmission) {
      fetchGroupSubmission();
    }
  }, [group, groupId]); // ✅ groupId'yi de dependency'ye ekle

  const handleDownloadFile = () => {
    if (submission?.filePath) {
      // API base URL'ini al
      const baseURL = apiClient.defaults.baseURL || 'http://localhost:5281/api';
      const fileUrl = `${baseURL}/File/download?filePath=${encodeURIComponent(submission.filePath)}`;
      
      console.log('📥 Dosya indiriliyor:', fileUrl);
      
      Linking.openURL(fileUrl).catch(err => {
        Alert.alert('Hata', 'Dosya açılamadı: ' + err.message);
      });
    }
  };

  const handleGradeSubmission = () => {
    if (submission?.id) {
      navigation.navigate('GradeSubmission', {
        submissionId: submission.id,
        studentName: groupName, // Grup adı
        assignmentTitle: assignmentTitle,
      });
    }
  };

  const renderMemberCard = ({ item }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>
          {item.isLeader && '👑 '}
          {item.studentName}
        </Text>
        <Text style={styles.memberNumber}>{item.studentNumber}</Text>
      </View>
      {item.isLeader && (
        <View style={styles.leaderBadge}>
          <Text style={styles.leaderBadgeText}>Lider</Text>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Grup bulunamadı</Text>
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {groupName}
        </Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Group Info */}
        <View style={styles.infoSection}>
          <Text style={styles.assignmentTitle}>{assignmentTitle}</Text>
          <Text style={styles.groupName}>{group.groupName}</Text>
          
          <View style={styles.statusContainer}>
            {group.hasSubmission ? (
              <View style={[styles.statusBadge, { backgroundColor: colors.success }]}>
                <Text style={styles.statusText}>✅ Teslim Edildi</Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, { backgroundColor: colors.warning }]}>
                <Text style={styles.statusText}>⏳ Teslim Bekleniyor</Text>
              </View>
            )}
          </View>
        </View>

        {/* Members Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Grup Üyeleri ({group.members?.length || 0})
          </Text>
          
          <FlatList
            data={group.members || []}
            renderItem={renderMemberCard}
            keyExtractor={(item) => item.studentId.toString()}
            scrollEnabled={false}
          />
        </View>

        {/* Group Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Grup Bilgileri</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Oluşturulma Tarihi:</Text>
            <Text style={styles.infoValue}>
              {new Date(group.createdAt).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Grup Lideri:</Text>
            <Text style={styles.infoValue}>{group.leaderName}</Text>
          </View>
        </View>

        {/* ✅ YENİ: Submission Bilgileri */}
        {submission && (
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
                {submission.fileSizeInBytes && (
                  <Text style={styles.fileSize}>
                    {(submission.fileSizeInBytes / 1024 / 1024).toFixed(2)} MB
                  </Text>
                )}
                <Text style={styles.submittedDate}>
                  📅 {new Date(submission.submittedAt).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <Text style={styles.downloadIcon}>⬇️</Text>
            </TouchableOpacity>
            
            {submission.comments && (
              <View style={styles.commentsBox}>
                <Text style={styles.commentsLabel}>💬 Öğrenci Açıklaması:</Text>
                <Text style={styles.commentsText}>{submission.comments}</Text>
              </View>
            )}
            
            {/* ✅ YENİ: Not Verme Butonu */}
            <TouchableOpacity
              style={styles.gradeButton}
              onPress={handleGradeSubmission}
            >
              <Text style={styles.gradeButtonText}>
                {submission.score !== null ? '📊 Notu Güncelle' : '✅ Not Ver'}
              </Text>
            </TouchableOpacity>
            
            {submission.score !== null && (
              <View style={styles.currentGradeBox}>
                <Text style={styles.currentGradeLabel}>Mevcut Not:</Text>
                <Text style={styles.currentGradeValue}>{submission.score}</Text>
              </View>
            )}
          </View>
        )}

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
  errorText: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 24,
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
  content: {
    flex: 1,
  },
  infoSection: {
    backgroundColor: colors.white,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  assignmentTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  groupName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  statusContainer: {
    marginTop: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  statusText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: colors.white,
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  memberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  memberNumber: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  leaderBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  leaderBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
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
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  fileIcon: {
    fontSize: 40,
    marginRight: 12,
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
    marginBottom: 4,
  },
  submittedDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  downloadIcon: {
    fontSize: 24,
    color: colors.primary,
  },
  commentsBox: {
    backgroundColor: colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  commentsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  commentsText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  gradeButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  gradeButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentGradeBox: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
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
});

export default GroupDetailScreen;
