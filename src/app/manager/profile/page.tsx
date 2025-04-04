"use client";

import { useEffect, useState } from "react";
import { Layout, Card, Typography, Spin, Alert, Button, Avatar, Divider, Row, Col, Space } from "antd";
import { UserOutlined, MailOutlined, BankOutlined, IdcardOutlined, PhoneOutlined, LogoutOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import HeaderSection from "../components/Header";
import { Footer } from "../components/Footer";

const { Content } = Layout;
const { Title, Text } = Typography;

interface DeanManager {
  first_name: string;
  last_name: string;
  email: string;
  school: string;
  phone_number: string;
  position: string;
}

interface User {
  message: string;
  username: string;
  user_id: number;
  role: string;
  user_data: DeanManager;
}

export default function DeanManagerProfile() {
  const [profile, setProfile] = useState<DeanManager | null>(null);
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
    if (!user || user.role !== "dean manager") return;

    setLoading(true);
    const apiUrl = `http://127.0.0.1:8000/api/manager-profiles/?user=${user.user_id}`;

    fetch(apiUrl)
      .then(res => res.ok ? res.json() : Promise.reject("Failed to fetch user data"))
      .then(data => {
        setProfile(data[0]); // Assuming the response is an array with a single element
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
      <Content 
        className="flex flex-col items-center justify-center flex-grow bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: "url('/images/kbtu1.jpg')",
          padding: "40px 20px" 
        }}
      >
        <Card 
          className="shadow-xl rounded-lg w-full max-w-3xl bg-white" 
          bordered={false}
          style={{ overflow: 'hidden' }}
        >
          {error ? (
            <Alert 
              message="Error" 
              description={error} 
              type="error" 
              showIcon 
              action={
                <Button size="small" type="primary" onClick={() => router.push('/login')}>
                  Log In
                </Button>
              }
            />
          ) : loading ? (
            <div className="flex justify-center py-12">
              <Spin size="large" tip="Loading profile information..." />
            </div>
          ) : profile ? (
            <>
              {/* Profile Header with Avatar */}
              <div 
                style={{ 
                  background: 'linear-gradient(135deg, #002F6C 0%, #1890ff 100%)',
                  padding: '24px',
                  textAlign: 'center',
                  marginBottom: '20px'
                }}
              >
                <Avatar 
                  size={120} 
                  icon={<UserOutlined />} 
                  style={{ 
                    backgroundColor: '#fff',
                    color: '#002F6C',
                    marginBottom: '16px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                  }} 
                />
                <Title 
                  level={2} 
                  style={{ 
                    color: '#ffffff', 
                    margin: 0,
                    marginTop: '8px'
                  }}
                >
                  {profile.first_name} {profile.last_name}
                </Title>
                <Text style={{ color: '#e6f7ff' }}>{profile.position}</Text>
              </div>

              {/* Profile Information in Two Columns */}
              <div style={{ padding: '0 24px 24px' }}>
                <Divider orientation="center" style={{ margin: '0 0 24px 0' }}>Profile Information</Divider>
                
                <Row gutter={[32, 16]}>
                  {/* Left Column */}
                  <Col xs={24} md={12}>
                    <div style={{ marginBottom: '16px' }}>
                      <Space>
                        <MailOutlined style={{ color: '#002F6C' }} />
                        <Text strong>Email:</Text>
                      </Space>
                      <div style={{ paddingLeft: '24px' }}>{profile.email}</div>
                    </div>
                    
                    <div style={{ marginBottom: '16px' }}>
                      <Space>
                        <PhoneOutlined style={{ color: '#002F6C' }} />
                        <Text strong>Phone:</Text>
                      </Space>
                      <div style={{ paddingLeft: '24px' }}>{profile.phone_number}</div>
                    </div>
                  </Col>
                  
                  {/* Right Column */}
                  <Col xs={24} md={12}>
                    <div style={{ marginBottom: '16px' }}>
                      <Space>
                        <IdcardOutlined style={{ color: '#002F6C' }} />
                        <Text strong>Position:</Text>
                      </Space>
                      <div style={{ paddingLeft: '24px' }}>{profile.position}</div>
                    </div>
                    
                    <div style={{ marginBottom: '16px' }}>
                      <Space>
                        <BankOutlined style={{ color: '#002F6C' }} />
                        <Text strong>School:</Text>
                      </Space>
                      <div style={{ paddingLeft: '24px' }}>{profile.school}</div>
                    </div>
                  </Col>
                </Row>

                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                  <Button 
                    type="primary" 
                    icon={<LogoutOutlined />} 
                    onClick={handleLogout}
                    size="large"
                    style={{ 
                      backgroundColor: '#002F6C', 
                      borderColor: '#002F6C',
                      boxShadow: '0 2px 0 rgba(0,0,0,0.045)'
                    }}
                  >
                    Logout
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <Alert 
              message="No Profile Found" 
              description="Unable to load profile data. Please try logging in again." 
              type="warning" 
              showIcon 
              action={
                <Button size="small" type="primary" onClick={() => router.push('/login')}>
                  Log In
                </Button>
              }
            />
          )}
        </Card>
      </Content>
      <Footer />
    </Layout>
  );
}