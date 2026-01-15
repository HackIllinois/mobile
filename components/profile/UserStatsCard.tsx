import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';

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
  const { width, height } = useWindowDimensions();

  const figmaWidth = 393;
  const figmaHeight = 852;
  const scaleWidth = (size: number) => (width / figmaWidth) * size;
  const scaleHeight = (size: number) => (height / figmaHeight) * size;
  const scaleFontSize = (size: number) => Math.min(scaleWidth(size), scaleHeight(size));

  return (
    <View style={{ flex: 1 }}>
      <Text style={{
        fontSize: scaleFontSize(18),
        fontWeight: '500',
        color: '#FFFFFF',
        letterSpacing: 0,
        marginBottom: 0,
        textAlign: 'left',
        marginLeft: scaleWidth(-4),
        marginTop: scaleWidth(-7.5),
        lineHeight: scaleHeight(22),
      }}>USER STATS</Text>

      <View style={{
        gap: scaleHeight(18),
        marginTop: scaleWidth(19),
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
            paddingTop: scaleHeight(5),
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
            paddingTop: scaleHeight(5),
          }}>{track}</Text>
        </View>

        <View style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 0,
          marginTop: scaleHeight(5),
          width: '100%',
        }}>
          <View style={{
            flexDirection: 'row',
            gap: scaleWidth(12.6),
            alignItems: 'flex-end',
          }}>
            <View style={{
              flex: 0,
              minWidth: scaleWidth(39.3),
              zIndex: 2,
            }}>
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
                backgroundColor: 'rgba(24, 1, 97, 0.8)',
                borderRadius: scaleWidth(6),
                paddingTop: scaleHeight(7),
                paddingBottom: scaleHeight(6),
                paddingHorizontal: scaleWidth(15),
                alignItems: 'center',
                marginTop: scaleHeight(3),
                width: scaleWidth(39.3),
                height: scaleWidth(39),
                justifyContent: 'center',
                zIndex: 2,
              }}>
                <Text style={{
                  fontSize: scaleFontSize(20),
                  fontWeight: '700',
                  color: '#FFF',
                  lineHeight: scaleHeight(20),
                  letterSpacing: 0,
                  fontFamily: 'Montserrat',
                }}>{foodWave || 1}</Text>
              </View>
            </View>

            <View style={{
              flex: 0,
              minWidth: scaleWidth(61.7),
              zIndex: 2,
            }}>
              <Text style={{
                fontSize: scaleFontSize(12),
                color: '#FFE0B4',
                fontWeight: '400',
                letterSpacing: 0,
                marginBottom: 0,
                marginTop: scaleHeight(-3),
                fontStyle: 'italic',
                lineHeight: scaleHeight(12),
              }}>RANK</Text>
              <View style={{
                backgroundColor: 'rgba(24, 1, 97, 0.8)',
                borderRadius: scaleWidth(20),
                paddingTop: scaleHeight(7),
                paddingBottom: scaleHeight(6),
                paddingHorizontal: scaleWidth(14),
                alignItems: 'center',
                marginTop: scaleHeight(3),
                width: scaleWidth(61.7),
                height: scaleWidth(39),
                justifyContent: 'center',
                zIndex: 2,
              }}>
                <Text style={{
                  fontSize: scaleFontSize(20),
                  fontWeight: '700',
                  color: '#FFF',
                  lineHeight: scaleHeight(20),
                  letterSpacing: 0,
                  fontFamily: 'Montserrat',
                }}>{rank}</Text>
              </View>
            </View>
          </View>

          <View style={{
            backgroundColor: 'rgba(79, 23, 135, 0.5)',
            borderRadius: scaleWidth(20),
            flex: 1,
            marginTop: scaleHeight(3),
            marginLeft: scaleWidth(-60),
            justifyContent: 'center',
            minWidth: scaleWidth(217),
            height: scaleWidth(39),
            paddingLeft: scaleWidth(65),
            paddingRight: scaleWidth(10),
            paddingVertical: scaleWidth(5),
            zIndex: 0,
          }}>
            <Text
              style={{
                fontSize: scaleWidth(11),
                fontWeight: '400',
                color: '#FFF',
                fontStyle: 'italic',
                textAlign: 'left',
                lineHeight: scaleWidth(13),
                letterSpacing: 0,
                flexShrink: 1,
              }}
              numberOfLines={2}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.7}
            >
              You're {pointsToNextRank} points away from the next rank!
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};
