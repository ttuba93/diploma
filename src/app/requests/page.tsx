"use client";

import { useEffect, useState } from "react";
import { Layout, Spin, Alert, Modal, Button, Form, Input, Upload, message, Steps } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import HeaderSection from "../components/Header";
import SearchSection from "../components/SearchSection";
import { Footer } from "../components/Footer";
import axios from "axios";

const { Content } = Layout;
const API_BASE_URL = "http://localhost:8000/api";

interface FAQ {
  id: number;
  question: string;
  answer: string;
  course: number;
}

const processSteps = [
  "Запрос отправлен",
  "Ожидание загрузки документа",
  "Документы отправлены",
  "Ожидание проверки декана",
  "Документы отклонены",
  "Документы приняты",
  "Получена обратная связь",
];

export default function Home() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState<boolean>(false);
  const [processId, setProcessId] = useState<string | null>(localStorage.getItem("processId"));
  const [currentStep, setCurrentStep] = useState(Number(localStorage.getItem("currentStep")) || 0);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/faq/")
      .then((res) => {
        setFaqs(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch FAQs.");
        setLoading(false);
      });
  }, []);

  return (
    <Layout className="min-h-screen">
      <HeaderSection />
      <SearchSection />

      <section className="text-center py-6 border-b">
        <div className="flex justify-center gap-4 flex-wrap">
          {["All", "1", "2", "3", "4", "5-7"].map((course) => (
            <button
              key={course}
              onClick={() => setSelectedCourse(course)}
              className={`px-4 py-2 border-b-2 transition-all duration-200 ${selectedCourse === course ? "border-[#002D62] font-bold text-[#002D62]" : "text-gray-500 hover:text-[#002D62] hover:border-gray-400"}`}
            >
              {course === "All" ? "All" : `${course} course`}
            </button>
          ))}
        </div>
      </section>

      <Content className="p-6 max-w-6xl mx-auto">
        {loading ? (
          <div className="flex justify-center">
            <Spin size="large" />
          </div>
        ) : error ? (
          <Alert message="Error" description={error} type="error" showIcon />
        ) : (
          <div className="w-full">
            {faqs.length > 0 ? (
              faqs.map((faq) => (
                <div
                  key={faq.id}
                  onClick={() => setSelectedFAQ(faq)}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-gray-100 transition-all duration-200 bg-white shadow-md max-w-full sm:max-w-lg mx-auto"
                >
                  <strong>{faq.question}</strong>
                  <p className="text-gray-600 truncate">{faq.answer}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">No FAQs found.</p>
            )}
          </div>
        )}
      </Content>

      <Footer />
    </Layout>
  );
}
