import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import WaveButtonSvg from '../../assets/profile/profile-screen/wave-button.svg';
import TierButtonSvg from '../../assets/profile/profile-screen/tier-button.svg';

interface UserStatsCardProps {
  displayName: string;
  foodWave: number;
  track: string;
  tier?: number;
  teamBadge: string;
  pointsAccumulated: number;
}

const getNextTierThreshold = (tier?: number): number | null => {
  if (tier === 1) return null; // Gold — already at top
  if (tier === 2) return 700;
  if (tier === 3) return 300;
  return 10; // no tier yet
};

export const UserStatsCard: React.FC<UserStatsCardProps> = ({
  displayName,
  foodWave,
  track,
  tier,
  pointsAccumulated,
}) => {
  const { width, height } = useWindowDimensions();

  const figmaWidth = 393;
  const figmaHeight = 852;
  const scaleWidth = (size: number) => (width / figmaWidth) * size;
  const scaleHeight = (size: number) => (height / figmaHeight) * size;
  const scaleFontSize = (size: number) => Math.min(scaleWidth(size), scaleHeight(size));

  return (
    <View style={{ flex: 1 }}>
      <Text style={{
        fontSize: scaleFontSize(17),
        fontWeight: '500',
        color: '#FFFFFF',
        opacity: 0.9,
        letterSpacing: 0,
        marginBottom: 0,
        textAlign: 'left',
        marginLeft: scaleWidth(-14),
        marginTop: scaleWidth(-14),
        lineHeight: scaleHeight(22),
      }}>USER STATS</Text>

      <View style={{
        gap: scaleHeight(18),
        marginTop: scaleWidth(20),
        marginLeft: scaleWidth(-7),
      }}>
        <View style={{ marginBottom: 0 }}>
          <Text style={{
            fontSize: scaleFontSize(12),
            color: '#FFE0B4',
            fontWeight: '400',
            letterSpacing: 0,
            marginBottom: 0,
            marginTop: scaleHeight(-3),
            fontStyle: 'italic',
            lineHeight: scaleHeight(12),
          }}>NAME</Text>
          <Text style={{
            fontSize: scaleFontSize(20),
            fontWeight: '700',
            color: '#FFFFFF',
            marginBottom: 0,
            letterSpacing: 0,
            lineHeight: scaleHeight(20),
            fontFamily: 'Tsukimi Rounded',
            paddingTop: scaleHeight(8),
          }}>{displayName}</Text>
        </View>

        <View style={{ marginBottom: 0 }}>
          <Text style={{
            fontSize: scaleFontSize(12),
            color: '#FFE0B4',
            fontWeight: '400',
            letterSpacing: 0,
            marginBottom: 0,
            marginTop: scaleHeight(-3),
            fontStyle: 'italic',
            lineHeight: scaleHeight(12),
          }}>TRACK</Text>
          <Text style={{
            fontSize: scaleFontSize(20),
            fontWeight: '700',
            color: '#FFFFFF',
            lineHeight: scaleHeight(20),
            letterSpacing: 0,
            fontFamily: 'Tsukimi Rounded',
            paddingTop: scaleHeight(8),
          }}>{track}</Text>
        </View>

        <View style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: scaleWidth(20),
          marginTop: scaleHeight(5),
          width: '100%',
        }}>
          {/* Wave Button */}
          <View style={{ zIndex: 2 }}>
            <Text style={{
              fontSize: scaleFontSize(12),
              color: '#FFE0B4',
              fontWeight: '400',
              letterSpacing: 0,
              marginBottom: 0,
              marginTop: scaleHeight(-3),
              fontStyle: 'italic',
              lineHeight: scaleHeight(12),
            }}>WAVE</Text>
            <View style={{
              marginTop: scaleHeight(6),
              marginLeft: scaleWidth(2),
              width: scaleWidth(39),
              height: scaleWidth(38),
            }}>
              <WaveButtonSvg
                width={scaleWidth(39)}
                height={scaleWidth(38)}
              />
              <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Text style={{
                  fontSize: scaleFontSize(18),
                  fontWeight: '700',
                  color: '#FFF',
                  fontFamily: 'Montserrat',
                  textAlign: 'center',
                }}>{foodWave || 1}</Text>
              </View>
            </View>
          </View>

          {/* Tier Button */}
          <View style={{ flex: 1, zIndex: 2 }}>
            <Text style={{
              fontSize: scaleFontSize(12),
              color: '#FFE0B4',
              fontWeight: '400',
              letterSpacing: 0,
              marginBottom: 0,
              marginTop: scaleHeight(-3),
              fontStyle: 'italic',
              lineHeight: scaleHeight(12),
            }}>TIER</Text>
            <View style={{
              marginTop: scaleHeight(6),
              marginLeft: scaleWidth(-4),
              width: scaleWidth(200),
              height: scaleWidth(200 * 42 / 219),
            }}>
              <TierButtonSvg
                width={scaleWidth(200)}
                height={scaleWidth(200 * 42 / 219)}
                preserveAspectRatio="none"
              />
              {/* Tier number centered on the left pill */}
              <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: scaleWidth(200 * 58.73 / 219),
                height: scaleWidth(200 * 42 / 219),
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Text style={{
                  fontSize: scaleFontSize(17),
                  fontWeight: '700',
                  color: '#FFF',
                  fontFamily: 'Montserrat',
                  textAlign: 'center',
                }}>{tier ?? '-'}</Text>
              </View>
              {/* Points away text on the right portion */}
              <View style={{
                position: 'absolute',
                top: 0,
                left: scaleWidth(200 * 58.73 / 219),
                right: scaleWidth(4),
                height: scaleWidth(200 * 42 / 219),
                justifyContent: 'center',
                paddingLeft: scaleWidth(6),
              }}>
                {(() => {
                  const threshold = getNextTierThreshold(tier);
                  if (threshold === null) {
                    return (
                      <Text
                        style={{
                          fontSize: scaleWidth(9.5),
                          fontWeight: '400',
                          color: '#FFF',
                          fontStyle: 'italic',
                          textAlign: 'left',
                        }}
                        numberOfLines={2}
                        adjustsFontSizeToFit={true}
                        minimumFontScale={0.7}
                      >
                        You're in the <Text style={{ fontWeight: '700' }}>Gold tier</Text>. Great work!
                      </Text>
                    );
                  }
                  const pointsNeeded = Math.max(0, threshold - pointsAccumulated);
                  return (
                    <Text
                      style={{
                        fontSize: scaleWidth(9.5),
                        fontWeight: '400',
                        color: '#FFF',
                        fontStyle: 'italic',
                        textAlign: 'left',
                      }}
                      numberOfLines={2}
                      adjustsFontSizeToFit={true}
                      minimumFontScale={0.7}
                    >
                      You're <Text style={{ fontWeight: '700' }}>{pointsNeeded} points away</Text> from the next tier!
                    </Text>
                  );
                })()}
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};
