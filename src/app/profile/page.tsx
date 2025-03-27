"use client";

import { useEffect, useState } from "react";
import { Layout, Card, Typography, Spin, Alert } from "antd";
import { useRouter } from "next/navigation";
import HeaderSection from "../components/Header";
import { Footer } from "../components/Footer";

const { Content } = Layout;
const { Title, Text } = Typography;

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  school: string;
  speciality: string;
  course: number;
}

export default function StudentProfile() {
  const [student, setStudent] = useState<Student | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const studentId = 1; // Можно заменить на динамический ID

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/students/${studentId}/`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch");
        }
        return res.json();
      })
      .then((data: Student) => setStudent(data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <Layout className="min-h-screen flex flex-col">
      <HeaderSection />
      <Content className="flex flex-col items-center justify-center flex-grow bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/images/background.jpg')" }}>
        <Card className="shadow-lg rounded-lg p-6 w-full max-w-md bg-white mt-6">
          <Title level={2} className="text-center text-[#002F6C]">Student Profile</Title>
          {error ? (
            <Alert message="Error" description={error} type="error" showIcon />
          ) : student ? (
            <div className="text-center">
              <Text strong>ID:</Text> <Text>{student.id}</Text>
              <br />
              <Text strong>Name:</Text> <Text>{student.first_name} {student.last_name}</Text>
              <br />
              <Text strong>Email:</Text> <Text>{student.email}</Text>
              <br />
              <Text strong>School:</Text> <Text>{student.school}</Text>
              <br />
              <Text strong>Speciality:</Text> <Text>{student.speciality}</Text>
              <br />
              <Text strong>Course:</Text> <Text>{student.course}</Text>
            </div>
          ) : (
            <div className="flex justify-center">
              <Spin size="large" />
            </div>
          )}
        </Card>
      </Content>
      <Footer />
    </Layout>
  );
}
