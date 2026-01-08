import { brand } from '@/constants/Colors';
import { createHeartMessage } from '@/lib/heartboxService';
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

/**
 * 마음함 메시지 작성 화면
 */
export default function CreateHeartMessageScreen() {
    const router = useRouter();
    const [recipientName, setRecipientName] = useState('');
    const [recipientContact, setRecipientContact] = useState('');
    const [recipientRelation, setRecipientRelation] = useState('');
    const [content, setContent] = useState('');
    const [inactivityDays, setInactivityDays] = useState('30');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!recipientName.trim()) {
            Alert.alert('알림', '받는 분의 이름을 입력해주세요.');
            return;
        }
        if (!recipientContact.trim()) {
            Alert.alert('알림', '받는 분의 연락처를 입력해주세요.');
            return;
        }
        if (!content.trim()) {
            Alert.alert('알림', '메시지 내용을 입력해주세요.');
            return;
        }

        setLoading(true);
        const { message, error } = await createHeartMessage({
            recipient_name: recipientName.trim(),
            recipient_contact: recipientContact.trim(),
            recipient_relation: recipientRelation.trim() || undefined,
            content: content.trim(),
            inactivity_days: parseInt(inactivityDays) || 30,
        });

        if (error) {
            Alert.alert('오류', error);
            setLoading(false);
        } else {
            router.replace('/heartbox');
        }
    };

    const isValid = recipientName.trim() && recipientContact.trim() && content.trim();

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
                    <Text style={styles.headerTitle}>새 메시지</Text>
                    <TouchableOpacity
                        style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
                        onPress={handleSubmit}
                        disabled={loading || !isValid}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.submitBtnText}>저장</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.scrollView}>
                    {/* 받는 사람 정보 */}
                    <Text style={styles.sectionTitle}>받는 분</Text>

                    <View style={styles.inputRow}>
                        <Text style={styles.inputLabel}>이름 *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="받는 분의 이름"
                            placeholderTextColor="#888"
                            value={recipientName}
                            onChangeText={setRecipientName}
                        />
                    </View>

                    <View style={styles.inputRow}>
                        <Text style={styles.inputLabel}>연락처 *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="이메일 또는 전화번호"
                            placeholderTextColor="#888"
                            value={recipientContact}
                            onChangeText={setRecipientContact}
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputRow}>
                        <Text style={styles.inputLabel}>관계</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="예: 어머니, 친구, 연인"
                            placeholderTextColor="#888"
                            value={recipientRelation}
                            onChangeText={setRecipientRelation}
                        />
                    </View>

                    {/* 메시지 내용 */}
                    <Text style={styles.sectionTitle}>메시지 내용</Text>
                    <TextInput
                        style={styles.contentInput}
                        placeholder="소중한 분에게 전하고 싶은 말을 적어주세요..."
                        placeholderTextColor="#888"
                        value={content}
                        onChangeText={setContent}
                        multiline
                        textAlignVertical="top"
                    />

                    {/* 발송 조건 */}
                    <Text style={styles.sectionTitle}>발송 조건</Text>
                    <View style={styles.inactivityRow}>
                        <Text style={styles.inactivityLabel}>앱 미접속</Text>
                        <TextInput
                            style={styles.daysInput}
                            value={inactivityDays}
                            onChangeText={setInactivityDays}
                            keyboardType="number-pad"
                            maxLength={3}
                        />
                        <Text style={styles.inactivityLabel}>일 후 전송</Text>
                    </View>

                    <View style={styles.infoBox}>
                        <FontAwesome name="info-circle" size={14} color="#888" />
                        <Text style={styles.infoText}>
                            설정한 기간 동안 앱에 접속하지 않으면 메시지가 자동으로 전달됩니다.
                            앱에 접속하면 타이머가 초기화됩니다.
                        </Text>
                    </View>
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
        marginTop: 16,
        marginBottom: 12,
    },
    inputRow: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 13,
        color: '#888',
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#3D3D3D',
        borderRadius: 12,
        padding: 14,
        color: brand.beige,
        fontSize: 15,
    },
    contentInput: {
        backgroundColor: '#3D3D3D',
        borderRadius: 12,
        padding: 16,
        color: brand.beige,
        fontSize: 15,
        minHeight: 180,
        lineHeight: 24,
    },
    inactivityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3D3D3D',
        borderRadius: 12,
        padding: 14,
    },
    inactivityLabel: {
        fontSize: 15,
        color: brand.beige,
    },
    daysInput: {
        backgroundColor: '#2D2D2D',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginHorizontal: 10,
        color: brand.orange,
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        minWidth: 50,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 12,
        padding: 12,
        backgroundColor: '#2D2D2D',
        borderRadius: 12,
    },
    infoText: {
        flex: 1,
        marginLeft: 8,
        fontSize: 13,
        color: '#888',
        lineHeight: 18,
    },
});
