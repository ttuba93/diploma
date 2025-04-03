"use client";

import { useEffect, useState } from "react";
import { Layout, Card, Typography, Spin, Alert } from "antd";
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
  role?: string;
  user?: number;
  id?: number;
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
  user?: number;
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
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    console.log("Stored user from localStorage:", storedUser);
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log("Parsed user:", parsedUser);
        setUser(parsedUser);
      } catch (err) {
        console.error("Error parsing user from localStorage:", err);
        setError("Failed to load user data");
        setLoading(false);
      }
    } else {
      setLoading(false);
      setError("No user data found. Please log in again.");
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    let apiUrl = "";
    if (user.role === "student") {
      apiUrl = `http://127.0.0.1:8000/api/students/user/${user.user_id}`;  // Removed trailing slash
    } else if (user.role === "dean manager") {
      apiUrl = `http://127.0.0.1:8000/api/manager-profiles/?user=${user.user_id}`;
    } else {
      setError(`Unsupported user role: ${user.role}`);
      setLoading(false);
      return;
    }

    console.log("Fetching from API URL:", apiUrl);
    
    fetch(apiUrl)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch user data: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("API response:", data);
        
        // Handle array response for manager profiles
        if (user.role === "dean manager" && Array.isArray(data) && data.length > 0) {
          setProfile(data[0]);
        } else if (user.role === "student") {
          setProfile(data);
        } else if (Array.isArray(data) && data.length === 0) {
          throw new Error("No profile data found for this user");
        } else {
          setProfile(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setError(err.message);
        setLoading(false);
      });
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
          ) : loading ? (
            <div className="flex justify-center py-4">
              <Spin size="large" />
            </div>
          ) : profile ? (
            <div className="text-center">
              {user?.role === "student" ? (
                <>
                  <Text strong>ID:</Text> <Text>{(profile as Student).kbtu_id}</Text>
                  <br />
                  <Text strong>Name:</Text> <Text>{(profile as Student).first_name} {(profile as Student).last_name}</Text>
                  <br />
                  <Text strong>Middle Name:</Text> <Text>{(profile as Student).middle_name || "N/A"}</Text>
                  <br />
                  <Text strong>Email:</Text> <Text>{(profile as Student).email}</Text>
                  <br />
                  <Text strong>School:</Text> <Text>{(profile as Student).school}</Text>
                  <br />
                  <Text strong>Speciality:</Text> <Text>{(profile as Student).speciality}</Text>
                  <br />
                  <Text strong>Course:</Text> <Text>{(profile as Student).course}</Text>
                  <br />
                  <Text strong>Phone:</Text> <Text>{(profile as Student).telephone_number || "N/A"}</Text>
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
            <Alert 
              message="No Profile Found" 
              description="Unable to load profile data. Please try logging in again." 
              type="warning" 
              showIcon 
            />
          )}
        </Card>
      </Content>
      <Footer />
    </Layout>
  );
}