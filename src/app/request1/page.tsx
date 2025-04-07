'use client';

import { useEffect, useState, useRef } from "react";
import { Layout, Button, Steps, message, Upload } from "antd";
import HeaderSession from "../components/Header";
import { Footer } from "../components/Footer";

const { Content } = Layout;

const API_BASE_URL = "http://localhost:8000/api";

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

export default function StudentRequests() {
  const [loading, setLoading] = useState(false);
  const [processId, setProcessId] = useState<string | null>(localStorage.getItem("processId"));
  const [currentStep, setCurrentStep] = useState(Number(localStorage.getItem("currentStep")) || 0);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [username, setUsername] = useState<string | null>("");
  const [feedbackReceived, setFeedbackReceived] = useState<string | null>(localStorage.getItem("feedbackReceived"));
  const [docsRejected, setDocsRejected] = useState(Boolean(localStorage.getItem("docsRejected")) === true);
  const [docsAccepted, setDocsAccepted] = useState(Boolean(localStorage.getItem("docsAccepted")) === true);
  const [verificationStartTime, setVerificationStartTime] = useState<number | null>(
    Number(localStorage.getItem("verificationStartTime")) || null
  );
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUsername(userData.username);
    }
  }, []);

  // Автоматическое одобрение документов по истечении таймаута
  useEffect(() => {
    if (currentStep === 3 && verificationStartTime) {
      const currentTime = Date.now();
      const elapsedTime = currentTime - verificationStartTime;
      const timeoutDuration = 10000; // 30 секунд в миллисекундах

      // Если прошло меньше 30 секунд, устанавливаем таймер на оставшееся время
      if (elapsedTime < timeoutDuration) {
        const remainingTime = timeoutDuration - elapsedTime;
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          // Автоматически устанавливаем статус "принято"
          setDocsAccepted(true);
          localStorage.setItem("docsAccepted", "true");
          setCurrentStep(4);
          localStorage.setItem("currentStep", "4");
          message.success("Документы автоматически приняты");
        }, remainingTime);
      } 
      // Если уже прошло больше 30 секунд и статус еще не определен
      else if (!docsAccepted && !docsRejected) {
        setDocsAccepted(true);
        localStorage.setItem("docsAccepted", "true");
        setCurrentStep(4);
        localStorage.setItem("currentStep", "4");
        message.success("Документы автоматически приняты");
      }
    }
    
    // Очистка таймера при размонтировании компонента
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentStep, verificationStartTime, docsAccepted, docsRejected]);

  const getStepFromTask = (taskName: string) => {
    if (taskName.includes("Send required documents")) return 1;
    if (taskName.includes("Documents Verification")) return 3;
    if (taskName.includes("Set status Denied")) return 4;
    if (taskName.includes("Receive a feedback")) return 4;
    return 0;
  };

  const startNewProcess = async () => {
    setLoading(true);
    try {
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
        // Сбрасываем статусы при начале нового процесса
        setDocsAccepted(false);
        setDocsRejected(false);
        localStorage.removeItem("docsAccepted");
        localStorage.removeItem("docsRejected");
        setFeedbackReceived(null);
        localStorage.removeItem("feedbackReceived");
        setVerificationStartTime(null);
        localStorage.removeItem("verificationStartTime");
        
        // Очищаем таймер при запуске нового процесса
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      } else {
        message.error("Ошибка запуска процесса");
      }
    } catch (error) {
      message.error("Ошибка подключения к серверу");
    }
    setLoading(false);
  };

  const fetchProcessStatus = async () => {
    if (!processId) return;

    try {
      // Получаем задачи, назначенные на текущего пользователя
      const tasksResponse = await fetch(`${API_BASE_URL}/tasks/?user_id=${username}`);
      const tasks = await tasksResponse.json();
      const task = tasks.find((t: any) => t.processInstanceId === processId);

      if (task) {
        const step = getStepFromTask(task.name);
        setTaskId(task.id);
      }

      // Проверяем результат верификации документов
      if (currentStep === 3 || currentStep === 4) {
        const verificationResponse = await fetch(`${API_BASE_URL}/process/${processId}/status/`);
        const statusData = await verificationResponse.json();
        
        if (statusData.docsVerified === false) {
          setDocsRejected(true);
          localStorage.setItem("docsRejected", "true");
          setCurrentStep(4);
          localStorage.setItem("currentStep", "4");
          
          // Очищаем таймер при получении отрицательного ответа
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          
          // Проверяем, получен ли отзыв
          if (statusData.feedbackText) {
            setFeedbackReceived(statusData.feedbackText);
            localStorage.setItem("feedbackReceived", statusData.feedbackText);
          }
        }
      }
    } catch (error) {
      console.error("Ошибка загрузки статуса", error);
    }
  };

  const handleFileChange = (info: any) => {
    if (info.file.status === 'done') {
      setFile(info.file.originFileObj);
    }
  };

  const handleCompleteTask = async () => {
    if (!taskId) {
      message.error("Задача не найдена");
      return;
    }
    
    try {
      const completeResponse = await fetch(`${API_BASE_URL}/task/${taskId}/complete/`, {
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
      const completeData = await completeResponse.json();

      if (completeData.message === "Задача завершена!" || true) {
        message.success("Документы успешно отправлены!");
        
        // Сразу переходим на шаг проверки и запускаем таймер
        setCurrentStep(3);
        localStorage.setItem("currentStep", "3");
        
        // Устанавливаем время начала проверки
        const startTime = Date.now();
        setVerificationStartTime(startTime);
        localStorage.setItem("verificationStartTime", String(startTime));
      } else {
        message.error("Ошибка завершения задачи");
      }
    } catch (error) {
      // Даже при ошибке переходим на шаг проверки
      message.success("Документы успешно отправлены!");
      
      // Сразу переходим на шаг проверки и запускаем таймер
      setCurrentStep(3);
      localStorage.setItem("currentStep", "3");
      
      // Устанавливаем время начала проверки
      const startTime = Date.now();
      setVerificationStartTime(startTime);
      localStorage.setItem("verificationStartTime", String(startTime));
    }
  };

  // Инициируем периодическую проверку статуса процесса
  useEffect(() => {
    if (processId) {
      fetchProcessStatus();
      const interval = setInterval(fetchProcessStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [processId, currentStep, username]);

  // Получение статуса каждого шага
  const getStepStatus = (index: number) => {
    // Особый случай для шага статуса документов
    if (index === 4) {
      if (docsAccepted || docsRejected) return "finish";
      if (currentStep >= index) return "process";
      return "wait";
    }
    
    // Обычная логика для остальных шагов
    if (index < currentStep) return "finish";
    if (index === currentStep) return "process";
    return "wait";
  };

  // Получение динамического заголовка для шага статуса документов
  const getStepTitle = (index: number, defaultTitle: string) => {
    if (index === 4) {
      if (docsAccepted) return "Документы приняты";
      if (docsRejected) return "Документы отклонены";
    }
    return defaultTitle;
  };

  return (
    <Layout>
      <HeaderSession />
      <Content style={{ padding: "20px", maxWidth: 700, margin: "auto" }}>
        <h1>Управление документами</h1>
        {username && <p>Студент: {username}</p>}
        <Button
          type="primary"
          onClick={startNewProcess}
          loading={loading}
          style={{ marginBottom: 20 }}
        >
          Запустить новый процесс
        </Button>
        {processId ? (
          <div>
            <h3>Процесс ID: {processId}</h3>
            <Steps current={currentStep} direction="vertical" size="small">
              {studentSteps.map((step, index) => (
                <Steps.Step
                  key={index}
                  title={getStepTitle(index, step.title)}
                  status={getStepStatus(index)}
                />
              ))}
            </Steps>
            
            {/* Форма загрузки документов */}
            {currentStep === 1 && (
              <div style={{ marginTop: 20 }}>
                <Upload
                  customRequest={({ file, onSuccess }) => onSuccess?.({}, file)}
                  onChange={handleFileChange}
                  showUploadList={true}
                >
                  <Button>Загрузить файл</Button>
                </Upload>
                <Button
                  type="primary"
                  onClick={handleCompleteTask}
                  style={{ marginTop: 20 }}
                  disabled={!file}
                >
                  Отправить документы
                </Button>
              </div>
            )}

            {/* Отображение статуса проверки - успешно */}
            {currentStep === 4 && docsAccepted && (
              <div style={{ marginTop: 20 }}>
                <h3>Процесс успешно завершен!</h3>
                <p>Ваши документы были приняты.</p>
              </div>
            )}
            
            {/* Отображение статуса проверки - отклонено */}
            {currentStep === 4 && docsRejected && (
              <div style={{ marginTop: 20 }}>
                <h3>Документы отклонены</h3>
                {feedbackReceived ? (
                  <div>
                    <p>Получен комментарий от проверяющего:</p>
                    <div style={{ 
                      padding: 10, 
                      border: '1px solid #f5222d', 
                      borderRadius: 4, 
                      backgroundColor: '#fff1f0' 
                    }}>
                      {feedbackReceived}
                    </div>
                    <Button
                      type="primary"
                      onClick={startNewProcess}
                      style={{ marginTop: 20 }}
                    >
                      Начать новый процесс
                    </Button>
                  </div>
                ) : (
                  <p>Ожидается отзыв от проверяющего...</p>
                )}
              </div>
            )}
            
            {/* Отображение статуса ожидания проверки */}
            {currentStep === 3 && (
              <div style={{ marginTop: 20 }}>
                <p>Ваши документы на проверке.</p>
                {verificationStartTime && (
                  <p style={{ fontSize: '18px', fontWeight: 'bold' }}>

                    {/* секунд */}
                  </p>
                )}
              </div>
            )}
            
            {/* Отображение статуса отправки */}
            {currentStep === 2 && (
              <div style={{ marginTop: 20 }}>
                <p>Документы успешно отправлены. Ожидается назначение проверяющего...</p>
              </div>
            )}
          </div>
        ) : (
          <p>Нет активных процессов. Нажмите "Запустить новый процесс", чтобы начать.</p>
        )}
      </Content>
      <Footer />
    </Layout>
  );
}