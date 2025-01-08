import React, { useState } from "react";
import './CheckpointPredictor.css';
import { Prediction_API_Base_URl } from "../config";

const Predictor: React.FC = () => {
  const [hour, setHour] = useState<number>(0);
  const [day, setDay] = useState<string>("0");
  const [checkpoint, setCheckpoint] = useState<string>("checkpoint_17 عصيرة");
  const [result, setResult] = useState<any>(null);

  const arabicWeekDays = [
    "الاثنين",
    "الثلاثاء",
    "الأربعاء",
    "الخميس",
    "الجمعة",
    "السبت",
    "الأحد",
  ];

  const checkpoints = [
    "checkpoint_17 عصيرة",
    "checkpoint_DCO",
    "checkpoint_الباذان",
    "checkpoint_الحمرا",
    "checkpoint_الغرس بزاريا",
    "checkpoint_المربعة",
    "checkpoint_بزاريا",
    "checkpoint_بوابة النبي صالح",
    "checkpoint_بوابة بورين",
    "checkpoint_بوابة جماعين",
    "checkpoint_بوابة دير ابو مشعل",
    "checkpoint_بوابة عابود",
    "checkpoint_بوابة عقربا",
    "checkpoint_بيت ايل",
    "checkpoint_بيت فوريك",
    "checkpoint_ترمسعيا",
    "checkpoint_جسر اودلا",
    "checkpoint_جلزون",
    "checkpoint_جيت",
    "checkpoint_دير بلوط",
    "checkpoint_دير شرف",
    "checkpoint_روابي",
    "checkpoint_زعترة",
    "checkpoint_سنجل",
    "checkpoint_شافي شمرون",
    "checkpoint_صرة",
    "checkpoint_طنيب",
    "checkpoint_عطارة",
    "checkpoint_عورتا",
    "checkpoint_عوفرا",
    "checkpoint_عيلي",
    "checkpoint_عين سينيا",
    "checkpoint_عيون الحرامية",
    "checkpoint_كرملو",
    "checkpoint_مخماس",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dayInEnglish = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][parseInt(day)];

    const requestBody = {
      checkpoint,
      day_of_week: dayInEnglish,
      hour,
    };

    try {
      const response = await fetch(`${Prediction_API_Base_URl}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error fetching prediction:", error);
    }
  };

  return (
    <div className="Predictor">
      <h2>تنبؤ حالة الحاجز</h2>
      <form onSubmit={handleSubmit}>
        <label>
          الساعة
          <input
            style={{maxWidth: "95%"}}
            type="number"
            value={hour}
            min="0"
            max="23"
            onChange={(e) => setHour(Number(e.target.value))}
            required
          />
        </label>

        <label>
          اليوم
          <select value={day} onChange={(e) => setDay(e.target.value)} required>
            {arabicWeekDays.map((dayName, index) => (
              <option key={index} value={index}>
                {dayName}
              </option>
            ))}
          </select>
        </label>

        <label>
          الحاجز
          <select value={checkpoint} onChange={(e) => setCheckpoint(e.target.value)} required>
            {checkpoints.map((cp, index) => (
              <option key={index} value={cp}>
                {cp.replace("checkpoint_", "")}
              </option>
            ))}
          </select>
        </label>

        <button type="submit">تنبؤ</button>
      </form>

      {result && (
        <div className="output">
          <h3>النتيجة</h3>
          <p>
            <strong>الحالة المتوقعة:</strong> {result.predicted_status === "Open" ? "مفتوح" : "أزمة"}
          </p>
          <p>
            <strong>الاحتمالات:</strong>
          </p>
          <ul>
            <li>مفتوح: {result.probabilities.Open.toFixed(2)}</li>
            <li>أزمة: {result.probabilities.Traffic.toFixed(2)}</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Predictor;
