"use client";

import { useState, useEffect, useRef } from "react";
import { Input, List, Spin, Alert, Button, Modal, Form, message, Upload } from "antd";
import { UploadOutlined, SearchOutlined } from "@ant-design/icons";
import axios from "axios";
import { useRouter } from "next/navigation";

interface FAQ {
  id: number;
  question: string;
  answer: string;
}

interface UserData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  school: string;
  speciality: string;
  course: number;
  telephone_number: string;
  kbtu_id: string;
}

interface Student {
  user_id: number;
  username: string;
  role: string;
  user_data: UserData;
}

export default function SearchSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState<boolean>(false);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [form] = Form.useForm();
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Получение данных FAQ
    axios
      .get("http://127.0.0.1:8000/api/faq/")
      .then((res) => {
        setFaqs(res.data);
        setFilteredFaqs(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch FAQs.");
        setLoading(false);
      });

    // Получение данных пользователя из localStorage
    loadUserData();

    // Добавляем обработчик для события storage, чтобы обновлять данные
    // когда они изменяются в другой вкладке
    window.addEventListener('storage', loadUserData);
    
    // Add click outside handler
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('storage', loadUserData);
      document.removeEventListener('mousedown', handleClickOutside);
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

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredFaqs(faqs);
    } else {
      setFilteredFaqs(
        faqs.filter(
          (faq) =>
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, faqs]);

  // Открытие вопроса в модальном окне
  const openQuestionModal = (faq: FAQ) => {
    setSelectedFAQ(faq);
    setIsQuestionModalOpen(true);
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
    setSelectedFAQ(null);  // Make sure we're in "Ask a question" mode, not viewing a FAQ
    setIsQuestionModalOpen(true);
    setIsSearchFocused(false); // Close the search results panel
  };

  // Отправка нового вопроса на бекенд
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
    formData.append("student", student.user_data.id.toString());
    formData.append("topic", values.topic);
    formData.append("description", values.description);

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

  return (
    <section
      className="relative text-center flex flex-col justify-center items-center h-[70vh] bg-cover bg-center"
      style={{ backgroundImage: "url('/images/kbtu.png')" }}
    >
      <div className="absolute w-3/4 h-2/3 bg-blue-900 bg-opacity-50 rounded-xl flex flex-col justify-center items-center p-6">
        <h1 className="text-3xl font-semibold text-white">Your Questions, Answered</h1>
        <div className="mt-4 w-3/4 relative">
          <Input
            className="bg-white rounded-full px-4 py-2 text-lg w-full"
            placeholder="Search your question..."
            prefix={<SearchOutlined className="text-blue-900" />}
            size="large"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
          />
          
          {/* Список найденных вопросов - показывается только при фокусе */}
          {isSearchFocused && (
            <div 
              ref={resultsRef}
              className="mt-4 w-full max-h-60 overflow-auto bg-white rounded-md p-2 shadow-lg absolute z-10"
            >
              {loading ? (
                <Spin size="large" />
              ) : error ? (
                <Alert message="Error" description={error} type="error" showIcon />
              ) : filteredFaqs.length > 0 ? (
                <>
                  <List
                    dataSource={filteredFaqs}
                    renderItem={(faq) => (
                      <List.Item
                        className="cursor-pointer hover:bg-gray-100 transition-all duration-200"
                        onClick={() => {
                          openQuestionModal(faq);
                          setIsSearchFocused(false);
                        }}
                      >
                        <strong>{faq.question}</strong>
                      </List.Item>
                    )}
                  />
                  <div className="mt-4 flex justify-center pb-2">
                    <Button
                      type="primary"
                      className="bg-blue-900 hover:bg-blue-700"
                      onClick={handleAskQuestionClick}
                    >
                      Ask a question
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-gray-500 text-center py-2">No results found.</p>
                  <div className="mt-2 flex justify-center pb-2">
                    <Button
                      type="primary"
                      className="bg-blue-900 hover:bg-blue-700"
                      onClick={handleAskQuestionClick}
                    >
                      Ask a question
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно для просмотра найденного вопроса */}
      <Modal
        title={selectedFAQ?.question}
        open={isQuestionModalOpen && selectedFAQ !== null}
        onCancel={() => setIsQuestionModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsQuestionModalOpen(false)}>
            Close
          </Button>,
        ]}
      >
        <p>{selectedFAQ?.answer}</p>
      </Modal>

      {/* Модальное окно для отправки вопроса */}
      <Modal
        title="Ask the Dean's Office a Question"
        open={isQuestionModalOpen && selectedFAQ === null}
        onCancel={() => setIsQuestionModalOpen(false)}
        footer={null}
      >
        {student ? (
          <div className="mb-4 p-2 border rounded">
            <p><strong>KBTU ID:</strong> {student.user_data.kbtu_id}</p>
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
          <Form.Item label="Upload document (optional)" name="document" valuePropName="fileList" getValueFromEvent={(e) => e.fileList}>
            <Upload beforeUpload={() => false} maxCount={1}>
              <Button icon={<UploadOutlined />}>Select file</Button>
            </Upload>
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
    </section>
  );
}