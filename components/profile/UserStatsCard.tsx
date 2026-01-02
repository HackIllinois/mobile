import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface UserStatsCardProps {
  displayName: string;
  foodWave: number;
  track: string;
  rank: number;
  points: number;
  pointsToNextRank: number;
}

export const UserStatsCard: React.FC<UserStatsCardProps> = ({
  displayName,
  foodWave,
  track,
  rank,
  points,
  pointsToNextRank,
}) => {
  return (
    <View style={styles.cardWrapper}>
      <Text style={styles.statsCardTitle}>USER STATS</Text>

      <View style={styles.statsContent}>
        <View style={styles.nameSection}>
          <Text style={styles.fieldLabelSmall}>NAME</Text>
          <Text style={styles.statsName}>{displayName}</Text>
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.fieldLabelSmall}>TRACK</Text>
          <Text style={styles.statsValue}>{track}</Text>
        </View>

        <View style={styles.waveRankOuterContainer}>
          <View style={styles.waveRankLeftSection}>
            <View style={styles.waveRankItem}>
              <Text style={styles.fieldLabelSmall}>WAVE</Text>
              <View style={styles.waveBadge}>
                <Text style={styles.waveRankValue}>{foodWave || 1}</Text>
              </View>
            </View>

            <View style={[styles.waveRankItem, { minWidth: SCREEN_WIDTH * 0.157 }]}>
              <Text style={styles.fieldLabelSmall}>RANK</Text>
              <View style={styles.rankBadge}>
                <Text style={styles.waveRankValue}>{rank}</Text>
              </View>
            </View>
          </View>

          <View style={styles.waveRankRightSection}>
            <Text style={styles.pointsInfoText}>
              You're {pointsToNextRank} points away from the next rank!
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    flex: 1,
  },
  statsCardTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: 0,
    marginBottom: 0,
    textAlign: 'left',
    marginLeft: SCREEN_WIDTH * -0.01,
    marginTop: SCREEN_WIDTH * -0.019,
    lineHeight: 22,
  },
  statsContent: {
    gap: 18,
    marginTop: SCREEN_WIDTH * 0.048,
  },
  nameSection: {
    marginBottom: 0,
  },
  statsName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 0,
    letterSpacing: 0,
    lineHeight: 20,
    fontFamily: 'Tsukimi Rounded',
    paddingTop: 5,
  },
  statsRow: {
    marginBottom: 0,
  },
  fieldLabelSmall: {
    fontSize: 12,
    color: '#FFE0B4',
    fontWeight: '400',
    letterSpacing: 0,
    marginBottom: 0,
    marginTop: -3,
    fontStyle: 'italic',
    lineHeight: 12,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 20,
    letterSpacing: 0,
    fontFamily: 'Tsukimi Rounded',
    paddingTop: 5,
  },
  waveRankOuterContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 0,
    marginTop: 5,
    width: '100%',
  },
  waveRankLeftSection: {
    flexDirection: 'row',
    gap: SCREEN_WIDTH * 0.032,
    alignItems: 'flex-end',
  },
  waveRankItem: {
    flex: 0,
    minWidth: SCREEN_WIDTH * 0.10,
    zIndex: 2,
  },
  waveBadge: {
    backgroundColor: 'rgba(24, 1, 97, 0.8)',
    borderRadius: 6,
    paddingTop: 7,
    paddingBottom: 6,
    paddingHorizontal: 15,
    alignItems: 'center',
    marginTop: 3,
    width: SCREEN_WIDTH * 0.10,
    height: SCREEN_WIDTH * 0.099,
    justifyContent: 'center',
    zIndex: 2,
  },
  rankBadge: {
    backgroundColor: 'rgba(24, 1, 97, 0.8)',
    borderRadius: 20,
    paddingTop: 7,
    paddingBottom: 6,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginTop: 3,
    width: SCREEN_WIDTH * 0.157,
    height: SCREEN_WIDTH * 0.099,
    justifyContent: 'center',
    zIndex: 2,
  },
  waveRankValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    lineHeight: 20,
    letterSpacing: 0,
    fontFamily: 'Montserrat', 

  },
  waveRankRightSection: {
    backgroundColor: 'rgba(79, 23, 135, 0.5)',
    borderRadius: 20,
    flex: 1,
    marginTop: 3,
    marginLeft: SCREEN_WIDTH * -0.133,
    justifyContent: 'center',
    width: SCREEN_WIDTH * 0.56,
    height: SCREEN_WIDTH * 0.099,
    paddingLeft: SCREEN_WIDTH * 0.15,
    paddingRight: SCREEN_WIDTH * 0.04,
    paddingTop: SCREEN_WIDTH * 0.011,
    paddingBottom: SCREEN_WIDTH * 0.008,
    zIndex: 0,
  },
  pointsInfoText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#FFF',
    fontStyle: 'italic',
    textAlign: 'left',
    lineHeight: 12,
    letterSpacing: 0,
  },
});
