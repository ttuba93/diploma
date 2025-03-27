"use client";

import { useEffect, useState } from "react";
import { Layout, Spin, Alert } from "antd";
import HeaderSection from "./components/Header";
import SearchSection from "./components/SearchSection";
import { Footer } from "./components/Footer";
import axios from "axios";

const { Content } = Layout;

interface FAQ {
  id: number;
  question: string;
  answer: string;
  course: number;
}

export default function Home() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>("All");

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/faq/")
      .then((res) => {
        setFaqs(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch FAQs.");
        setLoading(false);
      });
  }, []);

  // Фильтруем вопросы по выбранному курсу
  const filteredFaqs = selectedCourse === "All" 
    ? faqs 
    : faqs.filter((faq) => faq.course.toString() === selectedCourse);

  return (
    <Layout className="min-h-screen">
      <HeaderSection />
      <SearchSection />

      {/* Фильтр категорий */}
      <section className="text-center py-6 border-b">
        <div className="flex justify-center gap-4">
          {["All", "1", "2", "3", "4", "5-7"].map((course) => (
            <button
              key={course}
              onClick={() => setSelectedCourse(course)}
              className={`px-4 py-2 border-b-2 ${selectedCourse === course ? "border-blue-500 font-bold" : "hover:border-gray-300"}`}
            >
              {course === "All" ? "All" : `${course} course`}
            </button>
          ))}
        </div>
      </section>

      {/* Вопросы и ответы */}
      <Content className="p-6 max-w-4xl mx-auto">
        {loading ? (
          <div className="flex justify-center">
            <Spin size="large" />
          </div>
        ) : error ? (
          <Alert message="Error" description={error} type="error" showIcon />
        ) : filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq) => (
            <div key={faq.id} className="p-4 border rounded-lg my-2 cursor-pointer hover:bg-gray-100">
              <strong>{faq.question}</strong>
              <p className="text-gray-600">{faq.answer}</p>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No FAQs available for this course.</p>
        )}
      </Content>

      <Footer />
    </Layout>
  );
}
