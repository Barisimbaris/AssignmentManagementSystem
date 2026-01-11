import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import * as groupAPI from '../../api/endpoints/groups';
import { colors } from '../../theme/colors';

const GroupsListScreen = ({ route, navigation }) => {
  const { assignmentId, assignmentTitle } = route.params;
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const response = await groupAPI.getAssignmentGroups(assignmentId);
      
      if (response.isSuccess) {
        setGroups(response.data || []);
      }
    } catch (error) {
      console.error('❌ Gruplar yüklenemedi:', error);
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchGroups();
    setIsRefreshing(false);
  };

  const renderGroupCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('GroupDetail', {
        groupId: item.id,
        groupName: item.groupName,
        assignmentTitle: assignmentTitle,
      })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.groupName}>{item.groupName}</Text>
          <Text style={styles.leaderName}>
            👑 Lider: {item.leaderName}
          </Text>
        </View>
        <View style={styles.memberCount}>
          <Text style={styles.memberCountText}>
            {item.members?.length || 0}
          </Text>
          <Text style={styles.memberCountLabel}>üye</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.statusContainer}>
          {item.hasSubmission ? (
            <View style={[styles.statusBadge, { backgroundColor: colors.success }]}>
              <Text style={styles.statusText}>✅ Teslim Edildi</Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: colors.warning }]}>
              <Text style={styles.statusText}>⏳ Bekliyor</Text>
            </View>
          )}
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Gruplar yükleniyor...</Text>
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
          {assignmentTitle}
        </Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          👥 {groups.length} grup
        </Text>
      </View>

      {/* Groups List */}
      <FlatList
        data={groups}
        renderItem={renderGroupCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>Henüz grup oluşturulmamış</Text>
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
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  leaderName: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  memberCount: {
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  memberCountText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  memberCountLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusContainer: {
    flex: 1,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
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

export default GroupsListScreen;
