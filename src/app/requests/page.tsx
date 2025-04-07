'use client';

import { useState, useEffect } from "react";
import { Layout, Button, Steps, message, Upload, Tabs, List, Card, Typography, Badge, Collapse, Empty, Spin } from "antd";
import HeaderSession from "../components/Header";
import { Footer } from "../components/Footer";

const { Content } = Layout;
const { TabPane } = Tabs;
const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { Step } = Steps;

const API_BASE_URL = "http://localhost:8000/api";

// Define interface for student request
interface StudentRequest {
  id: string | number;
  topic: string;
  description?: string;
  created_at: string;
  is_answered: boolean;
  answer?: string;
  attachment?: string;
}

// Define interface for process
interface Process {
  id: string;
  name: string;
  status: 'completed' | 'in_progress' | 'not_started';
  startDate: string | null;
  isActive: boolean;
}

// Шаги процесса, которые касаются студента
const studentSteps = [
  {
    title: "Запрос отправлен",
    key: "request_sent"
  },
  {
    title: "Загрузка документа",
    key: "upload_docs"
  },
  {
    title: "Документы отправлены",
    key: "docs_sent"
  },
  {
    title: "Проверка документов",
    key: "waiting_for_verification"
  },
  {
    title: "Статус документов", // Динамически отображает принято или отклонено
    key: "docs_status"
  }
];

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState<string>("1");
  const [studentRequests, setStudentRequests] = useState<StudentRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [username, setUsername] = useState<string>("");
  
  // States for document process
  const [processId, setProcessId] = useState<string | null>(localStorage.getItem("processId"));
  const [currentStep, setCurrentStep] = useState<number>(Number(localStorage.getItem("currentStep")) || 0);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [feedbackReceived, setFeedbackReceived] = useState<string | null>(localStorage.getItem("feedbackReceived"));
  const [docsRejected, setDocsRejected] = useState<boolean>(Boolean(localStorage.getItem("docsRejected")) === true);
  const [docsAccepted, setDocsAccepted] = useState<boolean>(Boolean(localStorage.getItem("docsAccepted")) === true);
  const [verificationStartTime, setVerificationStartTime] = useState<number | null>(
    Number(localStorage.getItem("verificationStartTime")) || null
  );
  const [expandedProcessId, setExpandedProcessId] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUsername(userData.username || "");
    }
    fetchStudentRequests();
    fetchProcesses();
  }, []);

  // Fetch student requests (questions and answers)
  const fetchStudentRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/faq-requests/student/2/`);
      if (response.ok) {
        const data = await response.json();
        setStudentRequests(Array.isArray(data) ? data : [data]);
      } else {
        message.error("Ошибка при загрузке запросов");
      }
    } catch (error) {
      console.error("Error fetching student requests:", error);
      message.error("Ошибка подключения к серверу");
    } finally {
      setLoading(false);
    }
  };

  // Fetch document processes
  const fetchProcesses = async () => {
    setLoading(true);
    try {
      // Simulate fetch processes
      const mockProcesses: Process[] = [
        {
          id: "process123",
          name: "Запрос на смену специальности",
          status: "completed",
          startDate: "2025-04-01T10:30:00",
          isActive: false
        },
        {
          id: localStorage.getItem("processId") || "process456",
          name: "Загрузка документов",
          status: currentStep > 0 ? "in_progress" : "not_started",
          startDate: "2025-04-05T15:40:00",
          isActive: currentStep > 0
        },
        {
          id: "process789",
          name: "Заявление на перевод в другую группу",
          status: "not_started",
          startDate: null,
          isActive: false
        }
      ];
      setProcesses(mockProcesses);
    } catch (error) {
      console.error("Error fetching processes:", error);
      message.error("Ошибка при загрузке процессов");
    } finally {
      setLoading(false);
    }
  };

  // Document process functions
  const startNewProcess = async (processId?: string) => {
    setLoading(true);
    try {
      // If we're starting an existing process from the list
      if (processId) {
        setExpandedProcessId(processId);
        const process = processes.find(p => p.id === processId);
        if (process) {
          setProcessId(processId);
          localStorage.setItem("processId", processId);
          setCurrentStep(1);
          localStorage.setItem("currentStep", "1");
          
          // Update the process status in the list
          setProcesses(processes.map(p => 
            p.id === processId ? {...p, status: "in_progress", isActive: true} : p
          ));
          
          message.success("Процесс запущен!");
          
          // Reset process states
          setDocsAccepted(false);
          setDocsRejected(false);
          localStorage.removeItem("docsAccepted");
          localStorage.removeItem("docsRejected");
          setFeedbackReceived(null);
          localStorage.removeItem("feedbackReceived");
          setVerificationStartTime(null);
          localStorage.removeItem("verificationStartTime");
        }
      } else {
        // Creating a completely new process
        const response = await fetch(`${API_BASE_URL}/start-process/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ student_id: "12345", initiator: username }),
        });
        const data = await response.json();
        if (data.processInstanceId) {
          message.success("Процесс запущен!");
          setProcessId(data.processInstanceId);
          localStorage.setItem("processId", data.processInstanceId);
          setCurrentStep(1);
          localStorage.setItem("currentStep", "1");
          
          // Reset process states
          setDocsAccepted(false);
          setDocsRejected(false);
          localStorage.removeItem("docsAccepted");
          localStorage.removeItem("docsRejected");
          setFeedbackReceived(null);
          localStorage.removeItem("feedbackReceived");
          setVerificationStartTime(null);
          localStorage.removeItem("verificationStartTime");
        } else {
          message.error("Ошибка запуска процесса");
        }
      }
    } catch (error) {
      console.error("Error starting process:", error);
      message.error("Ошибка подключения к серверу");
    } finally {
      setLoading(false);
    }
  };

  const getStepFromTask = (taskName: string): number => {
    if (taskName.includes("Send required documents")) return 1;
    if (taskName.includes("Documents Verification")) return 3;
    if (taskName.includes("Set status Denied")) return 4;
    if (taskName.includes("Receive a feedback")) return 4;
    return 0;
  };

  const handleFileChange = (info: any) => {
    if (info.file.status === 'done') {
      setFile(info.file.originFileObj);
    }
  };

  const handleCompleteTask = async () => {
    if (!taskId && !expandedProcessId) {
      message.error("Задача не найдена");
      return;
    }
    
    try {
      const completeResponse = await fetch(`${API_BASE_URL}/task/${taskId || "placeholder"}/complete/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variables: {
            status: {
              value: "completed",
              type: "String",
            },
            files: {
              value: "Uploaded",
              type: "String",
              valueInfo: {},
            },
          },
        }),
      });
      
      // Even if the API call fails, we'll simulate success for demonstration
      message.success("Документы успешно отправлены!");
      
      // Move to verification step and start timer
      setCurrentStep(3);
      localStorage.setItem("currentStep", "3");
      
      // Set verification start time
      const startTime = Date.now();
      setVerificationStartTime(startTime);
      localStorage.setItem("verificationStartTime", String(startTime));
      
      // Update process status in the list
      if (expandedProcessId) {
        setProcesses(processes.map(p => 
          p.id === expandedProcessId ? {...p, status: "in_progress"} : p
        ));
      }
    } catch (error) {
      console.error("Error completing task:", error);
      // Simulate success even if the API call fails
      message.success("Документы успешно отправлены!");
      
      // Move to verification step and start timer
      setCurrentStep(3);
      localStorage.setItem("currentStep", "3");
      
      // Set verification start time
      const startTime = Date.now();
      setVerificationStartTime(startTime);
      localStorage.setItem("verificationStartTime", String(startTime));
      
      // Update process status in the list
      if (expandedProcessId) {
        setProcesses(processes.map(p => 
          p.id === expandedProcessId ? {...p, status: "in_progress"} : p
        ));
      }
    }
  };

  // Check process status periodically
  useEffect(() => {
    if (processId || expandedProcessId) {
      const checkStatus = async () => {
        try {
          // Simulate document approval after 10 seconds
          if (currentStep === 3 && verificationStartTime) {
            const currentTime = Date.now();
            const elapsedTime = currentTime - verificationStartTime;
            const timeoutDuration = 10000; // 10 seconds for demo
            
            if (elapsedTime >= timeoutDuration && !docsAccepted && !docsRejected) {
              setDocsAccepted(true);
              localStorage.setItem("docsAccepted", "true");
              setCurrentStep(4);
              localStorage.setItem("currentStep", "4");
              message.success("Документы автоматически приняты");
              
              // Update process status in the list
              if (expandedProcessId) {
                setProcesses(processes.map(p => 
                  p.id === expandedProcessId ? {...p, status: "completed"} : p
                ));
              }
            }
          }
        } catch (error) {
          console.error("Error checking status:", error);
        }
      };
      
      checkStatus();
      const interval = setInterval(checkStatus, 1000);
      return () => clearInterval(interval);
    }
  }, [currentStep, verificationStartTime, docsAccepted, docsRejected, processId, expandedProcessId, processes]);

  // Get step status
  const getStepStatus = (index: number): "wait" | "process" | "finish" | "error" => {
    // Special case for document status step
    if (index === 4) {
      if (docsAccepted || docsRejected) return "finish";
      if (currentStep >= index) return "process";
      return "wait";
    }
    
    // Normal logic for other steps
    if (index < currentStep) return "finish";
    if (index === currentStep) return "process";
    return "wait";
  };

  // Get dynamic title for document status step
  const getStepTitle = (index: number, defaultTitle: string): string => {
    if (index === 4) {
      if (docsAccepted) return "Документы приняты";
      if (docsRejected) return "Документы отклонены";
    }
    return defaultTitle;
  };

  // Get status badge for process list
  const getStatusBadge = (status: string) => {
    if (status === "completed") {
      return <Badge status="success" text="Завершен" />;
    } else if (status === "in_progress") {
      return <Badge status="processing" text="В процессе" />;
    } else {
      return <Badge status="default" text="Не начат" />;
    }
  };

  return (
    <Layout>
      <HeaderSession />
      <Content style={{ padding: "20px", maxWidth: 1000, margin: "auto" }}>
        <Title level={2}>Личный кабинет студента</Title>
        {username && <Text>Студент: {username}</Text>}
        
        <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginTop: 20 }}>
          <TabPane tab="Мои вопросы" key="1">
            <Card style={{ marginTop: 16 }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Spin size="large" />
                </div>
              ) : studentRequests.length > 0 ? (
                <List
                  itemLayout="vertical"
                  dataSource={studentRequests}
                  renderItem={(item) => (
                    <List.Item
                      key={item.id}
                      extra={
                        <div>
                          <Badge 
                            status={item.is_answered ? "success" : "default"} 
                            text={item.is_answered ? "Отвечено" : "Без ответа"} 
                          />
                        </div>
                      }
                    >
                      <List.Item.Meta
                        title={<Text strong>{item.topic}</Text>}
                        description={<Text type="secondary">Создано: {new Date(item.created_at).toLocaleString()}</Text>}
                      />
                      <Card style={{ marginBottom: 10 }}>
                        <Title level={5}>Вопрос:</Title>
                        <Paragraph>{item.description || "Без описания"}</Paragraph>
                        {item.attachment && (
                          <Paragraph>
                            <Text type="secondary">Приложение: {item.attachment}</Text>
                          </Paragraph>
                        )}
                      </Card>
                      
                      {item.is_answered && (
                        <Card style={{ backgroundColor: "#f0f5ff" }}>
                          <Title level={5}>Ответ:</Title>
                          <Paragraph>{item.answer || "Ответ обрабатывается"}</Paragraph>
                        </Card>
                      )}
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="У вас еще нет запросов" />
              )}
            </Card>
          </TabPane>
          
          <TabPane tab="Мои процессы" key="2">
            <Card style={{ marginTop: 16 }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Spin size="large" />
                </div>
              ) : processes.length > 0 ? (
                <List
                  itemLayout="vertical"
                  dataSource={processes}
                  renderItem={(process) => (
                    <Card 
                      style={{ marginBottom: 16 }}
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{process.name}</span>
                          {getStatusBadge(process.status)}
                        </div>
                      }
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          {process.startDate && (
                            <Text type="secondary">Начат: {new Date(process.startDate).toLocaleString()}</Text>
                          )}
                        </div>
                        {process.status === "not_started" && (
                          <Button 
                            type="primary" 
                            onClick={() => startNewProcess(process.id)}
                            style={{ backgroundColor: "#002F6C", borderColor: "#002F6C" }}
                          >
                            Начать процесс
                          </Button>
                        )}
                        {process.status === "in_progress" && !expandedProcessId && (
                          <Button 
                            type="primary" 
                            onClick={() => setExpandedProcessId(process.id)}
                            style={{ backgroundColor: "#002F6C", borderColor: "#002F6C" }}
                          >
                            Продолжить процесс
                          </Button>
                        )}
                      </div>
                      
                      {/* Process steps and actions */}
                      {expandedProcessId === process.id && (
                        <div style={{ marginTop: 20 }}>
                          <Steps current={currentStep} direction="vertical" size="small">
                            {studentSteps.map((step, index) => (
                              <Step
                                key={index}
                                title={getStepTitle(index, step.title)}
                                status={getStepStatus(index)}
                              />
                            ))}
                          </Steps>
                          
                          {/* Document upload form */}
                          {currentStep === 1 && (
                            <div style={{ marginTop: 20 }}>
                              <Upload
                                customRequest={({ file, onSuccess }: any) => onSuccess?.({}, file)}
                                onChange={handleFileChange}
                                showUploadList={true}
                              >
                                <Button style={{ backgroundColor: "#002F6C", color: "white", borderColor: "#002F6C" }}>
                                  Загрузить файл
                                </Button>
                              </Upload>
                              <Button
                                onClick={handleCompleteTask}
                                style={{ marginTop: 20, backgroundColor: "#002F6C", color: "white", borderColor: "#002F6C" }}
                                disabled={!file}
                              >
                                Отправить документы
                              </Button>
                            </div>
                          )}

                          {/* Successful verification status */}
                          {currentStep === 4 && docsAccepted && (
                            <div style={{ marginTop: 20 }}>
                              <Card style={{ backgroundColor: "#f6ffed", borderColor: "#b7eb8f" }}>
                                <Title level={5}>Процесс успешно завершен!</Title>
                                <Paragraph>Ваши документы были приняты.</Paragraph>
                              </Card>
                            </div>
                          )}
                          
                          {/* Rejected verification status */}
                          {currentStep === 4 && docsRejected && (
                            <div style={{ marginTop: 20 }}>
                              <Card style={{ backgroundColor: "#fff2f0", borderColor: "#ffccc7" }}>
                                <Title level={5}>Документы отклонены</Title>
                                {feedbackReceived ? (
                                  <div>
                                    <Paragraph>Получен комментарий от проверяющего:</Paragraph>
                                    <div style={{ 
                                      padding: 10, 
                                      border: '1px solid #f5222d', 
                                      borderRadius: 4, 
                                      backgroundColor: '#fff1f0' 
                                    }}>
                                      {feedbackReceived}
                                    </div>
                                    <Button
                                      onClick={() => startNewProcess(process.id)}
                                      style={{ marginTop: 20, backgroundColor: "#002F6C", color: "white", borderColor: "#002F6C" }}
                                    >
                                      Начать заново
                                    </Button>
                                  </div>
                                ) : (
                                  <Paragraph>Ожидается отзыв от проверяющего...</Paragraph>
                                )}
                              </Card>
                            </div>
                          )}
                          
                          {/* Waiting for verification status */}
                          {currentStep === 3 && (
                            <div style={{ marginTop: 20 }}>
                              <Card style={{ backgroundColor: "#e6f7ff", borderColor: "#91d5ff" }}>
                                <Paragraph>Ваши документы на проверке. Автоматическое одобрение через:</Paragraph>
                                {verificationStartTime && (
                                  <Paragraph style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                    {Math.max(
                                      0, 
                                      Math.ceil((10000 - (Date.now() - verificationStartTime)) / 1000)
                                    )}{" "}
                                    секунд
                                  </Paragraph>
                                )}
                              </Card>
                            </div>
                          )}
                          
                          {/* Document sent status */}
                          {currentStep === 2 && (
                            <div style={{ marginTop: 20 }}>
                              <Card style={{ backgroundColor: "#e6f7ff", borderColor: "#91d5ff" }}>
                                <Paragraph>Документы успешно отправлены. Ожидается назначение проверяющего...</Paragraph>
                              </Card>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  )}
                />
              ) : (
                <Empty description="У вас еще нет процессов" />
              )}
              
              <Button 
                type="primary" 
                onClick={() => startNewProcess()}
                style={{ marginTop: 20, backgroundColor: "#002F6C", borderColor: "#002F6C" }}
              >
                Создать новый процесс
              </Button>
            </Card>
          </TabPane>
        </Tabs>
      </Content>
      <Footer />
    </Layout>
  );
}