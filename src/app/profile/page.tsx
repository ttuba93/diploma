"use client";

import { useEffect, useState } from "react";
import { Layout, Card, Typography, Spin, Alert, Button } from "antd";
import { useRouter } from "next/navigation";
import HeaderSection from "../components/Header";
import { Footer } from "../components/Footer";

const { Content } = Layout;
const { Title, Text } = Typography;

interface Student {
  kbtu_id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  school: string;
  speciality: string;
  course: number;
  telephone_number?: string;
}

interface User {
  message: string;
  username: string;
  user_id: number;
  role: string;
}

export default function UserProfile() {
  const [profile, setProfile] = useState<Student | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        setError("Failed to load user data");
      }
    } else {
      setError("No user data found. Please log in again.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user || user.role !== "student") return;

    setLoading(true);
    const apiUrl = `http://127.0.0.1:8000/api/students/user/${user.user_id}`;

    fetch(apiUrl)
      .then(res => res.ok ? res.json() : Promise.reject("Failed to fetch user data"))
      .then(data => {
        setProfile(data);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <Layout className="min-h-screen flex flex-col">
      <HeaderSection />
      <Content className="flex flex-col items-center justify-center flex-grow bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/kbtu1.jpg')" }}>
        <Card className="shadow-lg rounded-lg p-6 w-full max-w-md bg-white mt-6">
          <Title level={2} className="text-center text-[#002F6C]">
            Student Profile
          </Title>
          {error ? (
            <Alert message="Error" description={error} type="error" showIcon />
          ) : loading ? (
            <div className="flex justify-center py-4"><Spin size="large" /></div>
          ) : profile ? (
            <div className="text-center">
              <Text strong>Name:</Text> <Text>{profile.first_name} {profile.last_name}</Text><br />
              {"middle_name" in profile && (<><Text strong>Middle Name:</Text> <Text>{profile.middle_name || "N/A"}</Text><br /></>)}
              <Text strong>Email:</Text> <Text>{profile.email}</Text><br />
              <Text strong>School:</Text> <Text>{profile.school}</Text><br />
              <Text strong>Speciality:</Text> <Text>{profile.speciality}</Text><br />
              <Text strong>Course:</Text> <Text>{profile.course}</Text><br />
              {"telephone_number" in profile && (<><Text strong>Phone:</Text> <Text>{profile.telephone_number || "N/A"}</Text><br /></>)}
              <Button type="primary" danger className="mt-4" onClick={handleLogout}>Logout</Button>
            </div>
          ) : (
            <Alert message="No Profile Found" description="Unable to load profile data. Please try logging in again." type="warning" showIcon />
          )}
        </Card>
      </Content>
      <Footer />
    </Layout>
  );
}
