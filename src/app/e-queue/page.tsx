"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout, Button, Calendar, Input, Typography, message, Modal, Spin, Alert, Select, Card, Badge } from "antd";
import HeaderSection from "../components/Header";
import { Footer } from "../components/Footer";
import axios from "axios";
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

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
  name: string; // This represents the reason for appointment
  date: string;
  time: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  manager?: 1;
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
  const [appointmentReason, setAppointmentReason] = useState<string>("");
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>("schedule");

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

  const commonReasons = [
    "Thesis consultation",
    "Student status certificate",
    "Academic leave application",
    "Specialization transfer",
    "Reinstatement after expulsion",
    "Transcript processing",
    "Payment issues resolution",
    "Student exchange consultation"
  ];

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
              break;
            }
          }
        }
      }

      if (userData) {
        const parsedUser = JSON.parse(userData);
        
        // Check data structure
        if (parsedUser && parsedUser.user_id) {
          setStudent(parsedUser);
          // Pre-set course from student data
          setSelectedCourse(parsedUser.user_data.course);
        } else {
          setStudent(null);
        }
      } else {
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
      message.warning("You need to authenticate to schedule an appointment");
      router.push("/login");
      return;
    }

    // Validate selections
    if (!selectedDate || !selectedTime || !appointmentReason) {
      if (!appointmentReason) {
        message.error("Please specify the reason for your visit");
      } else {
        message.error("Please fill in all required fields");
      }
      return;
    }

    // If everything is valid, open confirmation modal
    setIsModalOpen(true);
  };

  const handleReserveConfirm = () => {
    // Check authentication again
    if (!isAuthenticated()) {
      message.error("You must be authenticated to schedule an appointment!");
      router.push("/login");
      return;
    }

    // Check if student data is properly loaded
    if (!student || !student.user_data) {
      message.error("User data is incomplete. Please log in again.");
      router.push("/login");
      return;
    }

    setConfirmLoading(true);

    // Format data according to the Appointment model
    const appointmentData = {
      student: student.user_data.id,
      name: appointmentReason, // Using appointmentReason as the name field
      date: selectedDate,
      time: selectedTime,
      status: "pending",
      course: selectedCourse,
      specialty: student.user_data.speciality
    };

    // Send appointment to API
    axios
      .post("http://127.0.0.1:8000/api/appointments/", appointmentData)
      .then((response) => {
        message.success("Your appointment has been scheduled and is awaiting confirmation!");
        setIsModalOpen(false);
        
        // Add new appointment to the list
        setAppointments([...appointments, response.data]);
        
        // Reset selections
        setSelectedDate(null);
        setSelectedTime(null);
        setAppointmentReason("");
        setConfirmLoading(false);
        
        // Switch to My Appointments tab
        setSelectedTab("myAppointments");
      })
      .catch((error) => {
        console.error("Error creating appointment:", error);
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

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved':
        return <Badge status="success" text="Approved" />;
      case 'rejected':
        return <Badge status="error" text="Rejected" />;
      default:
        return <Badge status="processing" text="Pending" />;
    }
  };

  const handleCommonReasonSelect = (reason: string) => {
    setAppointmentReason(reason);
  };

  return (
    <Layout className="min-h-screen bg-gray-50">
      <HeaderSection />
      
      <Content className="p-6 max-w-5xl mx-auto w-full">
        <Card 
          className="shadow-md"
          title={
            <div className="text-center">
              <Title level={2} className="text-[#002F6C] m-0">
                Schedule an Appointment with the Dean's Office
              </Title>
            </div>
          }
        >
          {loading ? (
            <div className="flex justify-center py-8">
              <Spin size="large" />
            </div>
          ) : error ? (
            <Alert message="Error" description={error} type="error" showIcon className="mb-4" />
          ) : (
            <div>
              {/* Authentication status */}
              {!isAuthenticated() ? (
                <Alert 
                  message="Not authenticated" 
                  description="Please log in to schedule an appointment." 
                  type="warning" 
                  showIcon 
                  action={
                    <Button size="small" type="primary" onClick={() => router.push("/login")}>
                      Log in
                    </Button>
                  }
                  className="mb-4"
                />
              ) : (
                <Card className="mb-4 bg-blue-50">
                  <div className="flex justify-between items-center flex-wrap">
                    <div>
                      <Text strong className="text-lg">Student Information:</Text>
                      <div className="mt-2">
                        <p><strong>KBTU ID:</strong> {student?.user_data.kbtu_id}</p>
                        <p><strong>Full Name:</strong> {student?.user_data.last_name} {student?.user_data.first_name}</p>
                        <p><strong>Course:</strong> {student?.user_data.course}</p>
                        <p><strong>Specialization:</strong> {student?.user_data.speciality}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-4 md:mt-0">
                      <Button 
                        type={selectedTab === "schedule" ? "primary" : "default"}
                        onClick={() => setSelectedTab("schedule")}
                        className={selectedTab === "schedule" ? "bg-[#002F6C]" : ""}
                      >
                        Schedule Appointment
                      </Button>
                      {/* Fixed the badge issue by using a wrapper div with Badge */}
                      <div>
                        <Badge count={getMyAppointments().length}>
                          <Button 
                            type={selectedTab === "myAppointments" ? "primary" : "default"}
                            onClick={() => setSelectedTab("myAppointments")}
                            className={selectedTab === "myAppointments" ? "bg-[#002F6C]" : ""}
                          >
                            My Appointments
                          </Button>
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
              
              {/* My Appointments Section */}
              {isAuthenticated() && selectedTab === "myAppointments" && (
                <Card className="mb-4" title={<Title level={4}>My Appointments</Title>}>
                  {getMyAppointments().length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="py-3 px-4 border-b text-left">Date</th>
                            <th className="py-3 px-4 border-b text-left">Time</th>
                            <th className="py-3 px-4 border-b text-left">Reason</th>
                            <th className="py-3 px-4 border-b text-left">Status</th>
                            <th className="py-3 px-4 border-b text-left">Note</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getMyAppointments().map((app) => (
                            <tr key={app.id} className="hover:bg-gray-50">
                              <td className="py-3 px-4 border-b">{dayjs(app.date).format('DD.MM.YYYY')}</td>
                              <td className="py-3 px-4 border-b">{app.time.substring(0, 5)}</td>
                              <td className="py-3 px-4 border-b">{app.name}</td>
                              <td className="py-3 px-4 border-b">
                                {getStatusBadge(app.status)}
                              </td>
                              <td className="py-3 px-4 border-b">
                                {app.rejection_reason || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <Alert 
                      message="You have no appointments" 
                      description="You can create a new appointment in the 'Schedule Appointment' tab." 
                      type="info" 
                      showIcon 
                    />
                  )}
                </Card>
              )}
              
              {/* New Appointment Section */}
              {(selectedTab === "schedule" || !isAuthenticated()) && (
                <Card className="mb-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Left side - calendar and time selection */}
                    <div>
                      <Text strong className="text-lg block mb-2">Select a date:</Text>
                      <Calendar
                        fullscreen={false}
                        onChange={handleCalendarChange}
                        disabledDate={(date) => !isDateAvailable(date)}
                        dateFullCellRender={dateCellRender}
                        className="border p-2 rounded-lg shadow-sm"
                      />
                      
                      {/* Time selection */}
                      {selectedDate && (
                        <div className="mt-4">
                          <Text strong className="text-lg block mb-2">Select a time:</Text>
                          <div className="grid grid-cols-4 gap-2">
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
                              <Alert message="No available slots for the selected date" type="info" showIcon className="col-span-4" />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Right side - appointment details */}
                    <div>
                      {/* Course selection - pre-filled from student data */}
                      <div className="mb-4">
                        <Text strong className="text-lg block mb-2">Course:</Text>
                        <Select
                          value={selectedCourse}
                          onChange={(value) => setSelectedCourse(value)}
                          className="w-full"
                          disabled={!isAuthenticated()}
                          size="large"
                        >
                          {courseOptions.map(course => (
                            <Option key={course} value={course}>{course}</Option>
                          ))}
                        </Select>
                      </div>
                      
                      {/* Reason for visit - THE MAIN FIELD */}
                      <div className="mb-4">
                        <Text strong className="text-lg block mb-2">
                          Reason for visit: <span className="text-red-500">*</span>
                        </Text>
                        
                        {/* Quick select common reasons */}
                        <div className="mb-2">
                          <Text className="mb-1 block">Common reasons:</Text>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {commonReasons.slice(0, 4).map((reason) => (
                              <Button 
                                key={reason} 
                                onClick={() => handleCommonReasonSelect(reason)}
                                className={appointmentReason === reason ? "border-blue-500 text-blue-500" : ""}
                              >
                                {reason}
                              </Button>
                            ))}
                          </div>
                        </div>
                        
                        <TextArea
                          rows={4}
                          placeholder="Specify the reason for your visit to the dean's office"
                          value={appointmentReason}
                          onChange={(e) => setAppointmentReason(e.target.value)}
                          className={`${!appointmentReason && 'border-red-300'}`}
                          disabled={!isAuthenticated()}
                          size="large"
                        />
                        {!appointmentReason && (
                          <Text type="danger" className="mt-1">Required field</Text>
                        )}
                      </div>
                      
                      {/* Appointment summary */}
                      {selectedDate && selectedTime && (
                        <Card className="bg-blue-50 mb-4" size="small" title="Appointment Details">
                          <p><strong>Date:</strong> {dayjs(selectedDate).format('DD.MM.YYYY')}</p>
                          <p><strong>Time:</strong> {selectedTime?.substring(0, 5)}</p>
                          <p><strong>Reason:</strong> {appointmentReason || '(not specified)'}</p>
                        </Card>
                      )}
                      
                      {/* Schedule button */}
                      <div className="text-center mt-6">
                        <Button
                          type="primary"
                          size="large"
                          className="bg-[#002F6C] hover:bg-blue-700 h-12 px-8 text-lg"
                          onClick={handleReserveClick}
                          disabled={!isAuthenticated() || !selectedDate || !selectedTime || !appointmentReason}
                        >
                          Schedule Appointment
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
              
              {/* Help section */}
              <Alert
                message="Appointment Information"
                description={
                  <ul className="list-disc pl-5 mt-2">
                    <li>Appointments are available only on weekdays.</li>
                    <li>Please specify the reason for your visit to ensure proper preparation for your appointment.</li>
                    <li>The status of your appointment will be updated after processing by a manager.</li>
                    <li>If you have any questions, please call: +7 (727) 123-45-67.</li>
                  </ul>
                }
                type="info"
                showIcon
              />
            </div>
          )}
        </Card>
      </Content>
      
      {/* Confirmation Modal */}
      <Modal
        title={<Title level={4} className="text-[#002F6C]">Appointment Confirmation</Title>}
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
          <div>
            <div className="p-4 border rounded bg-blue-50 mb-4">
              <p><strong>Student Name:</strong> {student.user_data.last_name} {student.user_data.first_name}</p>
              <p><strong>KBTU ID:</strong> {student.user_data.kbtu_id}</p>
              <p><strong>Course:</strong> {selectedCourse}</p>
              <p><strong>Specialization:</strong> {student.user_data.speciality}</p>
              <p><strong>Date:</strong> {dayjs(selectedDate).format('DD.MM.YYYY')}</p>
              <p><strong>Time:</strong> {selectedTime?.substring(0, 5)}</p>
              <p><strong>Reason for visit:</strong> {appointmentReason}</p>
            </div>
            <Alert 
              message="Note" 
              description="Your appointment will be in 'Pending' status until confirmed by a manager." 
              type="info" 
              showIcon 
            />
          </div>
        )}
      </Modal>

      <Footer />
    </Layout>
  );
}