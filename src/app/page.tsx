import { Metadata } from "next";
import StudyTimeCalendar from "./components/StudyTimeCalendar";

export const metadata: Metadata = {
  title: "学習時間記録カレンダー",
  description: "毎日の学習時間を記録・管理するカレンダーアプリ",
};

export default function Page() {
  return <StudyTimeCalendar />;
}
