"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout, Spin, Alert, Modal, Button, Form, Input, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
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

interface UserData {
  first_name: string;
  last_name: string;
  email: string;
  school: string;
  speciality: string;
  course: number;
  telephone_number: string;
  kbtu_id?: string;
}

interface Student {
  user_id: number;
  username: string;
  role: string;
  user_data: UserData;
}

export default function Home() {
  const router = useRouter();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>("All");
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [form] = Form.useForm();

  useEffect(() => {
    // Получение данных FAQ
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

    // Проверка авторизации при загрузке страницы
    checkAuthStatus();
  }, []);

  // Функция для проверки авторизации пользователя
  const checkAuthStatus = () => {
    const storedUser = localStorage.getItem("student");
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Проверка валидности данных пользователя
        if (parsedUser && parsedUser.user_id && parsedUser.user_data) {
          setIsAuthenticated(true);
          setStudent(parsedUser);
        } else {
          setIsAuthenticated(false);
          setStudent(null);
        }
      } catch (e) {
        console.error("Failed to parse user data:", e);
        setIsAuthenticated(false);
        setStudent(null);
        localStorage.removeItem("student"); // Очистка некорректных данных
      }
    } else {
      setIsAuthenticated(false);
      setStudent(null);
    }
  };

  const handleAskQuestionClick = () => {
    // Повторная проверка авторизации на момент клика
    checkAuthStatus();
    
    // Проверяем авторизацию пользователя
    if (!isAuthenticated) {
      message.warning("You need to login first to ask a question");
      router.push("/login");
      return;
    }
    
    // Если пользователь авторизован, открываем модальное окно
    setIsQuestionModalOpen(true);
  };

  const handleSubmit = (values: { topic: string; description: string }) => {
    // Повторная проверка авторизации перед отправкой
    checkAuthStatus();
    
    if (!isAuthenticated || !student) {
      message.error("You must be logged in to submit a question!");
      router.push("/login");
      return;
    }

    const formData = new FormData();
    formData.append("topic", values.topic);
    formData.append("description", values.description);
    formData.append("kbtu_id", student.user_id.toString()); 
    formData.append("first_name", student.user_data.first_name);
    formData.append("last_name", student.user_data.last_name);
    formData.append("course", student.user_data.course.toString());

    // Здесь отправка запроса без токена
    axios
      .post("http://127.0.0.1:8000/api/faq-requests/create/", formData)
      .then(() => {
        message.success("Your question has been submitted to the managers!");
        setIsQuestionModalOpen(false);
        form.resetFields();
      })
      .catch((error) => {
        console.error("Error submitting question:", error);
        if (error.response?.status === 401) {
          message.error("Your session has expired. Please login again.");
          localStorage.removeItem("student");
          setIsAuthenticated(false);
          router.push("/login");
        } else {
          message.error("Failed to submit question: " + (error.response?.data?.message || "Unknown error"));
        }
      });
  };

  // Фильтрация FAQ по курсу
  const filteredFaqs = selectedCourse === "All"
    ? faqs
    : faqs.filter(faq =>
        selectedCourse === "5-7" ? faq.course >= 5 : faq.course === Number(selectedCourse)
      );

  return (
    <Layout className="min-h-screen">
      <HeaderSection />
      <SearchSection />

      {/* Course filter */}
      <section className="text-center py-6 border-b">
        <div className="flex justify-center gap-4 flex-wrap">
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

      <Content className="p-6 max-w-4xl mx-auto w-full">
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
              onClick={() => setSelectedFAQ(faq)}
              className="p-4 border rounded-lg my-2 cursor-pointer hover:bg-gray-100 transition-all duration-200"
            >
              <strong>{faq.question}</strong>
              <p className="text-gray-600 truncate">{faq.answer}</p>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No FAQs found.</p>
        )}
      </Content>

      <div className="text-center my-6">
        <Button
          type="primary"
          className="bg-blue-900 hover:bg-blue-700"
          onClick={handleAskQuestionClick}
        >
          Ask a question
        </Button>
      </div>

      <Modal
        title={selectedFAQ?.question}
        open={!!selectedFAQ}
        onCancel={() => setSelectedFAQ(null)}
        footer={null}
      >
        <p>{selectedFAQ?.answer}</p>
      </Modal>

      <Modal
        title="Ask the Dean's Office a Question"
        open={isQuestionModalOpen}
        onCancel={() => setIsQuestionModalOpen(false)}
        footer={null}
      >
        {student && (
          <div className="mb-4 p-2 border rounded">
            <p><strong>KBTU ID:</strong> {student.user_id}</p>
            <p><strong>Full Name:</strong> {student.user_data.last_name} {student.user_data.first_name}</p>
            <p><strong>Course:</strong> {student.user_data.course}</p>
          </div>
        )}

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Topic"
            name="topic"
            rules={[{ required: true, message: "Please enter a topic!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: "Please enter a description!" }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            className="w-full bg-blue-900 hover:bg-blue-700"
          >
            Submit Question
          </Button>
        </Form>
      </Modal>

      <Footer />
    </Layout>
  );
}