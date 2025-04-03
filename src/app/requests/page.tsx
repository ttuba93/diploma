"use client";

import { useEffect, useState } from "react";
import { Layout, Button, Steps, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import HeaderSection from "../components/Header";
import { Footer } from "../components/Footer";

const { Header, Content } = Layout;

const API_BASE_URL = "http://localhost:8000/api"; // Адрес Django API

const processSteps = [
  "Запрос отправлен",
  "Ожидание загрузки документа",
  "Документы отправлены",
  "Ожидание проверки декана",
  "Документы отклонены",
  "Документы приняты",
  "Получена обратная связь",
];

export default function Requests() {
  const [loading, setLoading] = useState(false);
  const [processId, setProcessId] = useState<string | null>(
    localStorage.getItem("processId")
  );
  const [currentStep, setCurrentStep] = useState(
    Number(localStorage.getItem("currentStep")) || 0
  );
  const [taskId, setTaskId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const getStepFromTask = (taskName: string) => {
    if (taskName.includes("Send request info")) return 0;
    if (taskName.includes("Set status Awaiting")) return 1;
    if (taskName.includes("Upload document")) return 2;
    if (taskName.includes("Documents Verification")) return 3;
    if (taskName.includes("Set status Denied")) return 4;
    if (taskName.includes("Set status Accepted")) return 5;
    if (taskName.includes("Receive a feedback")) return 6;
    return 0;
  };

  const startNewProcess = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/start-process/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: "12345", initiator: "demo" }),
      });
      const data = await response.json();
      if (data.processInstanceId) {
        message.success("Процесс запущен!");
        setProcessId(data.processInstanceId);
        localStorage.setItem("processId", data.processInstanceId);
        setCurrentStep(1);
        localStorage.setItem("currentStep", "1");
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
      const response = await fetch(`${API_BASE_URL}/tasks/?user_id=demo`);
      const tasks = await response.json();
      const task = tasks.find((t: any) => t.processInstanceId === processId);
      if (task) {
        const step = getStepFromTask(task.name);
        setCurrentStep(step);
        localStorage.setItem("currentStep", String(step));
        setTaskId(task.id);
      }
    } catch (error) {
      message.error("Ошибка загрузки статуса");
    }
  };

  useEffect(() => {
    if (processId) {
      fetchProcessStatus();
      const interval = setInterval(fetchProcessStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [processId]);

  return (
    <Layout>
      <HeaderSection />
      <Content style={{ padding: "20px", maxWidth: 700, margin: "auto" }}>
        <h1>Процесс оформления</h1>
        <Button
          type="primary"
          onClick={startNewProcess}
          loading={loading}
          style={{ marginBottom: 20 }}
        >
          Запустить процесс
        </Button>
        {processId ? (
          <div>
            <h3>Процесс ID: {processId}</h3>
            <Steps current={currentStep} direction="vertical" size="small">
              {processSteps.map((step, index) => (
                <Steps.Step key={index} title={step} />
              ))}
            </Steps>
          </div>
        ) : (
          <p>Нет активных процессов</p>
        )}
      </Content>
      <Footer />
    </Layout>
  );
}
