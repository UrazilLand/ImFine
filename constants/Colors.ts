/**
 * ImFine 브랜드 색상 팔레트
 * 
 * 브랜드 스토리: "만약의 순간을 위한 준비, 오늘의 나를 위한 기록"
 * - 차콜(#2D2D2D): 깊이와 안정감
 * - 오렌지(#FF8C42): 따뜻한 에너지
 * - 베이지(#F5E6D3): 부드러운 포근함
 */

// 브랜드 주요 색상
export const brand = {
  charcoal: '#2D2D2D',
  orange: '#FF8C42',
  orangeLight: '#FFB380',
  beige: '#F5E6D3',
  cream: '#FFF8F0',
  gold: '#D4A574',      // 전문가 답변용
  softGold: '#F5DEB3',  // 전문가 카드 배경
} as const;

// 감정별 색상
export const moods = {
  veryHappy: '#FFD93D',  // 매우 좋음 - 밝은 노랑
  happy: '#6BCB77',       // 좋음 - 초록
  neutral: '#4D96FF',     // 보통 - 파랑
  sad: '#A0C4E8',         // 나쁨 - 연한 파랑
  verySad: '#9D65C9',     // 매우 나쁨 - 보라
} as const;

const tintColorLight = brand.orange;
const tintColorDark = brand.beige;

export default {
  light: {
    text: brand.charcoal,
    background: brand.cream,
    tint: tintColorLight,
    tabIconDefault: '#B0B0B0',
    tabIconSelected: tintColorLight,
    card: '#FFFFFF',
    border: '#E5E5E5',
  },
  dark: {
    text: brand.beige,
    background: brand.charcoal,
    tint: tintColorDark,
    tabIconDefault: '#666666',
    tabIconSelected: tintColorDark,
    card: '#3D3D3D',
    border: '#4D4D4D',
  },
};
