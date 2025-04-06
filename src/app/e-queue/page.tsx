"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout, Button, Calendar, Input, Typography, message, Modal, Spin, Alert, Select } from "antd";
import HeaderSection from "../components/Header";
import { Footer } from "../components/Footer";
import axios from "axios";
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

interface Student {
  user_id: number;
  username: string;
  role: string;
  user_data: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    school: string;
    speciality: string;
    course: string;
    telephone_number: string;
    kbtu_id: string;
  };
}

interface Appointment {
  id: number;
  student: number;
  name: string;
  date: string;
  time: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  manager?: number;
  course: string;
  specialty: string;
}

export default function AppointmentQueue() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [reason, setReason] = useState<string>("");
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [name, setName] = useState<string>("");

  const courseOptions = [
    '1 course', 
    '2 course', 
    '3 course', 
    '4 course', 
    '5-7 course'
  ];
  
  const timeOptions = [
    '09:00:00', 
    '10:00:00', 
    '11:00:00', 
    '12:00:00', 
    '13:00:00', 
    '14:00:00', 
    '15:00:00', 
    '16:00:00'
  ];

  // Debug effect to log student state
  useEffect(() => {
    console.log("Current student state:", student);
    console.log("localStorage student:", localStorage.getItem("student"));
  }, [student]);

  useEffect(() => {
    // Fetch existing appointments to check availability
    axios
      .get("http://127.0.0.1:8000/api/appointments/")
      .then((response) => {
        setAppointments(response.data);
        
        // Generate available dates (next 14 days excluding weekends)
        const dates = [];
        const today = dayjs();
        for (let i = 0; i < 30; i++) {
          const date = today.add(i, 'day');
          // Skip weekends (0 is Sunday, 6 is Saturday)
          if (date.day() !== 0 && date.day() !== 6) {
            dates.push(date.format('YYYY-MM-DD'));
          }
        }
        
        setAvailableDates(dates);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch appointments:", err);
        setError("Failed to load available appointments.");
        setLoading(false);
      });

    // Log all localStorage items for debugging
    console.log("All localStorage items:");
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        console.log(`${key}: ${localStorage.getItem(key)}`);
      }
    }

    // Load user data from localStorage
    loadUserData();

    // Add event listener for storage changes
    window.addEventListener('storage', loadUserData);
    
    return () => {
      window.removeEventListener('storage', loadUserData);
    };
  }, []);

  // Update available times when date is selected
  useEffect(() => {
    if (selectedDate) {
      const bookedTimes = appointments
        .filter(app => app.date === selectedDate)
        .map(app => app.time);
      
      const available = timeOptions.filter(time => !bookedTimes.includes(time));
      setAvailableTimes(available);
    }
  }, [selectedDate, appointments]);

  // Function to load user data from localStorage
  const loadUserData = () => {
    try {
      // Check various possible keys for user data
      let userData = localStorage.getItem("student");
      
      if (!userData) {
        userData = localStorage.getItem("user");
      }
      
      if (!userData) {
        // Search all keys in localStorage for user data
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
        
        // Check data structure
        if (parsedUser && parsedUser.user_id) {
          setStudent(parsedUser);
          // Pre-set name and course from student data
          setName(`${parsedUser.user_data.first_name} ${parsedUser.user_data.last_name}`);
          setSelectedCourse(parsedUser.user_data.course);
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

  // Check if date is available (not a weekend, not fully booked)
  const isDateAvailable = (date: Dayjs) => {
    const formattedDate = date.format("YYYY-MM-DD");
    
    // Check if it's a weekend
    if (date.day() === 0 || date.day() === 6) {
      return false;
    }
    
    // Check if all time slots are booked for this date
    const bookedTimes = appointments
      .filter(app => app.date === formattedDate)
      .map(app => app.time);
    
    return bookedTimes.length < timeOptions.length;
  };

  const handleReserveClick = () => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      message.warning("You need to login first to make an appointment");
      router.push("/login");
      return;
    }

    // Validate selections
    if (!selectedDate || !selectedTime || !name) {
      message.error("Please fill in all required fields");
      return;
    }

    // If everything is valid, open confirmation modal
    setIsModalOpen(true);
  };

  const handleReserveConfirm = () => {
    // Check authentication again
    if (!isAuthenticated()) {
      message.error("You must be logged in to make an appointment!");
      router.push("/login");
      return;
    }

    // Check if student data is properly loaded
    if (!student || !student.user_data) {
      message.error("User data is incomplete. Please login again.");
      router.push("/login");
      return;
    }

    setConfirmLoading(true);

    console.log("Creating appointment with student data:", student);

    // Format data according to the Appointment model
    const appointmentData = {
      student: student.user_data.id,
      name: name,
      date: selectedDate,
      time: selectedTime,
      status: "pending"
    };

    // Log data being sent
    console.log("Sending appointment data:", appointmentData);

    // Send appointment to API
    axios
      .post("http://127.0.0.1:8000/api/appointments/", appointmentData)
      .then((response) => {
        console.log("Appointment created successfully:", response.data);
        message.success("Your appointment has been scheduled and is pending approval!");
        setIsModalOpen(false);
        
        // Add new appointment to the list
        setAppointments([...appointments, response.data]);
        
        // Reset selections
        setSelectedDate(null);
        setSelectedTime(null);
        setReason("");
        setConfirmLoading(false);
      })
      .catch((error) => {
        console.error("Error creating appointment:", error);
        console.error("Error response:", error.response);
        message.error("Failed to create appointment: " + (error.response?.data?.message || "Unknown error"));
        setConfirmLoading(false);
      });
  };

  const handleCalendarChange = (date: Dayjs) => {
    const formattedDate = date.format("YYYY-MM-DD");
    setSelectedDate(formattedDate);
    setSelectedTime(null); // Reset time when date changes
  };

  // Custom date cell renderer for the calendar
  const dateCellRender = (date: Dayjs) => {
    const formattedDate = date.format("YYYY-MM-DD");
    
    // Count booked appointments for this date
    const bookedCount = appointments.filter(app => app.date === formattedDate).length;
    const totalSlots = timeOptions.length;
    const availableSlots = totalSlots - bookedCount;
    
    // Determine color based on availability
    let bgColor = '';
    if (availableSlots === 0) {
      bgColor = 'bg-red-100'; // Fully booked
    } else if (availableSlots <= 3) {
      bgColor = 'bg-yellow-100'; // Almost full
    } else {
      bgColor = 'bg-green-100'; // Plenty available
    }

    return (
      <div className={`h-full w-full ${date.day() === 0 || date.day() === 6 ? '' : bgColor}`}>
        <div className="text-center">{date.date()}</div>
        {availableSlots > 0 && availableSlots < totalSlots && (
          <div className="text-xs text-center">{availableSlots} left</div>
        )}
      </div>
    );
  };

  // Get my appointments
  const getMyAppointments = () => {
    if (!student) return [];
    
    return appointments.filter(app => app.student === student.user_data.id);
  };

  return (
    <Layout className="min-h-screen">
      <HeaderSection />
      
      <Content className="p-6 max-w-4xl mx-auto w-full">
        <Title level={2} className="text-center text-[#002F6C] mb-6">
          Dean's Office Appointment System
        </Title>
        
        {loading ? (
          <div className="flex justify-center">
            <Spin size="large" />
          </div>
        ) : error ? (
          <Alert message="Error" description={error} type="error" showIcon />
        ) : (
          <div className="flex flex-col space-y-6">
            {/* Authentication status */}
            {!isAuthenticated() ? (
              <Alert 
                message="Not Logged In" 
                description="Please log in to schedule an appointment." 
                type="warning" 
                showIcon 
                action={
                  <Button size="small" type="primary" onClick={() => router.push("/login")}>
                    Login
                  </Button>
                }
              />
            ) : (
              <div className="mb-4 p-4 border rounded bg-gray-50">
                <p><strong>Student Information:</strong></p>
                <p><strong>KBTU ID:</strong> {student?.user_data.kbtu_id}</p>
                <p><strong>Name:</strong> {student?.user_data.last_name} {student?.user_data.first_name}</p>
                <p><strong>Course:</strong> {student?.user_data.course}</p>
                <p><strong>Specialty:</strong> {student?.user_data.speciality}</p>
              </div>
            )}
            
            {/* My Appointments Section */}
            {isAuthenticated() && getMyAppointments().length > 0 && (
              <div className="border p-4 rounded-lg">
                <Title level={4} className="text-[#002F6C] mb-4">
                  My Appointments
                </Title>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="py-2 px-4 border-b text-left">Date</th>
                        <th className="py-2 px-4 border-b text-left">Time</th>
                        <th className="py-2 px-4 border-b text-left">Status</th>
                        <th className="py-2 px-4 border-b text-left">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getMyAppointments().map((app) => (
                        <tr key={app.id}>
                          <td className="py-2 px-4 border-b">{app.date}</td>
                          <td className="py-2 px-4 border-b">{app.time}</td>
                          <td className="py-2 px-4 border-b">
                            <span 
                              className={`px-2 py-1 rounded text-xs ${
                                app.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                app.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                            </span>
                          </td>
                          <td className="py-2 px-4 border-b">
                            {app.rejection_reason || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* New Appointment Section */}
            <div className="border p-4 rounded-lg">
              <Title level={4} className="text-[#002F6C] mb-4">
                Schedule New Appointment
              </Title>
              
              {/* Name field */}
              <div className="mb-4">
                <Text strong>Name:</Text>
                <Input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="mt-1"
                  disabled={!isAuthenticated()}
                />
              </div>
              
              {/* Course selection - pre-filled from student data */}
              <div className="mb-4">
                <Text strong>Course:</Text>
                <Select
                  value={selectedCourse}
                  onChange={(value) => setSelectedCourse(value)}
                  className="w-full mt-1"
                  disabled={!isAuthenticated()}
                >
                  {courseOptions.map(course => (
                    <Option key={course} value={course}>{course}</Option>
                  ))}
                </Select>
              </div>
              
              {/* Calendar with available dates */}
              <div className="mb-4">
                <Text strong>Select Date:</Text>
                <Calendar
                  fullscreen={false}
                  onChange={handleCalendarChange}
                  disabledDate={(date) => !isDateAvailable(date)}
                  dateFullCellRender={dateCellRender}
                  className="text-[#002F6C] mt-1"
                />
              </div>
              
              {/* Time selection */}
              {selectedDate && (
                <div className="mb-4">
                  <Text strong>Select Time:</Text>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {availableTimes.length > 0 ? (
                      availableTimes.map((time) => (
                        <Button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`border-[#002F6C] hover:text-[#002F6C] hover:border-[#002F6C] ${
                            selectedTime === time ? "bg-[#002F6C] text-white" : "text-[#002F6C]"
                          }`}
                        >
                          {time.substring(0, 5)}
                        </Button>
                      ))
                    ) : (
                      <Alert message="No available time slots for this date" type="info" showIcon />
                    )}
                  </div>
                </div>
              )}
              
              {/* Reason for visit */}
              <div className="mb-4">
                <Text strong>Reason for Visit:</Text>
                <Input.TextArea
                  rows={4}
                  placeholder="Please briefly describe the reason for your visit"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1"
                  disabled={!isAuthenticated()}
                />
              </div>
              
              {/* Schedule button */}
              <div className="text-center mt-6">
                <Button
                  type="primary"
                  size="large"
                  className="bg-[#002F6C] hover:bg-blue-700"
                  onClick={handleReserveClick}
                  disabled={!isAuthenticated() || !selectedDate || !selectedTime || !name}
                >
                  Schedule Appointment
                </Button>
              </div>
            </div>
          </div>
        )}
      </Content>
      
      {/* Confirmation Modal */}
      <Modal
        title="Confirm Appointment"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="back" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={confirmLoading}
            onClick={handleReserveConfirm}
            className="bg-[#002F6C]"
          >
            Confirm Appointment
          </Button>,
        ]}
      >
        {student && (
          <div className="mb-4">
            <p><strong>Student:</strong> {name}</p>
            <p><strong>KBTU ID:</strong> {student.user_data.kbtu_id}</p>
            <p><strong>Course:</strong> {selectedCourse}</p>
            <p><strong>Specialty:</strong> {student.user_data.speciality}</p>
            <p><strong>Date:</strong> {selectedDate}</p>
            <p><strong>Time:</strong> {selectedTime?.substring(0, 5)}</p>
            <p><strong>Reason:</strong> {reason}</p>
            <Alert 
              message="Note" 
              description="Your appointment will be pending until approved by a manager." 
              type="info" 
              showIcon 
              className="mt-4"
            />
          </div>
        )}
      </Modal>

      <Footer />
    </Layout>
  );
}