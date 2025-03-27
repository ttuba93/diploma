"use client";

import { useEffect, useState } from "react";
import { Layout, Spin, Alert, Input } from "antd";
import HeaderSection from "./components/Header";
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
  const [searchQuery, setSearchQuery] = useState<string>("");

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

  // Фильтрация по курсу
  const filteredByCourse =
    selectedCourse === "All"
      ? faqs
      : faqs.filter((faq) => faq.course.toString() === selectedCourse);

  // Фильтрация по поисковому запросу
  const filteredFaqs = filteredByCourse.filter((faq) =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout className="min-h-screen">
      <HeaderSection />

      {/* Поле поиска */}
      <div className="max-w-4xl mx-auto mt-6 px-4">
        <Input
          placeholder="Search FAQ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full py-2 border border-gray-300 rounded-md"
        />
      </div>

      {/* Фильтр категорий */}
      <section className="text-center py-6 border-b">
        <div className="flex justify-center gap-4">
          {["All", "1", "2", "3", "4", "5-7"].map((course) => (
            <button
              key={course}
              onClick={() => setSelectedCourse(course)}
              className={`px-4 py-2 border-b-2 transition-all duration-200 ${
                selectedCourse === course
                  ? "border-[#002D62] font-bold text-[#002D62]"
                  : "text-gray-500 hover:text-[#002D62] hover:border-gray-400"
              }`}
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
            <div
              key={faq.id}
              className="p-4 border rounded-lg my-2 cursor-pointer hover:bg-gray-100 transition-all duration-200"
            >
              <strong>{faq.question}</strong>
              <p className="text-gray-600">{faq.answer}</p>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No FAQs found.</p>
        )}
      </Content>

      <Footer />
    </Layout>
  );
}
