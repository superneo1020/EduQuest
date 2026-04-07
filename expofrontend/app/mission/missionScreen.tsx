import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getMissions } from '../services/missionService';
import { Mission } from '../types/mission';

const MissionScreen: React.FC = () => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [completedMissions, setCompletedMissions] = useState<Mission[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMissions = async () => {
    try {
      const activeData = await getMissions(false);
      const completedData = await getMissions(true);
      setMissions(activeData);
      setCompletedMissions(completedData);
    } catch (error) {
      console.error('Error loading missions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMissions();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadMissions();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'star-outline';
      case 'medium': return 'star-half-outline';
      case 'hard': return 'star';
      default: return 'star-outline';
    }
  };

  const renderMissionCard = (mission: Mission) => (
    <View key={mission.id} style={styles.missionCard}>
      <View style={styles.missionHeader}>
        <View style={styles.missionInfo}>
          <Text style={styles.missionName}>{mission.name}</Text>
          <View style={styles.difficultyBadge}>
            <Ionicons 
              name={getDifficultyIcon(mission.difficulty)} 
              size={14} 
              color={getDifficultyColor(mission.difficulty)}
            />
            <Text style={[styles.difficultyText, { color: getDifficultyColor(mission.difficulty) }]}>
              {mission.difficulty}
            </Text>
          </View>
        </View>
        <View style={styles.scoreBadge}>
          <Ionicons name="trophy" size={16} color="#fbbf24" />
          <Text style={styles.scoreText}>{mission.scores}</Text>
        </View>
      </View>
      
      <Text style={styles.missionDescription}>{mission.description}</Text>
      
      {mission.requirements && Object.keys(mission.requirements).length > 0 && (
        <View style={styles.requirementsContainer}>
          <Text style={styles.requirementsTitle}>Requirements:</Text>
          {Object.entries(mission.requirements).map(([key, value]) => (
            <Text key={key} style={styles.requirementItem}>
              • {key}: {JSON.stringify(value)}
            </Text>
          ))}
        </View>
      )}
    </View>
  );

  const displayMissions = activeTab === 'active' ? missions : completedMissions;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Missions</Text>
        <Text style={styles.subtitle}>Complete missions to earn rewards!</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            Active ({missions.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            Completed ({completedMissions.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading missions...</Text>
          </View>
        ) : displayMissions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="rocket-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>
              {activeTab === 'active' ? 'No active missions' : 'No completed missions'}
            </Text>
          </View>
        ) : (
          displayMissions.map(renderMissionCard)
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  missionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  missionInfo: {
    flex: 1,
  },
  missionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400e',
    marginLeft: 4,
  },
  missionDescription: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  requirementsContainer: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  requirementItem: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
});

export default MissionScreen;
