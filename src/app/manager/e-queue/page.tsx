"use client";

import { useState, useEffect } from "react";
import { Layout, Table, Button, Modal, Input, Badge, Tag, Select, Typography, Space, message } from "antd";
import HeaderSection from "../components/Header";
import { Footer } from "../components/Footer";

const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Define proper TypeScript interfaces
interface Appointment {
  id: number;
  studentId: string;
  name: string;
  course: string;
  specialty: string;
  date: string;
  time: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
}

export default function ManagerDashboard() {
  // State for appointments data
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // State for rejection modal
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null);
  
  // State for filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [searchText, setSearchText] = useState<string>("");

  // Mock data - in a real application, this would come from an API
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setAppointments([
        {
          id: 1,
          studentId: "220207",
          name: "Akhmet Asanov",
          course: "1 course",
          specialty: "Computer Science",
          date: "2025-04-10",
          time: "10:00",
          status: "pending"
        },
        {
          id: 2,
          studentId: "210156",
          name: "Aisha Nurbekova",
          course: "2 course",
          specialty: "Information Systems",
          date: "2025-04-10",
          time: "11:00",
          status: "pending"
        },
        {
          id: 3,
          studentId: "200089",
          name: "Daulet Sarsenov",
          course: "3 course",
          specialty: "Big Data Analysis",
          date: "2025-04-11",
          time: "14:00",
          status: "pending"
        },
        {
          id: 4,
          studentId: "190234",
          name: "Dinara Karimova",
          course: "4 course",
          specialty: "Software Engineering",
          date: "2025-04-12",
          time: "09:00",
          status: "pending"
        },
        {
          id: 5,
          studentId: "180045",
          name: "Nurlan Aidarov",
          course: "5-7 course",
          specialty: "Cybersecurity",
          date: "2025-04-12",
          time: "13:00",
          status: "pending"
        }
      ] as Appointment[]);
      setLoading(false);
    }, 1000);
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...appointments];
    
    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(app => app.status === statusFilter);
    }
    
    // Filter by course
    if (courseFilter !== "all") {
      filtered = filtered.filter(app => app.course === courseFilter);
    }
    
    // Filter by search text
    if (searchText) {
      const lowerSearchText = searchText.toLowerCase();
      filtered = filtered.filter(app => 
        app.name.toLowerCase().includes(lowerSearchText) || 
        app.studentId.includes(searchText) ||
        app.specialty.toLowerCase().includes(lowerSearchText)
      );
    }
    
    setFilteredAppointments(filtered);
  }, [appointments, statusFilter, courseFilter, searchText]);

  // Handle appointment approval
  const handleApprove = (appointment: Appointment) => {
    setAppointments(appointments.map(app => 
      app.id === appointment.id ? { ...app, status: "approved" as const } : app
    ));
    message.success(`Appointment for ${appointment.name} has been approved.`);
  };

  // Open rejection modal
  const showRejectionModal = (appointment: Appointment) => {
    setCurrentAppointment(appointment);
    setRejectionReason("");
    setIsRejectionModalOpen(true);
  };

  // Handle rejection confirmation
  const handleReject = () => {
    if (currentAppointment) {
      setAppointments(appointments.map(app => 
        app.id === currentAppointment.id ? { ...app, status: "rejected" as const, rejectionReason } : app
      ));
      setIsRejectionModalOpen(false);
      message.info(`Appointment for ${currentAppointment.name} has been rejected.`);
    }
  };

  // Table columns
  const columns = [
    {
      title: "Student ID",
      dataIndex: "studentId",
      key: "studentId",
      width: 120,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 180,
    },
    {
      title: "Course",
      dataIndex: "course",
      key: "course",
      width: 120,
    },
    {
      title: "Specialty",
      dataIndex: "specialty",
      key: "specialty",
      width: 180,
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 120,
    },
    {
      title: "Time",
      dataIndex: "time",
      key: "time",
      width: 100,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => {
        let color = "blue";
        if (status === "approved") color = "green";
        if (status === "rejected") color = "red";
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      render: (_: any, record: Appointment) => (
        record.status === "pending" && (
          <Space size="small">
            <Button type="primary" onClick={() => handleApprove(record)}>
              Approve
            </Button>
            <Button danger onClick={() => showRejectionModal(record)}>
              Reject
            </Button>
          </Space>
        )
      ),
    },
  ];

  return (
    <Layout className="min-h-screen">
      <HeaderSection />
      <Content className="p-6 bg-gray-50">
        <div className="bg-white p-6 rounded-lg shadow">
          <Title level={2} className="text-[#002F6C] mb-6">
            Appointment Requests Manager
          </Title>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <Input.Search
              placeholder="Search by name, ID or specialty"
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
              <Option value="approved">Approved</Option>
              <Option value="rejected">Rejected</Option>
            </Select>
            
            <Select
              defaultValue="all"
              style={{ width: 150 }}
              onChange={(value: string) => setCourseFilter(value)}
            >
              <Option value="all">All Courses</Option>
              <Option value="1 course">1 course</Option>
              <Option value="2 course">2 course</Option>
              <Option value="3 course">3 course</Option>
              <Option value="4 course">4 course</Option>
              <Option value="5-7 course">5-7 course</Option>
            </Select>
          </div>

          {/* Summary */}
          <div className="flex gap-4 mb-6">
            <Badge.Ribbon text="Pending" color="blue">
              <div className="bg-blue-50 p-4 rounded-lg min-w-32">
                <Title level={4} className="mt-0">
                  {appointments.filter(app => app.status === "pending").length}
                </Title>
              </div>
            </Badge.Ribbon>
            
            <Badge.Ribbon text="Approved" color="green">
              <div className="bg-green-50 p-4 rounded-lg min-w-32">
                <Title level={4} className="mt-0">
                  {appointments.filter(app => app.status === "approved").length}
                </Title>
              </div>
            </Badge.Ribbon>
            
            <Badge.Ribbon text="Rejected" color="red">
              <div className="bg-red-50 p-4 rounded-lg min-w-32">
                <Title level={4} className="mt-0">
                  {appointments.filter(app => app.status === "rejected").length}
                </Title>
              </div>
            </Badge.Ribbon>
          </div>

          {/* Appointments Table */}
          <Table
            columns={columns}
            dataSource={filteredAppointments}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1200 }}
          />
        </div>

        {/* Rejection Modal */}
        {currentAppointment && (
          <Modal
            title="Reject Appointment"
            open={isRejectionModalOpen}
            onOk={handleReject}
            onCancel={() => setIsRejectionModalOpen(false)}
            okText="Confirm Rejection"
            cancelText="Cancel"
          >
            <div>
              <p>
                <Text strong>Student:</Text> {currentAppointment.name} ({currentAppointment.studentId})
              </p>
              <p>
                <Text strong>Course:</Text> {currentAppointment.course}
              </p>
              <p>
                <Text strong>Appointment:</Text> {currentAppointment.date} at {currentAppointment.time}
              </p>
              <div className="mt-4">
                <Text strong>Rejection Reason (Optional):</Text>
                <TextArea
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection (optional)"
                />
              </div>
            </div>
          </Modal>
        )}
      </Content>
      <Footer />
    </Layout>
  );
}