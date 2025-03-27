"use client";

import { useEffect, useState } from "react";
import { Footer } from "../components/Footer";
import HeaderSection from "../components/Header";

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  school: string;
  speciality: string;
  course: number;
}

export default function StudentProfile() {
  const [student, setStudent] = useState<Student | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/students/1/") // Укажи ID студента
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch");
        }
        return res.json();
      })
      .then((data: Student) => setStudent(data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="error">Ошибка: {error}</div>;
  if (!student) return <div>Загрузка...</div>;

  return (
    <div className="profile-container">
        <HeaderSection />
        <h1>Профиль студента</h1>
        <p>Имя: {student.first_name} {student.last_name}</p>
        <p>Email: {student.email}</p>
        <p>Школа: {student.school}</p>
        <p>Специальность: {student.speciality}</p>
        <p>Курс: {student.course}</p>
        <Footer/>
    </div>
  );
}
