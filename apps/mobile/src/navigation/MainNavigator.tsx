import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { FeedScreen } from '../screens/feed/FeedScreen';
import { ChallengesScreen } from '../screens/challenges/ChallengesScreen';
import { EventsScreen } from '../screens/events/EventsScreen';
import { RankingScreen } from '../screens/ranking/RankingScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { colors } from '../utils/theme';
import {
  MainTabParamList,
  FeedStackParamList,
  ChallengesStackParamList,
  ProfileStackParamList,
} from '../types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const FeedStack = createNativeStackNavigator<FeedStackParamList>();
const ChallengesStack = createNativeStackNavigator<ChallengesStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

// Feed Stack Navigator
function FeedNavigator() {
  return (
    <FeedStack.Navigator screenOptions={{ headerShown: false }}>
      <FeedStack.Screen name="FeedHome" component={FeedScreen} />
      {/* Add PostDetail and NewPost screens here */}
    </FeedStack.Navigator>
  );
}

// Challenges Stack Navigator
function ChallengesNavigator() {
  return (
    <ChallengesStack.Navigator screenOptions={{ headerShown: false }}>
      <ChallengesStack.Screen name="ChallengesHome" component={ChallengesScreen} />
      {/* Add ChallengeDetail and SubmitChallenge screens here */}
    </ChallengesStack.Navigator>
  );
}

// Profile Stack Navigator
function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
      {/* Add EditProfile, SavedPosts, MyPosts, Settings screens here */}
    </ProfileStack.Navigator>
  );
}

export function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Feed':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Challenges':
              iconName = focused ? 'trophy' : 'trophy-outline';
              break;
            case 'Events':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Ranking':
              iconName = focused ? 'podium' : 'podium-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.gray[400],
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.gray[200],
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen
        name="Feed"
        component={FeedNavigator}
        options={{ tabBarLabel: 'Início' }}
      />
      <Tab.Screen
        name="Challenges"
        component={ChallengesNavigator}
        options={{ tabBarLabel: 'Desafios' }}
      />
      <Tab.Screen
        name="Events"
        component={EventsScreen}
        options={{ tabBarLabel: 'Eventos' }}
      />
      <Tab.Screen
        name="Ranking"
        component={RankingScreen}
        options={{ tabBarLabel: 'Ranking' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{ tabBarLabel: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}
