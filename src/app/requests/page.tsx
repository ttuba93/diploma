'use client';

import { useEffect, useState } from "react";
import { Layout, Button, List, Card, Tag, Collapse, Empty, Spin, message } from "antd";
import HeaderSession from "../components/Header";
import { Footer } from "../components/Footer";

const { Content } = Layout;
const { Panel } = Collapse;

const API_BASE_URL = "http://localhost:8000/api";

// Define interfaces for type safety
interface Student {
  first_name: string;
  last_name: string;
  kbtu_id: string;
  course: number;
  speciality: string;
}

interface Question {
  id: number;
  topic: string;
  description: string;
  answer: string | null;
  is_answered: boolean;
  created_at: string;
  student?: Student;
}

interface ActiveRequest {
  id: string | null;
  currentStep: number;
  docsAccepted: boolean;
  docsRejected: boolean;
  feedbackReceived: string | null;
}

export default function StudentFaqRequests() {
  const [loading, setLoading] = useState<boolean>(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeRequests, setActiveRequests] = useState<ActiveRequest[]>([]);
  const [username, setUsername] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("");
  const [studentDetails, setStudentDetails] = useState<Student | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUsername(userData.username);
      // Assuming the student ID is stored in the user object or can be derived from it
      // For demo purposes, we'll use "21B000001" from the screenshot
      setStudentId("21B000001");
      fetchStudentDetails();
      fetchQuestions();
      fetchActiveRequests();
    }
  }, []);

  const fetchStudentDetails = async () => {
    try {
      // Using the API endpoint shown in the screenshot
      const response = await fetch(`${API_BASE_URL}/faq-requests/student/1/`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        setStudentDetails(data[0].student);
      }
    } catch (error) {
      console.error("Error fetching student details:", error);
      message.error("Не удалось загрузить информацию о студенте");
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      // Using the API endpoint shown in the screenshot
      const response = await fetch(`${API_BASE_URL}/faq-requests/student/1/`);
      const data = await response.json();
      
      // Filter questions that are not part of active requests
      setQuestions(data || []);
    } catch (error) {
      console.error("Error fetching questions:", error);
      message.error("Не удалось загрузить вопросы");
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveRequests = async () => {
    setLoading(true);
    try {
      // This would be a separate endpoint for active document requests
      // For now, we'll simulate this with the existing data structure from the code
      const requests: ActiveRequest[] = [];
      
      // Here we're simulating the steps from the original code
      if (localStorage.getItem("processId")) {
        const currentStep = Number(localStorage.getItem("currentStep")) || 0;
        const docsAccepted = Boolean(localStorage.getItem("docsAccepted")) === true;
        const docsRejected = Boolean(localStorage.getItem("docsRejected")) === true;
        const feedbackReceived = localStorage.getItem("feedbackReceived");
        
        requests.push({
          id: localStorage.getItem("processId"),
          currentStep,
          docsAccepted,
          docsRejected,
          feedbackReceived
        });
      }
      
      setActiveRequests(requests);
    } catch (error) {
      console.error("Error fetching active requests:", error);
      message.error("Не удалось загрузить активные запросы");
    } finally {
      setLoading(false);
    }
  };

  const handleNewQuestion = () => {
    // Redirect to a new question form or open a modal
    message.info("Здесь будет форма для нового вопроса");
  };

  const startNewProcess = () => {
    // Reuse the logic from the original code
    message.info("Перенаправление на страницу создания нового запроса");
    // Redirect to the StudentRequests page or open the process in a modal
    window.location.href = "/student-requests";
  };

  const renderQuestionsList = () => {
    if (loading) {
      return <Spin size="large" />;
    }

    if (questions.length === 0) {
      return <Empty description="У вас пока нет вопросов" />;
    }

    return (
      <List
        itemLayout="vertical"
        dataSource={questions}
        renderItem={(item: Question) => (
          <List.Item
            key={item.id}
            extra={
              <div>
                <Tag color={item.is_answered ? "green" : "orange"}>
                  {item.is_answered ? "Отвечен" : "Ожидает ответа"}
                </Tag>
                <div>{new Date(item.created_at).toLocaleDateString()}</div>
              </div>
            }
          >
            <List.Item.Meta
              title={item.topic}
              description={`Тема: ${item.topic}`}
            />
            <div>
              <p><strong>Вопрос:</strong> {item.description}</p>
              {item.is_answered && item.answer && (
                <div style={{ backgroundColor: "#f9f9f9", padding: "10px", borderRadius: "5px", marginTop: "10px" }}>
                  <p><strong>Ответ:</strong> {item.answer}</p>
                </div>
              )}
            </div>
          </List.Item>
        )}
      />
    );
  };

  const renderActiveRequests = () => {
    if (activeRequests.length === 0) {
      return <Empty description="У вас нет активных запросов" />;
    }

    // Create steps similar to the original code
    const studentSteps = [
      { title: "Запрос отправлен", key: "request_sent" },
      { title: "Загрузка документа", key: "upload_docs" },
      { title: "Документы отправлены", key: "docs_sent" },
      { title: "Проверка документов", key: "waiting_for_verification" },
      { title: "Статус документов", key: "docs_status" }
    ];

    return (
      <Collapse defaultActiveKey={['1']}>
        {activeRequests.map((request, index) => (
          <Panel header={`Запрос №${request.id}`} key={index + 1}>
            <List
              size="small"
              bordered
              dataSource={studentSteps}
              renderItem={(step, stepIndex) => {
                let status = "default";
                if (stepIndex < request.currentStep) status = "success";
                if (stepIndex === request.currentStep) status = "processing";
                
                // Custom title for the last step
                let title = step.title;
                if (stepIndex === 4) {
                  if (request.docsAccepted) title = "Документы приняты";
                  if (request.docsRejected) title = "Документы отклонены";
                }
                
                return (
                  <List.Item>
                    <Tag color={
                      status === "success" ? "green" : 
                      status === "processing" ? "blue" :
                      "default"
                    }>
                      {title}
                    </Tag>
                  </List.Item>
                );
              }}
            />
            
            {request.currentStep === 4 && request.docsRejected && request.feedbackReceived && (
              <div style={{ 
                padding: 10, 
                border: '1px solid #f5222d', 
                borderRadius: 4, 
                backgroundColor: '#fff1f0',
                marginTop: 10
              }}>
                <p>Комментарий проверяющего:</p>
                {request.feedbackReceived}
              </div>
            )}
            
            {request.currentStep < 4 && (
              <Button
                type="primary"
                style={{ marginTop: 10, backgroundColor: "#002F6C" }}
                onClick={() => window.location.href = "/student-requests"}
              >
                Перейти к запросу
              </Button>
            )}
          </Panel>
        ))}
      </Collapse>
    );
  };

  return (
    <Layout>
      <HeaderSession />
      <Content style={{ padding: "20px", maxWidth: 800, margin: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h1>Мои вопросы и запросы</h1>
          <div>
            <Button 
              type="primary" 
              onClick={handleNewQuestion}
              style={{ marginRight: 10, backgroundColor: "#002F6C" }}
            >
              Задать вопрос
            </Button>
            <Button 
              type="primary" 
              onClick={startNewProcess}
              style={{ backgroundColor: "#002F6C" }}
            >
              Новый запрос документов
            </Button>
          </div>
        </div>

        {studentDetails && (
          <Card style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <p><strong>Студент:</strong> {studentDetails.first_name} {studentDetails.last_name}</p>
                <p><strong>ID:</strong> {studentDetails.kbtu_id}</p>
              </div>
              <div>
                <p><strong>Курс:</strong> {studentDetails.course}</p>
                <p><strong>Специальность:</strong> {studentDetails.speciality}</p>
              </div>
            </div>
          </Card>
        )}

        <Card title="Мои вопросы" style={{ marginBottom: 20 }}>
          {renderQuestionsList()}
        </Card>

        <Card title="Мои запросы документов">
          {renderActiveRequests()}
        </Card>
      </Content>
      <Footer />
    </Layout>
  );
}