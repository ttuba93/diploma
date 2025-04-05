"use client";

import { useEffect, useState } from "react";
import { Layout, Spin, Alert, Modal, Button, Form, Input, Checkbox, message } from "antd";
import axios from "axios";
import HeaderSection from "../components/Header";
import { Footer } from "../components/Footer";
import SearchSection from "../components/SearchSection";

const { Content } = Layout;

interface FAQRequest {
  id: number;
  topic: string;
  description: string;
  answer?: string;
  is_answered: boolean;
  published: boolean;
  course?: number;
  kbtu_id: number; // Изменено с student_id на kbtu_id
  first_name: string;
  last_name: string;
}

export default function ManagerPage() {
  const [requests, setRequests] = useState<FAQRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>("All");
  const [selectedFAQ, setSelectedFAQ] = useState<FAQRequest | null>(null);
  const [isAnswerModalOpen, setIsAnswerModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [form] = Form.useForm();

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/faq-requests/")
      .then((res) => {
        setRequests(res.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching FAQ requests:", error);
        setError("Failed to fetch FAQ requests.");
        setLoading(false);
      });
  }, []);

  const handleSubmit = (values: { answer: string; published: boolean }) => {
    if (!selectedFAQ) return;

    axios
      .patch(`http://127.0.0.1:8000/api/faq-requests/${selectedFAQ.id}/`, {
        answer: values.answer,
        is_answered: true,
        published: values.published,
      })
      .then(() => {
        message.success("Answer submitted successfully!");
        setRequests((prev) =>
          prev.map((faq) =>
            faq.id === selectedFAQ.id ? { ...faq, ...values, is_answered: true } : faq
          )
        );
        setIsAnswerModalOpen(false);
        form.resetFields();
      })
      .catch((error) => {
        console.error("Error submitting answer:", error);
        message.error("Failed to submit the answer!");
      });
  };

  const handleViewDetails = (faq: FAQRequest) => {
    setSelectedFAQ(faq);
    setIsViewModalOpen(true);
  };

  // Фильтрация вопросов по курсу
  const filteredRequests = selectedCourse === "All"
    ? requests
    : requests.filter(faq =>
        faq.course ? (selectedCourse === "5-7" ? faq.course >= 5 : faq.course === Number(selectedCourse)) : false
      );

  const unanswered = filteredRequests.filter((faq) => !faq.is_answered);
  const answered = filteredRequests.filter((faq) => faq.is_answered);

  return (
    <Layout className="min-h-screen">
      <HeaderSection />
      <SearchSection/>
      {/* Фильтр по курсам */}
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
        ) : (
          <>
            {/* Неотвеченные вопросы */}
            <h2 className="text-xl font-semibold my-4">Unanswered Questions</h2>
            {unanswered.length > 0 ? (
              unanswered.map((faq) => (
                <div
                  key={faq.id}
                  className="p-4 border rounded-lg my-2 hover:bg-gray-100 transition-all duration-200"
                >
                  <strong>{faq.topic}</strong>
                  <p className="text-gray-600">{faq.description}</p>
                  <p className="mt-2 text-sm text-gray-500">
                    Asked by: {faq.first_name} {faq.last_name} (KBTU ID: {faq.kbtu_id}, Course: {faq.course})
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="primary"
                      className="bg-blue-900 hover:bg-blue-700"
                      onClick={() => {
                        setSelectedFAQ(faq);
                        setIsAnswerModalOpen(true);
                      }}
                    >
                      Answer
                    </Button>
                    <Button
                      onClick={() => handleViewDetails(faq)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">No unanswered questions.</p>
            )}

            {/* Отвеченные вопросы */}
            <h2 className="text-xl font-semibold my-4">Answered Questions</h2>
            {answered.length > 0 ? (
              answered.map((faq) => (
                <div
                  key={faq.id}
                  className="p-4 border rounded-lg my-2 hover:bg-gray-100 transition-all duration-200"
                >
                  <strong>{faq.topic}</strong>
                  <p className="text-gray-600">{faq.description}</p>
                  <p className="mt-2"><strong>Answer:</strong> {faq.answer}</p>
                  <p className="mt-2 text-sm text-gray-500">
                    Asked by: {faq.first_name} {faq.last_name} (KBTU ID: {faq.kbtu_id}, Course: {faq.course})
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="default"
                      onClick={() => {
                        setSelectedFAQ(faq);
                        setIsAnswerModalOpen(true);
                        form.setFieldsValue({ answer: faq.answer, published: faq.published });
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleViewDetails(faq)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">No answered questions.</p>
            )}
          </>
        )}
      </Content>

      {/* Модальное окно для просмотра деталей студента */}
      <Modal
        title="Student Details"
        open={isViewModalOpen}
        onCancel={() => setIsViewModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsViewModalOpen(false)}>
            Close
          </Button>
        ]}
      >
        {selectedFAQ && (
          <div className="p-4 border rounded bg-gray-50">
            <h3 className="font-bold text-lg mb-2">Question Information</h3>
            <p><strong>Topic:</strong> {selectedFAQ.topic}</p>
            <p><strong>Description:</strong> {selectedFAQ.description}</p>
            {selectedFAQ.is_answered && (
              <p><strong>Answer:</strong> {selectedFAQ.answer}</p>
            )}
            
            <h3 className="font-bold text-lg mt-4 mb-2">Student Information</h3>
            <p><strong>KBTU ID:</strong> {selectedFAQ.kbtu_id}</p>
            <p><strong>Name:</strong> {selectedFAQ.first_name} {selectedFAQ.last_name}</p>
            <p><strong>Course:</strong> {selectedFAQ.course}</p>
          </div>
        )}
      </Modal>

      {/* Модальное окно для ответа */}
      <Modal
        title={selectedFAQ?.is_answered ? "Edit Answer" : "Answer Question"}
        open={isAnswerModalOpen}
        onCancel={() => setIsAnswerModalOpen(false)}
        footer={null}
      >
        {selectedFAQ && (
          <div className="mb-4 p-3 border rounded bg-gray-50">
            <h3 className="font-semibold mb-2">Student Information</h3>
            <p><strong>KBTU ID:</strong> {selectedFAQ.kbtu_id}</p>
            <p><strong>Name:</strong> {selectedFAQ.first_name} {selectedFAQ.last_name}</p>
            <p><strong>Course:</strong> {selectedFAQ.course}</p>
            
            <h3 className="font-semibold mt-3 mb-2">Question</h3>
            <p><strong>Topic:</strong> {selectedFAQ.topic}</p>
            <p><strong>Description:</strong> {selectedFAQ.description}</p>
          </div>
        )}
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Your Answer"
            name="answer"
            rules={[{ required: true, message: "Please enter the answer!" }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="published" valuePropName="checked">
            <Checkbox>Publish as FAQ</Checkbox>
          </Form.Item>
          <Button type="primary" htmlType="submit" className="w-full bg-blue-900 hover:bg-blue-700">
            {selectedFAQ?.is_answered ? "Update Answer" : "Submit Answer"}
          </Button>
        </Form>
      </Modal>

      <Footer />
    </Layout>
  );
}