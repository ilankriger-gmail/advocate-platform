import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card, Avatar } from '../../components/ui';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../utils/theme';
import { UserStats } from '../../types';

export function RankingScreen() {
  const [ranking, setRanking] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const fetchRanking = async () => {
    try {
      // Fetch users with their stats
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          avatar_url
        `)
        .eq('role', 'fan')
        .limit(50);

      if (error) throw error;

      // For now, use mock stats (in production, you'd have a user_stats table)
      const rankingData: UserStats[] = (data || []).map((u, index) => ({
        id: u.id,
        full_name: u.full_name,
        avatar_url: u.avatar_url,
        total_coins: Math.floor(Math.random() * 1000),
        level: Math.floor(Math.random() * 5) + 1,
        posts_count: Math.floor(Math.random() * 50),
        challenges_won: Math.floor(Math.random() * 10),
        rank: index + 1,
      }));

      // Sort by coins
      rankingData.sort((a, b) => b.total_coins - a.total_coins);
      rankingData.forEach((item, index) => {
        item.rank = index + 1;
      });

      setRanking(rankingData);
    } catch (error) {
      console.error('Error fetching ranking:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRanking();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRanking();
  }, []);

  const getLevelColor = (level: number) => {
    switch (level) {
      case 5:
        return colors.accent[500]; // Platinum
      case 4:
        return '#FFD700'; // Gold
      case 3:
        return '#C0C0C0'; // Silver
      case 2:
        return '#CD7F32'; // Bronze
      default:
        return colors.gray[400];
    }
  };

  const getLevelName = (level: number) => {
    switch (level) {
      case 5:
        return 'Platina';
      case 4:
        return 'Ouro';
      case 3:
        return 'Prata';
      case 2:
        return 'Bronze';
      default:
        return 'Iniciante';
    }
  };

  const renderPodium = () => {
    const top3 = ranking.slice(0, 3);
    if (top3.length < 3) return null;

    return (
      <View style={styles.podiumContainer}>
        {/* 2nd Place */}
        <View style={[styles.podiumItem, styles.podiumSecond]}>
          <Avatar uri={top3[1].avatar_url} name={top3[1].full_name} size="lg" />
          <View style={[styles.podiumBadge, { backgroundColor: '#C0C0C0' }]}>
            <Text style={styles.podiumRank}>2</Text>
          </View>
          <Text style={styles.podiumName} numberOfLines={1}>
            {top3[1].full_name || 'Usuário'}
          </Text>
          <Text style={styles.podiumCoins}>{top3[1].total_coins} 🪙</Text>
        </View>

        {/* 1st Place */}
        <View style={[styles.podiumItem, styles.podiumFirst]}>
          <View style={styles.crownContainer}>
            <Ionicons name="trophy" size={28} color="#FFD700" />
          </View>
          <Avatar uri={top3[0].avatar_url} name={top3[0].full_name} size="xl" />
          <View style={[styles.podiumBadge, { backgroundColor: '#FFD700' }]}>
            <Text style={styles.podiumRank}>1</Text>
          </View>
          <Text style={styles.podiumName} numberOfLines={1}>
            {top3[0].full_name || 'Usuário'}
          </Text>
          <Text style={styles.podiumCoins}>{top3[0].total_coins} 🪙</Text>
        </View>

        {/* 3rd Place */}
        <View style={[styles.podiumItem, styles.podiumThird]}>
          <Avatar uri={top3[2].avatar_url} name={top3[2].full_name} size="lg" />
          <View style={[styles.podiumBadge, { backgroundColor: '#CD7F32' }]}>
            <Text style={styles.podiumRank}>3</Text>
          </View>
          <Text style={styles.podiumName} numberOfLines={1}>
            {top3[2].full_name || 'Usuário'}
          </Text>
          <Text style={styles.podiumCoins}>{top3[2].total_coins} 🪙</Text>
        </View>
      </View>
    );
  };

  const renderRankItem = ({ item, index }: { item: UserStats; index: number }) => {
    if (index < 3) return null; // Skip top 3 (shown in podium)

    const isCurrentUser = user?.id === item.id;

    return (
      <Card style={[styles.rankItem, isCurrentUser ? styles.rankItemCurrent : undefined]}>
        <View style={styles.rankPosition}>
          <Text style={styles.rankNumber}>{item.rank}</Text>
        </View>
        <Avatar uri={item.avatar_url} name={item.full_name} size="md" />
        <View style={styles.rankInfo}>
          <Text style={styles.rankName}>{item.full_name || 'Usuário'}</Text>
          <View style={styles.levelBadge}>
            <View
              style={[styles.levelDot, { backgroundColor: getLevelColor(item.level) }]}
            />
            <Text style={styles.levelText}>{getLevelName(item.level)}</Text>
          </View>
        </View>
        <View style={styles.rankStats}>
          <Text style={styles.coinsText}>{item.total_coins}</Text>
          <Text style={styles.coinsLabel}>moedas</Text>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ranking</Text>
      </View>

      <FlatList
        data={ranking}
        renderItem={renderRankItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderPodium}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary[600]]}
            tintColor={colors.primary[600]}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="podium-outline" size={64} color={colors.gray[300]} />
              <Text style={styles.emptyTitle}>Ranking vazio</Text>
              <Text style={styles.emptySubtitle}>
                Participe de desafios para aparecer aqui!
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingVertical: spacing.xl,
    marginBottom: spacing.md,
  },
  podiumItem: {
    alignItems: 'center',
    marginHorizontal: spacing.sm,
  },
  podiumFirst: {
    marginBottom: spacing.lg,
  },
  podiumSecond: {
    marginBottom: 0,
  },
  podiumThird: {
    marginBottom: 0,
  },
  crownContainer: {
    marginBottom: spacing.xs,
  },
  podiumBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -12,
    borderWidth: 2,
    borderColor: colors.white,
  },
  podiumRank: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  podiumName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[800],
    marginTop: spacing.xs,
    maxWidth: 80,
    textAlign: 'center',
  },
  podiumCoins: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: spacing.xs / 2,
  },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  rankItemCurrent: {
    borderColor: colors.primary[300],
    borderWidth: 2,
    backgroundColor: colors.primary[50],
  },
  rankPosition: {
    width: 32,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  rankNumber: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.gray[600],
  },
  rankInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  rankName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.gray[900],
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs / 2,
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  levelText: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  rankStats: {
    alignItems: 'flex-end',
  },
  coinsText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  coinsLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[500],
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    marginTop: spacing.xs,
  },
});
