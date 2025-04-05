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

    const storedUser = localStorage.getItem("student");
    if (storedUser) {
      setStudent(JSON.parse(storedUser));
    }
  }, []);

  const handleAskQuestionClick = () => {
    const storedUser = localStorage.getItem("student");
    if (!storedUser) {
      router.push("/login");
      return;
    }
    setStudent(JSON.parse(storedUser));
    setIsQuestionModalOpen(true);
  };

  const handleSubmit = (values: { topic: string; description: string }) => {
    if (!student) {
      message.error("Вы должны быть авторизованы!");
      return;
    }

    axios
      .post("http://127.0.0.1:8000/api/faq-requests/create/", {
        student_id: student.user_id,
        first_name: student.user_data.first_name,
        last_name: student.user_data.last_name,
        course: student.user_data.course,
        topic: values.topic,
        description: values.description,
      })
      .then(() => {
        message.success("Ваш вопрос отправлен менеджерам деканата!");
        setIsQuestionModalOpen(false);
        form.resetFields();
      })
      .catch(() => {
        message.error("Ошибка при отправке вопроса!");
      });
  };

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
        ) : faqs.length > 0 ? (
          faqs.map((faq) => (
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
          Задать свой вопрос
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
        title="Задать вопрос деканату"
        open={isQuestionModalOpen}
        onCancel={() => setIsQuestionModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Тема"
            name="topic"
            rules={[{ required: true, message: "Введите тему вопроса!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Описание"
            name="description"
            rules={[{ required: true, message: "Введите описание!" }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            className="w-full bg-blue-900 hover:bg-blue-700"
          >
            Отправить вопрос
          </Button>
        </Form>
      </Modal>

      <Footer />
    </Layout>
  );
}
