import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../../components/ui';
import { supabase } from '../../services/supabase';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../utils/theme';
import { Challenge, ChallengesStackParamList } from '../../types';
import { format, isPast, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type ChallengesScreenProps = {
  navigation: NativeStackNavigationProp<ChallengesStackParamList, 'ChallengesHome'>;
};

const CHALLENGE_TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  content: 'camera-outline',
  engagement: 'heart-outline',
  purchase: 'cart-outline',
  referral: 'people-outline',
  social: 'share-social-outline',
  quiz: 'help-circle-outline',
};

const CHALLENGE_TYPE_LABELS: Record<string, string> = {
  content: 'Conteúdo',
  engagement: 'Engajamento',
  purchase: 'Compra',
  referral: 'Indicação',
  social: 'Social',
  quiz: 'Quiz',
};

export function ChallengesScreen({ navigation }: ChallengesScreenProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'active' | 'upcoming' | 'completed'>('active');

  const fetchChallenges = async () => {
    try {
      let query = supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === 'active') {
        query = query.eq('status', 'active');
      } else if (filter === 'completed') {
        query = query.eq('status', 'completed');
      }

      const { data, error } = await query;

      if (error) throw error;
      setChallenges(data || []);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, [filter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchChallenges();
  }, [filter]);

  const getTimeStatus = (challenge: Challenge) => {
    if (!challenge.end_date) return null;
    const endDate = new Date(challenge.end_date);
    
    if (isPast(endDate)) {
      return { text: 'Encerrado', color: colors.gray[500] };
    }
    
    const now = new Date();
    const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 3) {
      return { text: `${diffDays}d restante${diffDays > 1 ? 's' : ''}`, color: colors.warning.main };
    }
    
    return {
      text: `Até ${format(endDate, 'dd/MM', { locale: ptBR })}`,
      color: colors.gray[500],
    };
  };

  const renderChallenge = ({ item: challenge }: { item: Challenge }) => {
    const timeStatus = getTimeStatus(challenge);
    const typeIcon = CHALLENGE_TYPE_ICONS[challenge.type] || 'trophy-outline';
    const typeLabel = CHALLENGE_TYPE_LABELS[challenge.type] || challenge.type;

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('ChallengeDetail', { challengeId: challenge.id })}
        activeOpacity={0.7}
      >
        <Card style={styles.challengeCard}>
          <View style={styles.cardHeader}>
            <View style={styles.typeTag}>
              <Ionicons name={typeIcon} size={14} color={colors.primary[600]} />
              <Text style={styles.typeText}>{typeLabel}</Text>
            </View>
            {timeStatus && (
              <Text style={[styles.timeStatus, { color: timeStatus.color }]}>
                {timeStatus.text}
              </Text>
            )}
          </View>

          <Text style={styles.challengeTitle}>{challenge.title}</Text>
          <Text style={styles.challengeDescription} numberOfLines={2}>
            {challenge.description}
          </Text>

          <View style={styles.cardFooter}>
            {challenge.coin_reward > 0 && (
              <View style={styles.rewardBadge}>
                <Ionicons name="star" size={16} color={colors.warning.main} />
                <Text style={styles.rewardText}>{challenge.coin_reward} moedas</Text>
              </View>
            )}
            {challenge.reward_description && (
              <View style={styles.prizeBadge}>
                <Ionicons name="gift-outline" size={16} color={colors.accent[600]} />
                <Text style={styles.prizeText} numberOfLines={1}>
                  {challenge.reward_description}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.participateRow}>
            <View style={styles.participantsInfo}>
              <Ionicons name="people-outline" size={18} color={colors.gray[500]} />
              <Text style={styles.participantsText}>
                {challenge.participants_count || 0} participante{(challenge.participants_count || 0) !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.arrowContainer}>
              <Text style={styles.participateText}>Participar</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.primary[600]} />
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const FilterTab = ({
    label,
    value,
  }: {
    label: string;
    value: 'active' | 'upcoming' | 'completed';
  }) => (
    <TouchableOpacity
      style={[styles.filterTab, filter === value && styles.filterTabActive]}
      onPress={() => setFilter(value)}
    >
      <Text style={[styles.filterTabText, filter === value && styles.filterTabTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Desafios</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <FilterTab label="Ativos" value="active" />
        <FilterTab label="Em breve" value="upcoming" />
        <FilterTab label="Encerrados" value="completed" />
      </View>

      {/* Challenges List */}
      <FlatList
        data={challenges}
        renderItem={renderChallenge}
        keyExtractor={(item) => item.id}
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
              <Ionicons name="trophy-outline" size={64} color={colors.gray[300]} />
              <Text style={styles.emptyTitle}>Nenhum desafio</Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'active'
                  ? 'Não há desafios ativos no momento'
                  : filter === 'upcoming'
                  ? 'Nenhum desafio programado'
                  : 'Nenhum desafio encerrado'}
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
  },
  headerTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  filterTab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
  },
  filterTabActive: {
    backgroundColor: colors.primary[600],
  },
  filterTabText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.gray[600],
  },
  filterTabTextActive: {
    color: colors.white,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  challengeCard: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  typeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.primary[700],
    marginLeft: spacing.xs,
  },
  timeStatus: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  challengeTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  challengeDescription: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning.light,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
  },
  rewardText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.warning.dark,
    marginLeft: spacing.xs,
  },
  prizeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    flex: 1,
    maxWidth: '100%',
  },
  prizeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.accent[700],
    marginLeft: spacing.xs,
    flex: 1,
  },
  participateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  participantsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsText: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginLeft: spacing.xs,
  },
  arrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participateText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary[600],
    marginRight: spacing.xs,
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
    textAlign: 'center',
  },
});
