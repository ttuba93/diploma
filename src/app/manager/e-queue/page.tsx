"use client";

import { useState, useEffect } from "react";
import { Layout, Table, Button, Modal, Input, Badge, Tag, Select, Typography, Space, message } from "antd";
import HeaderSection from "../components/Header";
import { Footer } from "../components/Footer";
import axios from "axios";

const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Define proper TypeScript interfaces
interface Appointment {
  id: number;
  student: number;
  studentId?: string;
  name: string;
  course: string;
  specialty: string;
  date: string;
  time: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string | null;
  manager: number | null;
}

// API service for appointments
const appointmentService = {
  baseUrl: "/api/appointments/",
  
  async getAll(managerId?: number): Promise<Appointment[]> {
    try {
      const url = managerId ? `${this.baseUrl}?manager=${managerId}` : this.baseUrl;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching appointments:", error);
      throw error;
    }
  },
  
  async update(id: number, data: Partial<Appointment>): Promise<Appointment> {
    try {
      const response = await axios.patch(`${this.baseUrl}${id}/`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating appointment ${id}:`, error);
      throw error;
    }
  }
};

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
  
  // State for manager ID (would typically come from auth context)
  const [managerId, setManagerId] = useState<number | null>(1); // Default to 1 for testing

  // Fetch appointments from API
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const data = await appointmentService.getAll(managerId || undefined);
      setAppointments(data);
      setFilteredAppointments(data); // Initialize filtered appointments
      setLoading(false);
    } catch (error) {
      message.error("Failed to load appointments");
      setLoading(false);
    }
  };

  // Load manager ID from session/local storage or auth context
  useEffect(() => {
    // In a real app, this would come from your auth system
    const loggedInManagerId = localStorage.getItem("managerId");
    if (loggedInManagerId) {
      setManagerId(parseInt(loggedInManagerId));
    } else {
      // For development, set a default manager ID if none is found
      setManagerId(1);
    }
  }, []);

  // Fetch appointments when component mounts or manager ID changes
  useEffect(() => {
    if (managerId !== null) {
      fetchAppointments();
    }
  }, [managerId]);

  // Apply filters whenever appointments, filters, or search text changes
  useEffect(() => {
    if (!appointments.length) return;
    
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
        app.student.toString().includes(searchText) ||
        app.specialty.toLowerCase().includes(lowerSearchText)
      );
    }
    
    setFilteredAppointments(filtered);
  }, [appointments, statusFilter, courseFilter, searchText]);

  // Handle appointment approval
  const handleApprove = async (appointment: Appointment) => {
    setLoading(true);
    try {
      // Update appointment with approved status and current manager
      const updatedAppointment = await appointmentService.update(appointment.id, {
        status: "approved",
        manager: managerId
      });
      
      // Update local state with the server response
      setAppointments(appointments.map(app => 
        app.id === updatedAppointment.id ? updatedAppointment : app
      ));
      
      message.success(`Appointment for ${appointment.name} has been approved.`);
    } catch (error) {
      message.error("Failed to approve appointment");
    } finally {
      setLoading(false);
    }
  };

  // Open rejection modal
  const showRejectionModal = (appointment: Appointment) => {
    setCurrentAppointment(appointment);
    setRejectionReason("");
    setIsRejectionModalOpen(true);
  };

  // Handle rejection confirmation
  const handleReject = async () => {
    if (currentAppointment) {
      setLoading(true);
      try {
        // Update appointment with rejected status, rejection reason, and current manager
        const updatedAppointment = await appointmentService.update(currentAppointment.id, {
          status: "rejected",
          rejection_reason: rejectionReason || "", // Send empty string if no reason provided
          manager: managerId
        });
        
        // Update local state with the server response
        setAppointments(appointments.map(app => 
          app.id === updatedAppointment.id ? updatedAppointment : app
        ));
        
        setIsRejectionModalOpen(false);
        message.info(`Appointment for ${currentAppointment.name} has been rejected.`);
      } catch (error) {
        message.error("Failed to reject appointment");
      } finally {
        setLoading(false);
      }
    }
  };

  // Table columns
  const columns = [
    {
      title: "Student ID",
      key: "studentId",
      width: 120,
      render: (record: Appointment) => record.studentId || record.student,
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

  // Add a refresh button handler
  const handleRefresh = () => {
    fetchAppointments();
  };

  return (
    <Layout className="min-h-screen">
      <HeaderSection />
      <Content className="p-6 bg-gray-50">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-6">
            <Title level={2} className="text-[#002F6C] mb-0">
              Appointment Requests Manager
            </Title>
            <Button onClick={handleRefresh} loading={loading}>
              Refresh
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <Input.Search
              placeholder="Search by name or specialty"
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
              <Option value="3">3 course</Option>
              <Option value="4">4 course</Option>
              {/* Add other course options based on your data */}
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
            confirmLoading={loading}
          >
            <div>
              <p>
                <Text strong>Student:</Text> {currentAppointment.name} ({currentAppointment.studentId || currentAppointment.student})
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