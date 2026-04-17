import "./global.css";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
};

const STORAGE_KEY = "@todos";

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const progress = total === 0 ? 0 : completed / total;
  const percent = Math.round(progress * 100);
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const barColor =
    percent === 100 ? "#22c55e" : percent >= 50 ? "#3b82f6" : "#6366f1";

  return (
    <View className="mb-6">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-sm font-medium text-gray-500">今日の進捗</Text>
        <Text className="text-sm font-semibold" style={{ color: barColor }}>
          {percent}%
        </Text>
      </View>
      <View className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <Animated.View
          className="h-full rounded-full"
          style={{
            backgroundColor: barColor,
            width: animatedWidth.interpolate({
              inputRange: [0, 1],
              outputRange: ["0%", "100%"],
            }),
          }}
        />
      </View>
      <Text className="text-xs text-gray-400 mt-1.5">
        {completed} / {total} タスク完了
      </Text>
    </View>
  );
}

function TodoItem({
  item,
  onToggle,
  onDelete,
}: {
  item: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Pressable
      onPress={() => onToggle(item.id)}
      className="flex-row items-center bg-white rounded-2xl px-4 py-4 mb-3 shadow-sm border border-gray-50 active:opacity-80"
    >
      <View
        className="w-8 h-8 rounded-full border-2 items-center justify-center mr-3 flex-shrink-0"
        style={{ borderColor: item.completed ? "#22c55e" : "#d1d5db" }}
      >
        {item.completed && (
          <View className="w-4 h-4 rounded-full bg-green-500" />
        )}
      </View>

      <Text
        className="flex-1 text-base leading-snug"
        style={{
          color: item.completed ? "#9ca3af" : "#1f2937",
          textDecorationLine: item.completed ? "line-through" : "none",
        }}
      >
        {item.text}
      </Text>

      <Pressable
        onPress={() => onDelete(item.id)}
        className="ml-2 w-8 h-8 rounded-full bg-gray-50 items-center justify-center"
        hitSlop={8}
      >
        <Text className="text-gray-400 text-sm font-bold">✕</Text>
      </Pressable>
    </Pressable>
  );
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setTodos(JSON.parse(raw));
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    }
  }, [todos, isLoaded]);

  function addTodo() {
    const text = inputText.trim();
    if (!text) return;
    setTodos((prev) => [
      {
        id: Date.now().toString(),
        text,
        completed: false,
        createdAt: Date.now(),
      },
      ...prev,
    ]);
    setInputText("");
  }

  function toggleTodo(id: string) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }

  function deleteTodo(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  function deleteCompleted() {
    setTodos((prev) => prev.filter((t) => !t.completed));
  }

  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-gray-50"
    >
      <StatusBar style="dark" />

      <View className="flex-1 pt-16 px-5">
        {/* Header */}
        <View className="mb-7">
          <Text className="text-3xl font-bold text-gray-900 tracking-tight">
            タスク
          </Text>
          <Text className="text-sm text-gray-400 mt-1">
            {new Date().toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "short",
            })}
          </Text>
        </View>

        {/* Progress Bar */}
        <ProgressBar completed={completedCount} total={todos.length} />

        {/* Bulk delete */}
        {completedCount > 0 && (
          <Pressable
            onPress={deleteCompleted}
            className="self-end mb-3 px-3 py-1.5 rounded-full bg-red-50 active:opacity-70"
          >
            <Text className="text-xs font-medium text-red-400">
              完了済みを削除（{completedCount}件）
            </Text>
          </Pressable>
        )}

        {/* Task List */}
        <FlatList
          data={todos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TodoItem item={item} onToggle={toggleTodo} onDelete={deleteTodo} />
          )}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Text className="text-4xl mb-3">📋</Text>
              <Text className="text-gray-400 text-sm">
                タスクがありません。追加しましょう！
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      </View>

      {/* Input Area */}
      <View className="px-5 pb-8 pt-3 bg-gray-50 border-t border-gray-100">
        <View className="flex-row items-center bg-white rounded-2xl border border-gray-100 shadow-sm px-4">
          <TextInput
            className="flex-1 py-4 text-base text-gray-900"
            placeholder="新しいタスクを追加..."
            placeholderTextColor="#9ca3af"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={addTodo}
            returnKeyType="done"
          />
          <Pressable
            onPress={addTodo}
            disabled={!inputText.trim()}
            className="ml-2 w-9 h-9 rounded-xl items-center justify-center"
            style={{ backgroundColor: inputText.trim() ? "#6366f1" : "#e5e7eb" }}
          >
            <Text className="text-white font-bold text-lg leading-none">+</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
