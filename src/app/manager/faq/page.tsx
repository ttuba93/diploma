"use client";

import { useEffect, useState } from "react";
import { Layout, Spin, Alert, Modal, Button, Form, Input, Checkbox, Select, message } from "antd";
import HeaderSection from "../components/Header";
import { Footer } from "../components/Footer";
import axios from "axios";

const { Content } = Layout;
const { Option } = Select;

interface FAQRequest {
  id: number;
  topic: string;
  description: string;
  course?: number;
  is_faq: boolean;
}

export default function ManagerPage() {
  const [requests, setRequests] = useState<FAQRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<FAQRequest | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/faq-requests/")
      .then((res) => {
        setRequests(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch FAQ requests.");
        setLoading(false);
      });
  }, []);

  const handleSubmit = (values: { response: string; course: number; is_faq: boolean }) => {
    if (!selectedRequest) return;

    axios
      .patch(`http://127.0.0.1:8000/api/faq-requests/${selectedRequest.id}/`, {
        course: values.course,
        is_faq: values.is_faq,
        answer: values.response,
      })
      .then(() => {
        message.success("Response submitted successfully!");
        setRequests((prev) => prev.filter((req) => req.id !== selectedRequest.id));
        setSelectedRequest(null);
        form.resetFields();
      })
      .catch(() => {
        message.error("Error submitting response!");
      });
  };

  return (
    <Layout className="min-h-screen">
      <HeaderSection />
      <Content className="p-6 max-w-4xl mx-auto w-full">
        {loading ? (
          <div className="flex justify-center">
            <Spin size="large" />
          </div>
        ) : error ? (
          <Alert message="Error" description={error} type="error" showIcon />
        ) : requests.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {requests.map((request) => (
              <div
                key={request.id}
                onClick={() => setSelectedRequest(request)}
                className="p-4 border rounded-lg cursor-pointer hover:bg-gray-100 transition-all duration-200"
              >
                <strong>{request.topic}</strong>
                <p className="text-gray-600 truncate">{request.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">No pending requests.</p>
        )}
      </Content>

      <Modal
        title={selectedRequest?.topic}
        open={!!selectedRequest}
        onCancel={() => setSelectedRequest(null)}
        footer={null}
      >
        <p>{selectedRequest?.description}</p>
        <Form form={form} layout="vertical" onFinish={handleSubmit} className="space-y-4">
          <Form.Item label="Response" name="response" rules={[{ required: true, message: "Enter a response!" }]}> 
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item label="Assign Course" name="course" rules={[{ required: true, message: "Select a course!" }]}> 
            <Select>
              {[1, 2, 3, 4, 5, 6, 7].map((course) => (
                <Option key={course} value={course}>{course} course</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="is_faq" valuePropName="checked">
            <Checkbox>Mark as FAQ</Checkbox>
          </Form.Item>
          <Button type="primary" htmlType="submit" className="w-full bg-blue-900 hover:bg-blue-700">
            Submit Response
          </Button>
        </Form>
      </Modal>
      <Footer />
    </Layout>
  );
}
