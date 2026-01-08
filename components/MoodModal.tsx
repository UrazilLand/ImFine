import { brand } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

// 10가지 감정 이모티콘 데이터
const MOOD_OPTIONS = [
    { key: 'HAPPY', emoji: '😊', label: '기쁨', color: '#FFD93D' },
    { key: 'EXCITED', emoji: '🤩', label: '신남', color: '#FF6B6B' },
    { key: 'PEACEFUL', emoji: '😌', label: '평온', color: '#6BCB77' },
    { key: 'GRATEFUL', emoji: '🥰', label: '감사', color: '#FF8C94' },
    { key: 'TIRED', emoji: '😩', label: '지침', color: '#A0C4E8' },
    { key: 'SAD', emoji: '😢', label: '슬픔', color: '#74B9FF' },
    { key: 'ANGRY', emoji: '😠', label: '화남', color: '#E74C3C' },
    { key: 'ANNOYED', emoji: '😤', label: '짜증', color: '#F39C12' },
    { key: 'ANXIOUS', emoji: '😰', label: '불안', color: '#9D65C9' },
    { key: 'LONELY', emoji: '🥺', label: '외로움', color: '#778BEB' },
];

interface MoodModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (mood: string, diary: string, isShared: boolean) => void;
}

/**
 * 오늘의 기분 기록 모달
 * 
 * - 10가지 감정 이모티콘 중 선택 (가로 스크롤)
 * - 한줄 일기 작성 (선택)
 * - 익명 피드 공유 토글 (로그인 시에만 활성화)
 */
export default function MoodModal({ visible, onClose, onSubmit }: MoodModalProps) {
    const { user } = useAuth();
    const [selectedMood, setSelectedMood] = useState<string | null>(null);
    const [diary, setDiary] = useState('');
    const [isShared, setIsShared] = useState(false);
    const scaleAnim = useState(new Animated.Value(0.9))[0];
    const opacityAnim = useState(new Animated.Value(0))[0];
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            scaleAnim.setValue(0.9);
            opacityAnim.setValue(0);
        }
    }, [visible]);

    const handleSubmit = () => {
        if (!selectedMood) return;
        onSubmit(selectedMood, diary, isShared && !!user);
        // 로컬에 오늘 기록 저장
        saveTodayMood(selectedMood);
        setSelectedMood(null);
        setDiary('');
        setIsShared(false);
    };

    const saveTodayMood = async (mood: string) => {
        const today = new Date().toISOString().split('T')[0];
        try {
            await AsyncStorage.setItem(`mood_${today}`, mood);
        } catch (e) {
            console.error('기분 저장 실패:', e);
        }
    };

    const handleSkip = () => {
        // 스킵해도 오늘 날짜 기록
        const today = new Date().toISOString().split('T')[0];
        AsyncStorage.setItem(`mood_skipped_${today}`, 'true');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <Animated.View
                    style={[
                        styles.container,
                        {
                            opacity: opacityAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    {/* 헤더 */}
                    <Text style={styles.title}>오늘의 기분은 어떠신가요?</Text>

                    {/* 스크롤 힌트 */}
                    <Text style={styles.scrollHint}>← 옆으로 밀어서 더 보기 →</Text>

                    {/* 감정 이모티콘 선택 - 가로 스크롤 */}
                    <ScrollView
                        ref={scrollViewRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.moodScrollContent}
                        style={styles.moodScrollView}
                    >
                        {MOOD_OPTIONS.map((mood) => (
                            <TouchableOpacity
                                key={mood.key}
                                style={[
                                    styles.moodButton,
                                    selectedMood === mood.key && {
                                        borderColor: mood.color,
                                        backgroundColor: `${mood.color}20`,
                                    },
                                ]}
                                onPress={() => setSelectedMood(mood.key)}
                            >
                                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                                <Text style={[
                                    styles.moodLabel,
                                    selectedMood === mood.key && { color: mood.color },
                                ]}>
                                    {mood.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* 한줄 일기 입력 */}
                    <TextInput
                        style={styles.diaryInput}
                        placeholder="지금 생각나는 말을 짧게 남겨보세요."
                        placeholderTextColor="#888"
                        value={diary}
                        onChangeText={setDiary}
                        multiline
                        maxLength={200}
                    />

                    {/* 익명 공유 토글 */}
                    <View style={styles.shareContainer}>
                        <View style={styles.shareTextContainer}>
                            <Text style={styles.shareLabel}>익명 피드에 공유하기</Text>
                            {!user && (
                                <Text style={styles.shareHint}>로그인 시 사용 가능</Text>
                            )}
                        </View>
                        <Switch
                            value={isShared}
                            onValueChange={setIsShared}
                            disabled={!user}
                            trackColor={{ false: '#3D3D3D', true: brand.orange }}
                            thumbColor={isShared ? '#fff' : '#888'}
                        />
                    </View>

                    {/* 버튼 영역 */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                            <Text style={styles.skipButtonText}>나중에</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                !selectedMood && styles.submitButtonDisabled,
                            ]}
                            onPress={handleSubmit}
                            disabled={!selectedMood}
                        >
                            <Text style={styles.submitButtonText}>저장하기</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: brand.charcoal,
        borderRadius: 24,
        padding: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: '600',
        color: brand.beige,
        textAlign: 'center',
        marginBottom: 8,
    },
    scrollHint: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginBottom: 16,
    },
    moodScrollView: {
        marginHorizontal: -24,
        marginBottom: 20,
    },
    moodScrollContent: {
        paddingHorizontal: 24,
        gap: 8,
    },
    moodButton: {
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'transparent',
        minWidth: 64,
    },
    moodEmoji: {
        fontSize: 36,
        marginBottom: 6,
    },
    moodLabel: {
        fontSize: 12,
        color: '#888',
        fontWeight: '500',
    },
    diaryInput: {
        backgroundColor: '#3D3D3D',
        borderRadius: 12,
        padding: 16,
        color: brand.beige,
        fontSize: 15,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 16,
    },
    shareContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        paddingHorizontal: 4,
    },
    shareTextContainer: {
        flex: 1,
    },
    shareLabel: {
        fontSize: 15,
        color: brand.beige,
    },
    shareHint: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    skipButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#3D3D3D',
        alignItems: 'center',
    },
    skipButtonText: {
        color: '#888',
        fontSize: 16,
        fontWeight: '500',
    },
    submitButton: {
        flex: 2,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: brand.orange,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
