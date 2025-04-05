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
  const [form] = Form.useForm();

  // Эта функция будет выполняться при каждом рендере компонента
  // для отладки данных пользователя
  useEffect(() => {
    console.log("Current student state:", student);
    console.log("localStorage student:", localStorage.getItem("student"));
  }, [student]);

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

    // ВАЖНО: Сначала выводим в консоль все, что есть в localStorage
    console.log("All localStorage items:");
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        console.log(`${key}: ${localStorage.getItem(key)}`);
      }
    }

    // Получение данных пользователя из localStorage
    loadUserData();

    // Добавляем обработчик для события storage, чтобы обновлять данные
    // когда они изменяются в другой вкладке
    window.addEventListener('storage', loadUserData);
    
    return () => {
      window.removeEventListener('storage', loadUserData);
    };
  }, []);

  // Выносим загрузку данных пользователя в отдельную функцию
  const loadUserData = () => {
    try {
      // Проверяем разные возможные ключи для данных пользователя
      let userData = localStorage.getItem("student");
      
      if (!userData) {
        // Пробуем другие возможные ключи
        userData = localStorage.getItem("user");
      }
      
      if (!userData) {
        // Проверяем все ключи в localStorage на содержание данных пользователя
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            const value = localStorage.getItem(key);
            if (value && value.includes('"user_id"') && value.includes('"user_data"')) {
              userData = value;
              console.log(`Found user data in key: ${key}`);
              break;
            }
          }
        }
      }

      if (userData) {
        const parsedUser = JSON.parse(userData);
        console.log("Parsed user data:", parsedUser);
        
        // Проверяем структуру данных
        if (parsedUser && parsedUser.user_id) {
          setStudent(parsedUser);
          console.log("Student data set successfully");
        } else {
          console.error("Invalid user data structure:", parsedUser);
          setStudent(null);
        }
      } else {
        console.log("No user data found in localStorage");
        setStudent(null);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      setStudent(null);
    }
  };

  const isAuthenticated = () => {
    return student !== null && student.user_id !== undefined;
  };

  const handleAskQuestionClick = () => {
    console.log("Ask question clicked, authentication status:", isAuthenticated());
    console.log("Current student data:", student);
    
    // Если пользователь не авторизован, перенаправляем на страницу входа
    if (!isAuthenticated()) {
      message.warning("You need to login first to ask a question");
      router.push("/login");
      return;
    }
    
    // Если пользователь авторизован, открываем модальное окно
    setIsQuestionModalOpen(true);
  };

  const handleSubmit = (values: { topic: string; description: string }) => {
    // Проверяем авторизацию пользователя
    if (!isAuthenticated()) {
      message.error("You must be logged in to submit a question!");
      router.push("/login");
      return;
    }

    // Проверяем, что данные студента загружены корректно
    if (!student || !student.user_data) {
      message.error("User data is incomplete. Please login again.");
      router.push("/login");
      return;
    }

    console.log("Submitting question with student data:", student);

    const formData = new FormData();
    formData.append("topic", values.topic);
    formData.append("description", values.description);
    formData.append("kbtu_id", student.user_id.toString());
    formData.append("first_name", student.user_data.first_name);
    formData.append("last_name", student.user_data.last_name);
    formData.append("course", student.user_data.course.toString());

    // Проверяем все значения, которые отправляем
    for (const pair of formData.entries()) {
      console.log(`${pair[0]}: ${pair[1]}`);
    }

    axios
      .post("http://127.0.0.1:8000/api/faq-requests/create/", formData)
      .then((response) => {
        console.log("Question submitted successfully:", response.data);
        message.success("Your question has been submitted to the managers!");
        setIsQuestionModalOpen(false);
        form.resetFields();
      })
      .catch((error) => {
        console.error("Error submitting question:", error);
        console.error("Error response:", error.response);
        message.error("Failed to submit question: " + (error.response?.data?.message || "Unknown error"));
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
        
        {/* Добавляем отладочную информацию */}
        <div className="mt-4 text-xs text-gray-500">
          Authentication status: {isAuthenticated() ? "Logged in" : "Not logged in"}
        </div>
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
        {student ? (
          <div className="mb-4 p-2 border rounded">
            <p><strong>KBTU ID:</strong> {student.user_id}</p>
            <p><strong>Full Name:</strong> {student.user_data?.last_name || "N/A"} {student.user_data?.first_name || "N/A"}</p>
            <p><strong>Course:</strong> {student.user_data?.course || "N/A"}</p>
          </div>
        ) : (
          <Alert 
            message="User data not available" 
            description="Please reload the page or log in again." 
            type="warning" 
            showIcon 
          />
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
            disabled={!student}
          >
            Submit Question
          </Button>
        </Form>
      </Modal>

      <Footer />
    </Layout>
  );
}