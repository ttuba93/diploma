"use client";

import { useEffect, useState } from "react";
import { Layout, Card, Typography, Spin, Alert } from "antd";
import { useRouter } from "next/navigation";
import HeaderSection from "../components/Header";
import { Footer } from "../components/Footer";

const { Content } = Layout;
const { Title, Text } = Typography;

interface Student {
  kbtu_id: number;
  first_name: string;
  last_name: string;
  email: string;
  school: string;
  speciality: string;
  course: number;
}

interface ManagerProfile {
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  school: string;
  phone_number: string;
  role: string;
  position: string;
}

interface User {
  message: string;
  username: string;
  user_id: number;
  role: string;
}

export default function UserProfile() {
  const [profile, setProfile] = useState<Student | ManagerProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    let apiUrl = "";
    if (user.role === "student") {
      apiUrl = `http://127.0.0.1:8000/api/students/user/${user.user_id}/`;
    } else if (user.role === "dean" || user.role === "manager") {
      apiUrl = `http://127.0.0.1:8000/api/manager-profiles/?user=${user.user_id}`;
    }

    if (apiUrl) {
      fetch(apiUrl)
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to fetch user data");
          }
          return res.json();
        })
        .then((data) => setProfile(data))
        .catch((err) => setError(err.message));
    }
  }, [user]);

  return (
    <Layout className="min-h-screen flex flex-col">
      <HeaderSection />
      <Content
        className="flex flex-col items-center justify-center flex-grow bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/kbtu1.jpg')" }}
      >
        <Card className="shadow-lg rounded-lg p-6 w-full max-w-md bg-white mt-6">
          <Title level={2} className="text-center text-[#002F6C]">
            {user?.role === "student" ? "Student Profile" : "Manager/Dean Profile"}
          </Title>
          {error ? (
            <Alert message="Error" description={error} type="error" showIcon />
          ) : profile ? (
            <div className="text-center">
              {user?.role === "student" ? (
                <>
                  <Text strong>ID:</Text> <Text>{(profile as Student).kbtu_id}</Text>
                  <br />
                  <Text strong>Name:</Text> <Text>{(profile as Student).first_name} {(profile as Student).last_name}</Text>
                  <br />
                  <Text strong>Email:</Text> <Text>{(profile as Student).email}</Text>
                  <br />
                  <Text strong>School:</Text> <Text>{(profile as Student).school}</Text>
                  <br />
                  <Text strong>Speciality:</Text> <Text>{(profile as Student).speciality}</Text>
                  <br />
                  <Text strong>Course:</Text> <Text>{(profile as Student).course}</Text>
                </>
              ) : (
                <>
                  <Text strong>Name:</Text> <Text>{(profile as ManagerProfile).first_name} {(profile as ManagerProfile).last_name}</Text>
                  <br />
                  <Text strong>Middle Name:</Text> <Text>{(profile as ManagerProfile).middle_name || "N/A"}</Text>
                  <br />
                  <Text strong>Email:</Text> <Text>{(profile as ManagerProfile).email}</Text>
                  <br />
                  <Text strong>School:</Text> <Text>{(profile as ManagerProfile).school}</Text>
                  <br />
                  <Text strong>Phone:</Text> <Text>{(profile as ManagerProfile).phone_number}</Text>
                  <br />
                  <Text strong>Role:</Text> <Text>{(profile as ManagerProfile).role}</Text>
                  <br />
                  <Text strong>Position:</Text> <Text>{(profile as ManagerProfile).position}</Text>
                </>
              )}
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
