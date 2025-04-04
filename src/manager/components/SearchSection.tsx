"use client";

import { useState, useEffect } from "react";
import { Input, List, Spin, Alert, Button, Modal, Form, message, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { SearchOutlined } from "@ant-design/icons";
import axios from "axios";

interface FAQ {
  id: number;
  question: string;
  answer: string;
}

export default function SearchSection() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState<boolean>(false);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
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
  }, []);

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

  // Отправка нового вопроса на бекенд
  const handleSubmit = (values: { topic: string; description: string }) => {
    axios
      .post("http://127.0.0.1:8000/api/faq-requests/create/", {
        student: 1, // ID студента (можно передавать через авторизацию)
        topic: values.topic,
        description: values.description,
      })
      .then(() => {
        message.success("Ваш вопрос отправлен менеджерам деканата!");
        setIsModalOpen(false);
        form.resetFields();
      })
      .catch(() => {
        message.error("Ошибка при отправке вопроса!");
      });
  };

  return (
    <section
      className="relative text-center flex flex-col justify-center items-center h-[70vh] bg-cover bg-center"
      style={{ backgroundImage: "url('/images/kbtu.png')" }}
    >
      <div className="absolute w-3/4 h-2/3 bg-blue-900 bg-opacity-50 rounded-xl flex flex-col justify-center items-center p-6">
        <h1 className="text-3xl font-semibold text-white">Your Questions, Answered</h1>
        <div className="mt-4 w-3/4">
          <Input
            className="bg-white rounded-full px-4 py-2 text-lg w-full"
            placeholder="Search your question..."
            prefix={<SearchOutlined className="text-blue-900" />}
            size="large"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Список найденных вопросов */}
        <div className="mt-4 w-3/4 max-h-60 overflow-auto bg-white rounded-md p-2 shadow-lg">
          {loading ? (
            <Spin size="large" />
          ) : error ? (
            <Alert message="Error" description={error} type="error" showIcon />
          ) : filteredFaqs.length > 0 ? (
            <List
              dataSource={filteredFaqs}
              renderItem={(faq) => (
                <List.Item
                  className="cursor-pointer hover:bg-gray-100 transition-all duration-200"
                  onClick={() => openQuestionModal(faq)}
                >
                  <strong>{faq.question}</strong>
                </List.Item>
              )}
            />
          ) : (
            <>
              <p className="text-gray-500 text-center">No results found.</p>
              <Button
                type="primary"
                className="mt-4 bg-blue-900 hover:bg-blue-700"
                onClick={() => setIsModalOpen(true)}
              >
                Задать свой вопрос
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Модальное окно для отправки вопроса */}
      <Modal
        title="Задать вопрос деканату"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
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
          <Form.Item label="Загрузить документ (необязательно)" name="document" valuePropName="fileList" getValueFromEvent={(e) => e.fileList}>
            <Upload beforeUpload={() => false} maxCount={1}>
              <Button icon={<UploadOutlined />}>Выберите файл</Button>
            </Upload>
          </Form.Item>
          <Button type="primary" htmlType="submit" className="w-full bg-blue-900 hover:bg-blue-700">
            Отправить вопрос
          </Button>
        </Form>
      </Modal>

      {/* Модальное окно для просмотра найденного вопроса */}
      <Modal
        title={selectedFAQ?.question}
        open={isQuestionModalOpen}
        onCancel={() => setIsQuestionModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsQuestionModalOpen(false)}>
            Закрыть
          </Button>,
        ]}
      >
        <p>{selectedFAQ?.answer}</p>
      </Modal>
    </section>
  );
}
