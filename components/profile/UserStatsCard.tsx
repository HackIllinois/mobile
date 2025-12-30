import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CutCornerCard } from './CutCornerCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface UserStatsCardProps {
  displayName: string;
  foodWave: number;
  track: string;
  rank: number;
  points: number;
  pointsToNextRank: number;
  isEditing: boolean;
  editedDisplayName: string;
  onDisplayNameChange: (text: string) => void;
  onEditPress: () => void;
}

export const UserStatsCard: React.FC<UserStatsCardProps> = ({
  displayName,
  foodWave,
  track,
  rank,
  points,
  pointsToNextRank,
  isEditing,
  editedDisplayName,
  onDisplayNameChange,
  onEditPress,
}) => {
  return (
    <View>
      <CutCornerCard>
        <Text style={styles.statsCardTitle}>USER STATS</Text>

        <View style={styles.statsContent}>
          <View style={styles.nameSection}>
            <Text style={styles.fieldLabelSmall}>NAME</Text>
            <View style={styles.nameWithEdit}>
              <TextInput
                style={[
                  styles.textInput,
                  !isEditing && styles.textInputDisabled,
                  isEditing && styles.textInputActive
                ]}
                value={isEditing ? editedDisplayName : displayName}
                onChangeText={onDisplayNameChange}
                editable={isEditing}
                placeholder="Display Name"
                placeholderTextColor="#B8B8B8"
              />
              <TouchableOpacity onPress={onEditPress} style={styles.editIconInline}>
                <Ionicons name="pencil-sharp" size={18} color="#666" />
              </TouchableOpacity>
            </View>
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
      </CutCornerCard>
    </View>
  );
};

const styles = StyleSheet.create({
  statsCardTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#878787',
    letterSpacing: 0,
    marginBottom: 0,
    textAlign: 'left',
    marginLeft: SCREEN_WIDTH * -0.04,
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
  nameWithEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 5,
  },
  statsName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 0,
    letterSpacing: 0,
    lineHeight: 20,
    fontFamily: 'Tsukimi Rounded',
    paddingTop: 5,
  },
  editIconInline: {
    padding: 2,
  },
  statsRow: {
    marginBottom: 0,
  },
  fieldLabelSmall: {
    fontSize: 12,
    color: '#B8B8B8',
    fontWeight: '400',
    letterSpacing: 0,
    marginBottom: 0,
    fontStyle: 'italic',
    lineHeight: 12,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D2D2D',
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
    backgroundColor: '#8A8A8A',
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
    backgroundColor: '#8A8A8A',
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
    backgroundColor: '#AFAFAF',
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
  textInput: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D2D2D',
    letterSpacing: 0,
    lineHeight: 20,
    fontFamily: 'Tsukimi Rounded',
    paddingTop: 5,
    paddingBottom: 5,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    margin: 0,
    minWidth: 100,
  },
  textInputDisabled: {
    paddingHorizontal: 0,
  },
  textInputActive: {
    borderWidth: 1,
    borderColor: '#D0D0D0',
    backgroundColor: '#FAFAFA',
    borderRadius: 4,
    paddingHorizontal: 8,
    marginLeft: -8,
  },
});
