"use client";

import { useState } from "react";
import { Layout, Button, Calendar, Input, Typography } from "antd";
import HeaderSection from "../components/Header";
import { Footer } from "../components/Footer";

const { Content } = Layout;
const { Title } = Typography;

export default function Requests() {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const courses = ["1 course", "2 course", "3 course", "4 course", "5-7 course"];
  const times = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

  const handleReserve = () => {
    window.location.href = "https://outlook.office365.com/owa/calendar/Equeuetodeansoffice@kbtu.kz/bookings/";
  };

  return (
    <Layout>
      <HeaderSection />
      <Content
        className="flex flex-col items-center p-10 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/kbtu-bg.jpeg')" }}
      >
        <Title level={2} className="text-white bg-[#002F6C] bg-opacity-70 px-4 py-2 rounded-lg">
          Virtual Dean's Office
        </Title>
        <div className="bg-white p-8 shadow-lg rounded-lg w-full max-w-3xl mt-6">
          <Title level={4} className="text-[#002F6C]">Select course:</Title>
          <div className="flex gap-3 mb-4">
            {courses.map((course) => (
              <Button
                key={course}
                type={selectedCourse === course ? "primary" : "default"}
                onClick={() => setSelectedCourse(course)}
                className={`text-[#002F6C] border-[#002F6C] ${selectedCourse === course ? "bg-[#002F6C] text-white" : ""}`}
              >
                {course}
              </Button>
            ))}
          </div>

          <Title level={4} className="text-[#002F6C]">Select date:</Title>
          <Calendar
            fullscreen={false}
            onSelect={(date) => setSelectedDate(date.format("YYYY-MM-DD"))}
            className="mb-4 text-[#002F6C]"
          />

          <Title level={4} className="text-[#002F6C]">Select time:</Title>
          <div className="grid grid-cols-4 gap-3 mb-4">
            {times.map((time) => (
              <Button
                key={time}
                type={selectedTime === time ? "primary" : "default"}
                onClick={() => setSelectedTime(time)}
                className={`text-[#002F6C] border-[#002F6C] ${selectedTime === time ? "bg-[#002F6C] text-white" : ""}`}
              >
                {time}
              </Button>
            ))}
          </div>

          <Title level={4} className="text-[#002F6C]">Add comment:</Title>
          <Input.TextArea rows={2} placeholder="Enter your comment" className="mb-4 border-[#002F6C] text-[#002F6C]" />

          {/* Кнопка резервирования */}
          <Button
            type="primary"
            className="w-full bg-[#002F6C] text-white py-2 font-semibold rounded-md mt-4"
            onClick={handleReserve}
          >
            Reserve Now
          </Button>
        </div>
      </Content>
      <Footer />
    </Layout>
  );
}

