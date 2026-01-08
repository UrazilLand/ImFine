import { brand } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

/**
 * 마이페이지 화면
 * 
 * - 로그인 상태: 포인트, 설정 등 표시
 * - 비로그인 상태: 로그인 유도
 */
export default function MyPageScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleLogin = () => {
    router.push('/(auth)/login');
  };

  const handleLogout = async () => {
    await signOut();
  };

  if (!user) {
    // 비로그인 상태
    return (
      <View style={styles.container}>
        <View style={styles.guestContainer}>
          <FontAwesome name="user-circle-o" size={80} color="#555" />
          <Text style={styles.guestTitle}>로그인이 필요합니다</Text>
          <Text style={styles.guestSubtitle}>
            로그인하면 글 작성, 포인트 적립 등{'\n'}더 많은 기능을 이용할 수 있어요.
          </Text>
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>로그인 / 회원가입</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 로그인 상태
  return (
    <ScrollView style={styles.container}>
      {/* 프로필 섹션 */}
      <View style={styles.profileSection}>
        <View style={styles.profileIcon}>
          <FontAwesome name="user" size={32} color={brand.beige} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.nickname}>따뜻한 마음 {Math.floor(Math.random() * 1000)}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>
      </View>

      {/* 포인트 섹션 */}
      <View style={styles.pointSection}>
        <Text style={styles.pointLabel}>나의 마음 포인트</Text>
        <Text style={styles.pointValue}>100 P</Text>
        <View style={styles.pointButtons}>
          <TouchableOpacity style={styles.pointButton}>
            <Text style={styles.pointButtonText}>충전</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pointButton}>
            <Text style={styles.pointButtonText}>환전</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 메뉴 리스트 */}
      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem}>
          <FontAwesome name="heart" size={20} color={brand.orange} />
          <Text style={styles.menuText}>마음 보관함</Text>
          <FontAwesome name="chevron-right" size={16} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <FontAwesome name="history" size={20} color={brand.orange} />
          <Text style={styles.menuText}>활동 기록</Text>
          <FontAwesome name="chevron-right" size={16} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <FontAwesome name="cog" size={20} color={brand.orange} />
          <Text style={styles.menuText}>설정</Text>
          <FontAwesome name="chevron-right" size={16} color="#666" />
        </TouchableOpacity>
      </View>

      {/* 로그아웃 */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>로그아웃</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brand.charcoal,
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: brand.beige,
    marginTop: 24,
  },
  guestSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  loginButton: {
    backgroundColor: brand.orange,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 32,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#3D3D3D',
  },
  profileIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3D3D3D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 16,
  },
  nickname: {
    fontSize: 18,
    fontWeight: '600',
    color: brand.beige,
  },
  email: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  pointSection: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#3D3D3D',
  },
  pointLabel: {
    fontSize: 14,
    color: '#888',
  },
  pointValue: {
    fontSize: 32,
    fontWeight: '700',
    color: brand.orange,
    marginTop: 8,
  },
  pointButtons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  pointButton: {
    backgroundColor: '#3D3D3D',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  pointButtonText: {
    color: brand.beige,
    fontSize: 14,
  },
  menuSection: {
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3D3D3D',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: brand.beige,
    marginLeft: 16,
  },
  logoutButton: {
    margin: 24,
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#666',
  },
  logoutButtonText: {
    color: '#888',
    fontSize: 16,
  },
});
