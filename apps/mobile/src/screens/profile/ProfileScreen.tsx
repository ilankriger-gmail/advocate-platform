import React from 'react';
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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Avatar, Button, Card } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../utils/theme';
import { ProfileStackParamList } from '../../types';

type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'ProfileHome'>;
};

export function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: signOut },
    ]);
  };

  const MenuButton = ({
    icon,
    label,
    onPress,
    danger = false,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
    danger?: boolean;
  }) => (
    <TouchableOpacity style={styles.menuButton} onPress={onPress}>
      <Ionicons
        name={icon}
        size={22}
        color={danger ? colors.error.main : colors.gray[600]}
      />
      <Text style={[styles.menuButtonText, danger && styles.menuButtonTextDanger]}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar uri={user?.avatar_url} name={user?.full_name} size="xl" />
            <TouchableOpacity
              style={styles.editAvatarButton}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Ionicons name="camera" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>

          <Text style={styles.profileName}>{user?.full_name || 'Usuário'}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>

          {user?.bio && <Text style={styles.profileBio}>{user.bio}</Text>}

          {/* Social Links */}
          <View style={styles.socialLinks}>
            {user?.instagram_handle && (
              <View style={styles.socialLink}>
                <Ionicons name="logo-instagram" size={18} color={colors.accent[500]} />
                <Text style={styles.socialText}>@{user.instagram_handle}</Text>
              </View>
            )}
            {user?.tiktok_handle && (
              <View style={styles.socialLink}>
                <Ionicons name="logo-tiktok" size={18} color={colors.gray[800]} />
                <Text style={styles.socialText}>@{user.tiktok_handle}</Text>
              </View>
            )}
          </View>

          <Button
            title="Editar perfil"
            variant="outline"
            onPress={() => navigation.navigate('EditProfile')}
            fullWidth
            style={styles.editButton}
          />
        </Card>

        {/* Stats */}
        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Desafios</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Moedas</Text>
            </View>
          </View>
        </Card>

        {/* Menu */}
        <Card style={styles.menuCard} padding="none">
          <MenuButton
            icon="create-outline"
            label="Meus posts"
            onPress={() => navigation.navigate('MyPosts')}
          />
          <MenuButton
            icon="bookmark-outline"
            label="Salvos"
            onPress={() => navigation.navigate('SavedPosts')}
          />
          <MenuButton
            icon="trophy-outline"
            label="Meus desafios"
            onPress={() => {}}
          />
          <MenuButton
            icon="gift-outline"
            label="Minhas recompensas"
            onPress={() => {}}
          />
        </Card>

        <Card style={styles.menuCard} padding="none">
          <MenuButton
            icon="settings-outline"
            label="Configurações"
            onPress={() => navigation.navigate('Settings')}
          />
          <MenuButton
            icon="help-circle-outline"
            label="Ajuda"
            onPress={() => {}}
          />
          <MenuButton
            icon="log-out-outline"
            label="Sair"
            onPress={handleSignOut}
            danger
          />
        </Card>

        {/* Version */}
        <Text style={styles.versionText}>Versão 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  profileCard: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  profileHeader: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary[600],
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  profileName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  profileEmail: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: spacing.xs / 2,
  },
  profileBio: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  socialLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  socialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  socialText: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    marginLeft: spacing.xs,
  },
  editButton: {
    marginTop: spacing.md,
  },
  statsCard: {
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.gray[200],
  },
  statValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: spacing.xs / 2,
  },
  menuCard: {
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  menuButtonText: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.gray[800],
    marginLeft: spacing.md,
  },
  menuButtonTextDanger: {
    color: colors.error.main,
  },
  versionText: {
    textAlign: 'center',
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginTop: spacing.md,
  },
});
