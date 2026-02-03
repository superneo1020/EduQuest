import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import axios from 'axios';

const AppliedMath = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ question: '', options: [] as string[], answer: '' });
    const [userAnswer, setUserAnswer] = useState('');
    const [score, setScore] = useState(0);

    // 1. 向 Python 拿 AI 題目
    const fetchQuestion = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:8000/api/math/generate');
            setData(res.data);
        } catch (e) {
            console.error("無法生成題目");
        }
        setLoading(false);
    };

    useEffect(() => { fetchQuestion(); }, []);

    // 2. 檢查答案
    const handleCheckAnswer = async () => {
        if (userAnswer.trim() === data.answer.trim()) {
            Alert.alert("答對了！", "獲得 10 積分");
            setScore(score + 10);

            // 3. 呼叫 Spring Boot 計分 API
            await axios.post('http://localhost:8080/api/score/add', {
                userId: "current_user_id",
                points: 10
            });

            setUserAnswer('');
            fetchQuestion(); // 自動下一題
        } else {
            Alert.alert("再試試看！");
        }
    };

    return (
        <View style={{ padding: 20 }}>
            <Text>當前積分: {score}</Text>
            {loading ? (
                <Text>AI 正在出題中...</Text>
            ) : (
                <View>
                    <Text style={{ fontSize: 20, marginVertical: 20 }}>{data.question}</Text>
                    <TextInput
                        placeholder="輸入答案"
                        keyboardType="numeric"
                        value={userAnswer}
                        onChangeText={setUserAnswer}
                        style={{ borderBottomWidth: 1, marginBottom: 20 }}
                    />
                    <Button title="提交答案" onPress={handleCheckAnswer} />
                </View>
            )}
        </View>
    );
};

export default AppliedMath;