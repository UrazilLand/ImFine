import { brand } from '@/constants/Colors';
import { createPost } from '@/lib/feedService';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 감정 옵션
const MOOD_OPTIONS = [
    { key: 'HAPPY', emoji: '😊', label: '기쁨' },
    { key: 'EXCITED', emoji: '🤩', label: '신남' },
    { key: 'PEACEFUL', emoji: '😌', label: '평온' },
    { key: 'GRATEFUL', emoji: '🥰', label: '감사' },
    { key: 'TIRED', emoji: '😩', label: '지침' },
    { key: 'SAD', emoji: '😢', label: '슬픔' },
    { key: 'ANGRY', emoji: '😠', label: '화남' },
    { key: 'ANNOYED', emoji: '😤', label: '짜증' },
    { key: 'ANXIOUS', emoji: '😰', label: '불안' },
    { key: 'LONELY', emoji: '🥺', label: '외로움' },
];

/**
 * 글 작성 화면
 */
export default function CreatePostScreen() {
    const router = useRouter();
    const [selectedMood, setSelectedMood] = useState<string | null>(null);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!selectedMood) {
            Alert.alert('알림', '오늘의 기분을 선택해주세요.');
            return;
        }
        if (!content.trim()) {
            Alert.alert('알림', '내용을 입력해주세요.');
            return;
        }

        setLoading(true);
        try {
            const { post, error } = await createPost({
                mood_tag: selectedMood,
                content: content.trim(),
                is_shared: true,
            });

            if (error) {
                Alert.alert('오류', error.message);
                setLoading(false);
            } else {
                // 성공 시 바로 피드로 이동
                router.replace('/(tabs)');
            }
        } catch (e) {
            Alert.alert('오류', '네트워크 오류가 발생했습니다.');
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* 헤더 */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <FontAwesome name="times" size={24} color={brand.beige} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>새 글 작성</Text>
                    <TouchableOpacity
                        style={[styles.submitBtn, (!selectedMood || !content.trim()) && styles.submitBtnDisabled]}
                        onPress={handleSubmit}
                        disabled={loading || !selectedMood || !content.trim()}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.submitBtnText}>등록</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.scrollView}>
                    {/* 감정 선택 */}
                    <Text style={styles.sectionTitle}>오늘의 기분</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.moodContainer}
                    >
                        {MOOD_OPTIONS.map((mood) => (
                            <TouchableOpacity
                                key={mood.key}
                                style={[
                                    styles.moodButton,
                                    selectedMood === mood.key && styles.moodButtonSelected,
                                ]}
                                onPress={() => setSelectedMood(mood.key)}
                            >
                                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                                <Text style={[
                                    styles.moodLabel,
                                    selectedMood === mood.key && styles.moodLabelSelected,
                                ]}>
                                    {mood.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* 내용 입력 */}
                    <Text style={styles.sectionTitle}>하고 싶은 말</Text>
                    <TextInput
                        style={styles.contentInput}
                        placeholder="오늘 느낀 감정이나 생각을 자유롭게 적어보세요..."
                        placeholderTextColor="#888"
                        value={content}
                        onChangeText={setContent}
                        multiline
                        maxLength={500}
                        textAlignVertical="top"
                    />
                    <Text style={styles.charCount}>{content.length}/500</Text>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: brand.charcoal,
    },
    keyboardView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#3D3D3D',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: brand.beige,
    },
    submitBtn: {
        backgroundColor: brand.orange,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    submitBtnDisabled: {
        opacity: 0.5,
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: brand.beige,
        marginBottom: 12,
        marginTop: 8,
    },
    moodContainer: {
        paddingBottom: 16,
        gap: 8,
    },
    moodButton: {
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'transparent',
        backgroundColor: '#3D3D3D',
        minWidth: 64,
    },
    moodButtonSelected: {
        borderColor: brand.orange,
        backgroundColor: `${brand.orange}20`,
    },
    moodEmoji: {
        fontSize: 32,
        marginBottom: 4,
    },
    moodLabel: {
        fontSize: 12,
        color: '#888',
    },
    moodLabelSelected: {
        color: brand.orange,
        fontWeight: '600',
    },
    contentInput: {
        backgroundColor: '#3D3D3D',
        borderRadius: 12,
        padding: 16,
        color: brand.beige,
        fontSize: 16,
        minHeight: 200,
        lineHeight: 24,
    },
    charCount: {
        fontSize: 12,
        color: '#888',
        textAlign: 'right',
        marginTop: 8,
    },
});
