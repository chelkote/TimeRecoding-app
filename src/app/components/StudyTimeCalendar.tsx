"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Supabase設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 型定義
interface StudyTime {
  hours: number;
  minutes: number;
  content?: string;
}

interface StudyRecord {
  id?: number;
  date: string;
  hours: number;
  minutes: number;
  content?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface DayData {
  date: Date;
  isCurrentMonth: boolean;
}

interface TimeCalculation {
  hours: number;
  minutes: number;
}

type StudyDataRecord = Record<string, StudyTime>;

export default function StudyTimeCalendar() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingDate, setEditingDate] = useState<Date | null>(null);
  const [studyHours, setStudyHours] = useState<string>("");
  const [studyMinutes, setStudyMinutes] = useState<string>("");
  const [studyContent, setStudyContent] = useState<string>("");
  const [studyData, setStudyData] = useState<StudyDataRecord>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = "学習時間記録カレンダー";
    }
  }, []);

  // Supabaseからデータを読み込み
  const loadDataFromSupabase = async (): Promise<void> => {
    try {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("study_records")
        .select("*")
        .order("date", { ascending: true });

      if (error) {
        throw error;
      }

      if (data) {
        const formattedData: StudyDataRecord = {};
        data.forEach((record: StudyRecord) => {
          formattedData[record.date] = {
            hours: record.hours,
            minutes: record.minutes,
            content: record.content || "",
          };
        });
        setStudyData(formattedData);
      }
    } catch (error: unknown) {
      console.error("データの読み込みに失敗しました:", error);
      if (error instanceof Error) {
        setError(`データの読み込みに失敗しました: ${error.message}`);
      } else {
        setError("データの読み込みに失敗しました");
      }
      loadDataFromStorage();
    } finally {
      setLoading(false);
    }
  };

  // Supabaseにデータを保存
  const saveDataToSupabase = async (
    date: string,
    studyTime: StudyTime
  ): Promise<void> => {
    try {
      setError("");

      const record: Omit<StudyRecord, "id" | "created_at" | "updated_at"> = {
        date,
        hours: studyTime.hours,
        minutes: studyTime.minutes,
        content: studyTime.content || undefined,
      };

      const { error } = await supabase.from("study_records").upsert(record, {
        onConflict: "date",
        ignoreDuplicates: false,
      });

      if (error) {
        throw error;
      }
    } catch (error: unknown) {
      console.error("データの保存に失敗しました:", error);
      if (error instanceof Error) {
        setError(`データの保存に失敗しました: ${error.message}`);
      } else {
        setError("データの保存に失敗しました");
      }
      // フォールバック：localStorage に保存
      saveDataToStorage({ ...studyData, [date]: studyTime });
      throw error;
    }
  };

  // Supabaseからデータを削除
  const deleteDataFromSupabase = async (date: string): Promise<void> => {
    try {
      setError("");

      const { error } = await supabase
        .from("study_records")
        .delete()
        .eq("date", date);

      if (error) {
        throw error;
      }
    } catch (error: unknown) {
      console.error("データの削除に失敗しました:", error);
      if (error instanceof Error) {
        setError(`データの削除に失敗しました: ${error.message}`);
      } else {
        setError("データの削除に失敗しました");
      }
      throw error;
    }
  };

  // localStorage用のフォールバック関数
  const STORAGE_KEY: string = "study-time-data";

  const loadDataFromStorage = (): void => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const savedData: string | null = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const parsedData: StudyDataRecord = JSON.parse(savedData);
          setStudyData(parsedData);
        }
      }
    } catch (error) {
      console.error("ローカルストレージからの読み込みに失敗しました:", error);
    }
  };

  const saveDataToStorage = (data: StudyDataRecord): void => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.error("ローカルストレージへの保存に失敗しました:", error);
    }
  };

  useEffect(() => {
    loadDataFromSupabase();
  }, []);

  const months: string[] = [
    "1月",
    "2月",
    "3月",
    "4月",
    "5月",
    "6月",
    "7月",
    "8月",
    "9月",
    "10月",
    "11月",
    "12月",
  ];
  const weekDays: string[] = ["日", "月", "火", "水", "木", "金", "土"];

  const getDaysInMonth = (date: Date): DayData[] => {
    const year: number = date.getFullYear();
    const month: number = date.getMonth();
    const firstDay: Date = new Date(year, month, 1);
    const lastDay: Date = new Date(year, month + 1, 0);
    const daysInMonth: number = lastDay.getDate();
    const startingDayOfWeek: number = firstDay.getDay();

    const days: DayData[] = [];

    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate: Date = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true });
    }

    const remainingDays: number = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const formatDateKey = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  const getStudyTimeForDate = (date: Date): StudyTime | null => {
    const key: string = formatDateKey(date);
    return studyData[key] || null;
  };

  const calculateMonthlyTotal = (): TimeCalculation => {
    const currentMonth: number = currentDate.getMonth();
    const currentYear: number = currentDate.getFullYear();
    let totalMinutes: number = 0;

    if (studyData) {
      Object.entries(studyData).forEach(
        ([dateKey, time]: [string, StudyTime]) => {
          if (time && time.hours !== undefined && time.minutes !== undefined) {
            const date: Date = new Date(dateKey);
            if (
              date.getMonth() === currentMonth &&
              date.getFullYear() === currentYear
            ) {
              totalMinutes += time.hours * 60 + time.minutes;
            }
          }
        }
      );
    }

    const hours: number = Math.floor(totalMinutes / 60);
    const minutes: number = totalMinutes % 60;
    return { hours, minutes };
  };

  const calculateYearlyTotal = (): TimeCalculation => {
    const currentYear: number = currentDate.getFullYear();
    let totalMinutes: number = 0;

    if (studyData) {
      Object.entries(studyData).forEach(
        ([dateKey, time]: [string, StudyTime]) => {
          if (time && time.hours !== undefined && time.minutes !== undefined) {
            const date: Date = new Date(dateKey);
            if (date.getFullYear() === currentYear) {
              totalMinutes += time.hours * 60 + time.minutes;
            }
          }
        }
      );
    }

    const hours: number = Math.floor(totalMinutes / 60);
    const minutes: number = totalMinutes % 60;
    return { hours, minutes };
  };

  const calculateTotalTime = (): TimeCalculation => {
    let totalMinutes: number = 0;

    if (studyData) {
      Object.values(studyData).forEach((time: StudyTime) => {
        if (time && time.hours !== undefined && time.minutes !== undefined) {
          totalMinutes += time.hours * 60 + time.minutes;
        }
      });
    }

    const hours: number = Math.floor(totalMinutes / 60);
    const minutes: number = totalMinutes % 60;
    return { hours, minutes };
  };

  const navigateMonth = (direction: number): void => {
    const newDate: Date = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const handleDateClick = (day: DayData): void => {
    if (day.isCurrentMonth) {
      const existingData: StudyTime | null = getStudyTimeForDate(day.date);

      if (existingData) {
        setEditingDate(day.date);
        setStudyHours(existingData.hours.toString());
        setStudyMinutes(existingData.minutes.toString());
        setStudyContent(existingData.content || "");
        setShowEditModal(true);
      } else {
        setSelectedDate(day.date);
        setStudyHours("");
        setStudyMinutes("");
        setStudyContent("");
        setShowAddModal(true);
      }
    }
  };

  const handleAddStudyTime = async (): Promise<void> => {
    if (selectedDate && (studyHours || studyMinutes)) {
      const key: string = formatDateKey(selectedDate);
      const hours: number = parseInt(studyHours) || 0;
      const minutes: number = parseInt(studyMinutes) || 0;
      const content: string = studyContent.trim();

      const newStudyTime: StudyTime = { hours, minutes, content };

      try {
        await saveDataToSupabase(key, newStudyTime);

        setStudyData((prev: StudyDataRecord) => ({
          ...prev,
          [key]: newStudyTime,
        }));

        setShowAddModal(false);
        setStudyHours("");
        setStudyMinutes("");
        setStudyContent("");
        setSelectedDate(null);
      } catch (error) {
        // エラーは既にsetErrorで設定されている
        console.error("Error:", error);
      }
    }
  };

  const handleUpdateStudyTime = async (): Promise<void> => {
    if (editingDate && (studyHours || studyMinutes)) {
      const key: string = formatDateKey(editingDate);
      const hours: number = parseInt(studyHours) || 0;
      const minutes: number = parseInt(studyMinutes) || 0;
      const content: string = studyContent.trim();

      const updatedStudyTime: StudyTime = { hours, minutes, content };

      try {
        await saveDataToSupabase(key, updatedStudyTime);

        setStudyData((prev: StudyDataRecord) => ({
          ...prev,
          [key]: updatedStudyTime,
        }));

        closeEditModal();
      } catch (error) {
        // エラーは既にsetErrorで設定されている
        console.error("Error:", error);
      }
    }
  };

  const handleDeleteStudyTime = async (): Promise<void> => {
    if (editingDate) {
      const key: string = formatDateKey(editingDate);

      try {
        await deleteDataFromSupabase(key);

        setStudyData((prev: StudyDataRecord) => {
          const newData: StudyDataRecord = { ...prev };
          delete newData[key];
          return newData;
        });

        closeEditModal();
      } catch (error) {
        // エラーは既にsetErrorで設定されている
        console.error("Error:", error);
      }
    }
  };

  const closeEditModal = (): void => {
    setShowEditModal(false);
    setEditingDate(null);
    setStudyHours("");
    setStudyMinutes("");
    setStudyContent("");
  };

  const days: DayData[] = getDaysInMonth(currentDate);
  const monthlyTotal: TimeCalculation = calculateMonthlyTotal();
  const yearlyTotal: TimeCalculation = calculateYearlyTotal();
  const totalTime: TimeCalculation = calculateTotalTime();

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 bg-black min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">データを読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-black min-h-screen">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-black rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            📚 学習時間記録カレンダー
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-full text-blue-600 text-xl">
              ⏰
            </div>
            <div>
              <p className="text-sm text-indigo-600 font-medium">
                今月の学習時間
              </p>
              <p className="text-2xl font-bold text-indigo-600">
                {monthlyTotal.hours}時間{monthlyTotal.minutes}分
              </p>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-full text-purple-600 text-xl">
              🎯
            </div>
            <div>
              <p className="text-sm text-violet-600 font-medium">
                今年の学習時間
              </p>
              <p className="text-2xl font-bold text-violet-600">
                {yearlyTotal.hours}時間{yearlyTotal.minutes}分
              </p>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-full text-green-600 text-xl">
              📊
            </div>
            <div>
              <p className="text-sm text-lime-600 font-medium">総学習時間</p>
              <p className="text-2xl font-bold text-lime-600">
                {totalTime.hours}時間{totalTime.minutes}分
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-black rounded-lg shadow-sm">
        <div className="flex items-center justify-between p-6 border-b-2 border-white">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-500 rounded-full transition-all duration-200 cursor-pointer hover:opacity-70 text-white text-xl"
          >
            ‹
          </button>

          <h2 className="text-xl font-semibold text-white">
            {currentDate.getFullYear()}年 {months[currentDate.getMonth()]}
          </h2>

          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-500 rounded-full transition-all duration-200 cursor-pointer hover:opacity-70 text-white text-xl"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 border-b-2 border-white">
          {weekDays.map((day, index) => (
            <div
              key={day}
              className={`p-4 text-center font-bold ${
                index === 0
                  ? "text-red-500"
                  : index === 6
                  ? "text-blue-500"
                  : "text-white"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 border-l-2 border-white text-white">
          {days.map((day: DayData, index: number) => {
            const studyTime: StudyTime | null = getStudyTimeForDate(day.date);
            const isToday: boolean =
              day.date.toDateString() === new Date().toDateString();

            return (
              <div
                key={index}
                className={`min-h-24 p-2 border-r-2 border-b-2 border-white cursor-pointer hover:bg-gray-600 transition-colors ${
                  !day.isCurrentMonth ? "bg-gray-600 text-white" : ""
                }`}
                onClick={() => handleDateClick(day)}
              >
                <div
                  className={`text-sm font-medium mb-1 ${
                    isToday
                      ? "bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center"
                      : ""
                  }`}
                >
                  {day.date.getDate()}
                </div>

                {studyTime && day.isCurrentMonth && (
                  <div className="space-y-1">
                    <div className="text-white text-xs px-2 py-1 text-center">
                      {studyTime.hours}h
                      {studyTime.minutes > 0 ? ` ${studyTime.minutes}m` : ""}
                    </div>
                    {studyTime.content && (
                      <div
                        className="text-gray-300 text-xs px-1 text-center truncate"
                        title={studyTime.content}
                      >
                        {studyTime.content}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                学習時間を編集
              </h3>
              <button
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              {editingDate &&
                editingDate.toLocaleDateString &&
                editingDate.toLocaleDateString("ja-JP")}
            </p>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    時間
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={studyHours}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setStudyHours(e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    分
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={studyMinutes}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setStudyMinutes(e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  学習内容
                </label>
                <input
                  type="text"
                  value={studyContent}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setStudyContent(e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例：数学の問題集、英単語暗記"
                  maxLength={30}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleDeleteStudyTime}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  🗑️ 削除
                </button>
                <button
                  onClick={closeEditModal}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleUpdateStudyTime}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  ✏️ 更新
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                学習時間を記録
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              {selectedDate &&
                selectedDate.toLocaleDateString &&
                selectedDate.toLocaleDateString("ja-JP")}
            </p>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    時間
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={studyHours}
                    onChange={(e) => setStudyHours(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    分
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={studyMinutes}
                    onChange={(e) => setStudyMinutes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  学習内容
                </label>
                <input
                  type="text"
                  value={studyContent}
                  onChange={(e) => setStudyContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例：数学の問題集、英単語暗記"
                  maxLength={30}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleAddStudyTime}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  ➕ 記録
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
