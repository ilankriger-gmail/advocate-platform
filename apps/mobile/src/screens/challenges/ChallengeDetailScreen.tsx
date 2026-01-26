import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Card } from '../../components/ui';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../utils/theme';
import { Challenge, ChallengeParticipation, ChallengesStackParamList } from '../../types';
import { format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Props = NativeStackScreenProps<ChallengesStackParamList, 'ChallengeDetail'>;

const CHALLENGE_TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  content: 'camera-outline',
  engagement: 'heart-outline',
  purchase: 'cart-outline',
  referral: 'people-outline',
  social: 'share-social-outline',
  quiz: 'help-circle-outline',
};

export function ChallengeDetailScreen({ route, navigation }: Props) {
  const { challengeId } = route.params;
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [participation, setParticipation] = useState<ChallengeParticipation | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchChallenge();
    if (user) {
      fetchParticipation();
    }
  }, [challengeId, user]);

  const fetchChallenge = async () => {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (error) throw error;
      setChallenge(data);
    } catch (error) {
      console.error('Error fetching challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipation = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('challenge_participants')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id)
        .single();

      setParticipation(data);
    } catch (error) {
      // No participation found
    }
  };

  const handleParticipate = () => {
    navigation.navigate('SubmitChallenge', { challengeId });
  };

  if (!challenge) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isExpired = challenge.end_date && isPast(new Date(challenge.end_date));
  const hasParticipated = !!participation;
  const typeIcon = CHALLENGE_TYPE_ICONS[challenge.type] || 'trophy-outline';

  const getStatusBadge = () => {
    if (!participation) return null;

    switch (participation.status) {
      case 'pending':
        return { text: 'Em análise', color: colors.warning.main, icon: 'time-outline' as const };
      case 'approved':
        return { text: 'Aprovado', color: colors.success.main, icon: 'checkmark-circle-outline' as const };
      case 'rejected':
        return { text: 'Rejeitado', color: colors.error.main, icon: 'close-circle-outline' as const };
      case 'winner':
        return { text: 'Vencedor! 🎉', color: colors.accent[500], icon: 'trophy-outline' as const };
      default:
        return null;
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[800]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Desafio</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView}>
        <Card style={styles.mainCard}>
          {/* Type Badge */}
          <View style={styles.typeBadge}>
            <Ionicons name={typeIcon} size={16} color={colors.primary[600]} />
            <Text style={styles.typeText}>
              {challenge.type.charAt(0).toUpperCase() + challenge.type.slice(1)}
            </Text>
          </View>

          {/* Title & Description */}
          <Text style={styles.title}>{challenge.title}</Text>
          <Text style={styles.description}>{challenge.description}</Text>

          {/* Status Badge */}
          {statusBadge && (
            <View style={[styles.statusBadge, { backgroundColor: statusBadge.color + '20' }]}>
              <Ionicons name={statusBadge.icon} size={18} color={statusBadge.color} />
              <Text style={[styles.statusText, { color: statusBadge.color }]}>
                {statusBadge.text}
              </Text>
            </View>
          )}

          {/* Rewards */}
          <View style={styles.rewardsSection}>
            <Text style={styles.sectionTitle}>Recompensas</Text>
            
            {challenge.coin_reward > 0 && (
              <View style={styles.rewardItem}>
                <Ionicons name="star" size={24} color={colors.warning.main} />
                <Text style={styles.rewardText}>{challenge.coin_reward} moedas</Text>
              </View>
            )}
            
            {challenge.reward_description && (
              <View style={styles.rewardItem}>
                <Ionicons name="gift" size={24} color={colors.accent[500]} />
                <Text style={styles.rewardText}>{challenge.reward_description}</Text>
              </View>
            )}
          </View>

          {/* Dates */}
          <View style={styles.datesSection}>
            <Text style={styles.sectionTitle}>Período</Text>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.gray[500]} />
              <Text style={styles.dateText}>
                {challenge.start_date
                  ? format(new Date(challenge.start_date), "dd 'de' MMMM", { locale: ptBR })
                  : 'Sem data de início'}
                {' → '}
                {challenge.end_date
                  ? format(new Date(challenge.end_date), "dd 'de' MMMM", { locale: ptBR })
                  : 'Sem prazo'}
              </Text>
            </View>
          </View>

          {/* Submission Type */}
          <View style={styles.submissionSection}>
            <Text style={styles.sectionTitle}>Como participar</Text>
            <Text style={styles.submissionText}>
              {challenge.submission_type === 'image' && '📸 Envie uma foto como prova'}
              {challenge.submission_type === 'video' && '🎥 Envie um vídeo como prova'}
              {challenge.submission_type === 'text' && '✍️ Descreva sua participação'}
              {challenge.submission_type === 'link' && '🔗 Envie um link como prova'}
              {challenge.submission_type === 'multiple' && '📎 Envie fotos, vídeos ou links'}
            </Text>
          </View>
        </Card>

        {/* Spacer for button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Button */}
      {!isExpired && !hasParticipated && (
        <View style={styles.bottomButton}>
          <Button
            title="Participar do Desafio"
            onPress={handleParticipate}
            fullWidth
          />
        </View>
      )}

      {hasParticipated && (
        <View style={styles.bottomButton}>
          <View style={styles.participatedBanner}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success.main} />
            <Text style={styles.participatedText}>Você já participou deste desafio!</Text>
          </View>
        </View>
      )}

      {isExpired && !hasParticipated && (
        <View style={styles.bottomButton}>
          <View style={styles.expiredBanner}>
            <Ionicons name="time" size={24} color={colors.gray[500]} />
            <Text style={styles.expiredText}>Este desafio já encerrou</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  scrollView: {
    flex: 1,
  },
  mainCard: {
    margin: spacing.md,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  typeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.primary[700],
    marginLeft: spacing.xs,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSize.base,
    color: colors.gray[600],
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginLeft: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[500],
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  rewardsSection: {
    marginBottom: spacing.lg,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  rewardText: {
    fontSize: fontSize.base,
    color: colors.gray[800],
    marginLeft: spacing.sm,
    fontWeight: fontWeight.medium,
  },
  datesSection: {
    marginBottom: spacing.lg,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: fontSize.base,
    color: colors.gray[700],
    marginLeft: spacing.sm,
  },
  submissionSection: {
    marginBottom: spacing.md,
  },
  submissionText: {
    fontSize: fontSize.base,
    color: colors.gray[700],
  },
  bottomButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  participatedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success.light,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  participatedText: {
    marginLeft: spacing.sm,
    color: colors.success.dark,
    fontWeight: fontWeight.medium,
  },
  expiredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[100],
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  expiredText: {
    marginLeft: spacing.sm,
    color: colors.gray[600],
    fontWeight: fontWeight.medium,
  },
});
