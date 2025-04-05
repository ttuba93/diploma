"use client";

import { useEffect, useState } from "react";
import { Layout, Spin, Alert, Modal, Button, Form, Input, Checkbox, message, Typography, Badge, Table, Space, Select, Tag } from "antd";
import axios from "axios";
import HeaderSection from "../components/Header";
import { Footer } from "../components/Footer";

const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface FAQRequest {
  id: number;
  topic: string;
  description: string;
  answer?: string;
  is_answered: boolean;
  published: boolean;
  course: number;
  student: {
    first_name: string;
    last_name: string;
    kbtu_id: string;
    course: number;
    speciality: string;
  };
  created_at: string;
}

// Define the list of specialties
const SPECIALTIES = ["АиУ", "ВТиПО", "ИС"];

export default function ManagerPage() {
  const [requests, setRequests] = useState<FAQRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<FAQRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQRequest | null>(null);
  const [isAnswerModalOpen, setIsAnswerModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [form] = Form.useForm();
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");
  const [searchText, setSearchText] = useState<string>("");

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/faq-requests/")
      .then((res) => {
        setRequests(res.data);
        setFilteredRequests(res.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching FAQ requests:", error);
        setError("Failed to fetch FAQ requests.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = [...requests];
    
    // Filter by status
    if (statusFilter !== "all") {
      const isAnswered = statusFilter === "answered";
      filtered = filtered.filter(req => req.is_answered === isAnswered);
    }
    
    // Filter by course
    if (courseFilter !== "all") {
      if (courseFilter === "5-7") {
        filtered = filtered.filter(req => req.student.course >= 5);
      } else {
        filtered = filtered.filter(req => req.student.course === parseInt(courseFilter));
      }
    }
    
    // Filter by specialty
    if (specialtyFilter !== "all") {
      filtered = filtered.filter(req => req.student.speciality === specialtyFilter);
    }
    
    // Filter by search text (now includes student ID and name)
    if (searchText) {
      const lowerSearchText = searchText.toLowerCase();
      filtered = filtered.filter(req => 
        req.topic.toLowerCase().includes(lowerSearchText) || 
        req.description.toLowerCase().includes(lowerSearchText) ||
        req.student.kbtu_id.includes(searchText) ||
        `${req.student.first_name} ${req.student.last_name}`.toLowerCase().includes(lowerSearchText)
      );
    }
    
    setFilteredRequests(filtered);
  }, [requests, statusFilter, courseFilter, specialtyFilter, searchText]);

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

  // Table columns
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "Topic",
      dataIndex: "topic",
      key: "topic",
      width: 200,
    },
    {
      title: "Student",
      key: "student",
      width: 180,
      render: (_: unknown, record: FAQRequest) => (
        <span>{record.student.first_name} {record.student.last_name}</span>
      ),
    },
    {
      title: "Student ID",
      key: "kbtu_id",
      width: 120,
      render: (_: unknown, record: FAQRequest) => (
        <span>{record.student.kbtu_id}</span>
      ),
    },
    {
      title: "Course",
      key: "course",
      width: 100,
      render: (_: unknown, record: FAQRequest) => (
        <span>{record.student.course} course</span>
      ),
    },
    {
      title: "Specialty",
      key: "speciality",
      width: 150,
      render: (_: unknown, record: FAQRequest) => (
        <span>{record.student.speciality}</span>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 120,
      render: (_: unknown, record: FAQRequest) => {
        const status = record.is_answered ? "answered" : "pending";
        let color = status === "answered" ? "green" : "blue";
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Published",
      key: "published",
      width: 120,
      render: (_: unknown, record: FAQRequest) => {
        return record.published ? <Tag color="purple">YES</Tag> : <Tag color="default">NO</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_: unknown, record: FAQRequest) => (
        <Space size="small">
          <Button 
            type={record.is_answered ? "default" : "primary"}
            onClick={() => {
              setSelectedFAQ(record);
              setIsAnswerModalOpen(true);
              if (record.is_answered) {
                form.setFieldsValue({ answer: record.answer, published: record.published });
              }
            }}
          >
            {record.is_answered ? "Edit" : "Answer"}
          </Button>
          <Button onClick={() => handleViewDetails(record)}>
            View
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout className="min-h-screen">
      <HeaderSection />
      <Content className="p-6 bg-gray-50">
        <div className="bg-white p-6 rounded-lg shadow">
          <Title level={2} className="text-[#002F6C] mb-6">
            FAQ Requests Manager
          </Title>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <Input.Search
              placeholder="Search by topic, student name or ID"
              style={{ width: 300 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            
            <Select
              defaultValue="all"
              style={{ width: 150 }}
              onChange={(value: string) => setStatusFilter(value)}
            >
              <Option value="all">All Statuses</Option>
              <Option value="pending">Pending</Option>
              <Option value="answered">Answered</Option>
            </Select>
            
            <Select
              defaultValue="all"
              style={{ width: 150 }}
              onChange={(value: string) => setCourseFilter(value)}
            >
              <Option value="all">All Courses</Option>
              <Option value="1">1 course</Option>
              <Option value="2">2 course</Option>
              <Option value="3">3 course</Option>
              <Option value="4">4 course</Option>
              <Option value="5-7">5-7 course</Option>
            </Select>
            
            <Select
              defaultValue="all"
              style={{ width: 200 }}
              onChange={(value: string) => setSpecialtyFilter(value)}
            >
              <Option value="all">All Specialties</Option>
              {SPECIALTIES.map(specialty => (
                <Option key={specialty} value={specialty}>{specialty}</Option>
              ))}
            </Select>
          </div>

          {/* Summary */}
          <div className="flex gap-4 mb-6">
            <Badge.Ribbon text="Pending" color="blue">
              <div className="bg-blue-50 p-4 rounded-lg min-w-32">
                <Title level={4} className="mt-0">
                  {requests.filter(req => !req.is_answered).length}
                </Title>
              </div>
            </Badge.Ribbon>
            
            <Badge.Ribbon text="Answered" color="green">
              <div className="bg-green-50 p-4 rounded-lg min-w-32">
                <Title level={4} className="mt-0">
                  {requests.filter(req => req.is_answered).length}
                </Title>
              </div>
            </Badge.Ribbon>
            
            <Badge.Ribbon text="Published" color="purple">
              <div className="bg-purple-50 p-4 rounded-lg min-w-32">
                <Title level={4} className="mt-0">
                  {requests.filter(req => req.published).length}
                </Title>
              </div>
            </Badge.Ribbon>
          </div>

          {/* FAQ Requests Table */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Spin size="large" />
            </div>
          ) : error ? (
            <Alert message="Error" description={error} type="error" showIcon />
          ) : (
            <Table
              columns={columns}
              dataSource={filteredRequests}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1200 }}
            />
          )}
        </div>

        {/* View Details Modal */}
        <Modal
          title="FAQ Request Details"
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
              <p><strong>Date Created:</strong> {selectedFAQ.created_at}</p>
              {selectedFAQ.is_answered && (
                <>
                  <p><strong>Answer:</strong> {selectedFAQ.answer}</p>
                  <p><strong>Published as FAQ:</strong> {selectedFAQ.published ? "Yes" : "No"}</p>
                </>
              )}
              
              <h3 className="font-bold text-lg mt-4 mb-2">Student Information</h3>
              <p><strong>KBTU ID:</strong> {selectedFAQ.student.kbtu_id}</p>
              <p><strong>Name:</strong> {selectedFAQ.student.first_name} {selectedFAQ.student.last_name}</p>
              <p><strong>Course:</strong> {selectedFAQ.student.course}</p>
              <p><strong>Specialty:</strong> {selectedFAQ.student.speciality}</p>
            </div>
          )}
        </Modal>

        {/* Answer Modal */}
        <Modal
          title={selectedFAQ?.is_answered ? "Edit Answer" : "Answer Question"}
          open={isAnswerModalOpen}
          onCancel={() => setIsAnswerModalOpen(false)}
          footer={null}
        >
          {selectedFAQ && (
            <div className="mb-4 p-3 border rounded bg-gray-50">
              <h3 className="font-semibold mb-2">Student Information</h3>
              <p><strong>KBTU ID:</strong> {selectedFAQ.student.kbtu_id}</p>
              <p><strong>Name:</strong> {selectedFAQ.student.first_name} {selectedFAQ.student.last_name}</p>
              <p><strong>Course:</strong> {selectedFAQ.student.course}</p>
              <p><strong>Specialty:</strong> {selectedFAQ.student.speciality}</p>
              
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
              <TextArea rows={4} />
            </Form.Item>
            <Form.Item name="published" valuePropName="checked">
              <Checkbox>Publish as FAQ</Checkbox>
            </Form.Item>
            <Button type="primary" htmlType="submit" className="w-full bg-blue-900 hover:bg-blue-700">
              {selectedFAQ?.is_answered ? "Update Answer" : "Submit Answer"}
            </Button>
          </Form>
        </Modal>
      </Content>
      <Footer />
    </Layout>
  );
}