'use client';

import { useEffect, useState } from "react";
import { Layout, Button, Table, message, Input, Modal, Tag, Space, Typography } from "antd";
import HeaderSession from "../components/Header";
import { Footer } from "../components/Footer";
import { FileTextOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Content } = Layout;
const { TextArea } = Input;
const { Text } = Typography;

const API_BASE_URL = "http://localhost:8000/api";

export default function ManagerRequests() {
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [username, setUsername] = useState<string | null>("");
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [documentPreviewVisible, setDocumentPreviewVisible] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUsername(userData.username);
    }
  }, []);

  const fetchRequests = async () => {
    if (!username) return;
    
    setLoading(true);
    try {
      // Получаем задачи для проверки документов
      const tasksResponse = await fetch(`${API_BASE_URL}/tasks/?user_id=${username}`);
      const tasksData = await tasksResponse.json();
      
      // Фильтруем только задачи проверки документов и получаем дополнительные данные
      const relevantTasks = tasksData.filter((task: any) => 
        task.name.includes("Documents Verification")
      );
      
      // Для каждой задачи получаем информацию о студенте
      const requestsWithDetails = await Promise.all(relevantTasks.map(async (task: any) => {
        try {
          // Предполагаем, что API возвращает детали процесса с информацией о студенте
          const processResponse = await fetch(`${API_BASE_URL}/process/${task.processInstanceId}/variables/`);
          const processData = await processResponse.json();
          
          // Здесь формируем объект с информацией о студенте и запросе
          // В реальном приложении структура данных будет зависеть от вашего API
          return {
            taskId: task.id,
            processId: task.processInstanceId,
            created: task.created,
            studentId: processData.student_id?.value || "12345", // Предполагаем, что есть переменная student_id
            studentName: processData.student_name?.value || "Мешитбай Томерис", // Предполагаем, что есть переменная student_name
            course: processData.course?.value || "3", // Предполагаем, что есть переменная course
            documentType: processData.document_type?.value || "Заявление", // Предполагаем, что есть переменная document_type
            documentUrl: processData.document_url?.value || "#", // Предполагаем, что есть переменная document_url
            status: "pending" // Статус по умолчанию
          };
        } catch (error) {
          console.error("Ошибка получения данных процесса:", error);
          // Возвращаем базовую информацию о задаче, если не удалось получить детали
          return {
            taskId: task.id,
            processId: task.processInstanceId,
            created: task.created,
            studentId: "Нет данных",
            studentName: "Нет данных",
            course: "Нет данных",
            documentType: "Документ",
            documentUrl: "#",
            status: "pending"
          };
        }
      }));
      
      setRequests(requestsWithDetails);
    } catch (error) {
      message.error("Ошибка загрузки запросов");
      console.error("Ошибка:", error);
    }
    setLoading(false);
  };

  const handleApproveRequest = async (record: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/task/${record.taskId}/complete/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variables: {
            status: {
              value: "completed",
              type: "String"
            },
            docsVerified: {
              type: "Boolean",
              value: true,
              valueInfo: {}
            }
          }
        }),
      });

      const data = await response.json();

      if (data.message === "Задача завершена!") {
        message.success(`Документы студента ${record.studentName} одобрены!`);
        
        // Обновляем статус в локальном состоянии
        setRequests(prevRequests => 
          prevRequests.map(req => 
            req.taskId === record.taskId 
              ? { ...req, status: "approved" } 
              : req
          )
        );
        
        // Обновляем список запросов
        fetchRequests();
      } else {
        message.error("Ошибка при обработке запроса");
      }
    } catch (error) {
      message.error("Ошибка при одобрении документа");
      console.error("Ошибка:", error);
    }
  };

  const showRejectModal = (record: any) => {
    setSelectedRequest(record);
    setFeedbackText("");
    setFeedbackModalVisible(true);
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;
    
    if (!feedbackText.trim()) {
      message.warning("Пожалуйста, укажите причину отклонения");
      return;
    }
    
    try {
      // Сначала отклоняем документы
      const rejectResponse = await fetch(`${API_BASE_URL}/task/${selectedRequest.taskId}/complete/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variables: {
            status: {
              value: "completed",
              type: "String"
            },
            docsVerified: {
              type: "Boolean",
              value: false,
              valueInfo: {}
            }
          }
        }),
      });

const rejectData = await rejectResponse.json();

      if (rejectData.message === "Задача завершена!") {
        // После отклонения документов, ищем задачу для отправки отзыва
        // (обычно она появляется после отклонения документов)
        setTimeout(async () => {
          try {
            const tasksResponse = await fetch(`${API_BASE_URL}/tasks/?user_id=${username}`);
            const tasks = await tasksResponse.json();
            
            const feedbackTask = tasks.find((task: any) => 
              task.processInstanceId === selectedRequest.processId && 
              task.name.includes("Provide comments")
            );
            
            if (feedbackTask) {
              // Отправляем комментарий с объяснением причины отклонения
              const feedbackResponse = await fetch(`${API_BASE_URL}/task/${feedbackTask.id}/complete/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  variables: {
                    status: {
                      value: "completed",
                      type: "String"
                    },
                    feedbackText: {
                      type: "String",
                      value: feedbackText,
                      valueInfo: {}
                    }
                  }
                }),
              });
              
              const feedbackData = await feedbackResponse.json();
              
              if (feedbackData.message === "Задача завершена!") {
                message.success(`Документы студента ${selectedRequest.studentName} отклонены с комментарием`);
                
                // Обновляем статус в локальном состоянии
                setRequests(prevRequests => 
                  prevRequests.map(req => 
                    req.taskId === selectedRequest.taskId 
                      ? { ...req, status: "rejected" } 
                      : req
                  )
                );
                
                setFeedbackModalVisible(false);
                fetchRequests();
              } else {
                message.error("Ошибка при отправке комментария");
              }
            } else {
              message.error("Не удалось найти задачу для отправки комментария");
              fetchRequests();
            }
          } catch (error) {
            message.error("Ошибка при обработке отзыва");
            console.error("Ошибка:", error);
          }
        }, 1000); // Небольшая задержка для обработки задачи системой
      } else {
        message.error("Ошибка при отклонении документа");
      }
    } catch (error) {
      message.error("Ошибка при отклонении документа");
      console.error("Ошибка:", error);
    }
  };

  const showDocumentPreview = (record: any) => {
    setSelectedRequest(record);
    setDocumentPreviewVisible(true);
  };

  // Определяем колонки для таблицы запросов
  const columns = [
    {
      title: 'ID студента',
      dataIndex: 'studentId',
      key: 'studentId',
    },
    {
      title: 'ФИО студента',
      dataIndex: 'studentName',
      key: 'studentName',
      render: (text: string) => <b>{text}</b>
    },
    {
      title: 'Курс',
      dataIndex: 'course',
      key: 'course',
    },
    {
      title: 'Тип документа',
      dataIndex: 'documentType',
      key: 'documentType',
    },
    {
      title: 'Документ',
      key: 'document',
      render: (_: any, record: any) => (
        <Button 
          icon={<FileTextOutlined />} 
          onClick={() => showDocumentPreview(record)}
        >
          Просмотр
        </Button>
      ),
    },
    {
      title: 'Дата подачи',
      dataIndex: 'created',
      key: 'created',
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: 'Статус',
      key: 'status',
      dataIndex: 'status',
      render: (status: string) => {
        let color = 'blue';
        let text = 'На рассмотрении';
        
        if (status === 'approved') {
          color = 'green';
          text = 'Одобрено';
        } else if (status === 'rejected') {
          color = 'red';
          text = 'Отклонено';
        }
        
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button 
            type="primary" 
            icon={<CheckCircleOutlined />}
            onClick={() => handleApproveRequest(record)}
            disabled={record.status !== 'pending'}
          >
            Одобрить
          </Button>
          <Button 
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => showRejectModal(record)}
            disabled={record.status !== 'pending'}
          >
            Отклонить
          </Button>
        </Space>
      )
    }
  ];

  // Периодически обновляем список запросов
  useEffect(() => {
    if (username) {
      fetchRequests();
      const interval = setInterval(fetchRequests, 30000); // Обновляем каждые 30 секунд
      return () => clearInterval(interval);
    }
  }, [username]);

  return (
    <Layout>
      <HeaderSession />
      <Content style={{ padding: "20px", maxWidth: 1200, margin: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h1>Управление запросами студентов</h1>
          <Button 
            type="primary" 
            onClick={fetchRequests} 
            loading={loading}
          >
            Обновить список
          </Button>
        </div>
        
        {username && <p>Менеджер: <Text strong>{username}</Text></p>}
        
        <Table 
          dataSource={requests} 
          columns={columns} 
          rowKey="taskId"
          pagination={{ pageSize: 10 }}
          loading={loading}
          bordered
        />
        
        {/* Модальное окно для отклонения с комментарием */}
        <Modal
          title={`Отклонение документа студента ${selectedRequest?.studentName}`}
          visible={feedbackModalVisible}
          onOk={handleRejectRequest}
          onCancel={() => setFeedbackModalVisible(false)}
          okText="Отклонить"
          cancelText="Отмена"
          okButtonProps={{ danger: true }}
        >
          <p>Пожалуйста, укажите причину отклонения документа:</p>
          <TextArea
            rows={4}
            placeholder="Введите причину отклонения..."
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
          />
        </Modal>
        
        {/* Модальное окно для просмотра документа */}
        <Modal
          title={`Просмотр документа студента ${selectedRequest?.studentName}`}
          visible={documentPreviewVisible}
          onCancel={() => setDocumentPreviewVisible(false)}
          footer={[
            <Button key="close" onClick={() => setDocumentPreviewVisible(false)}>
              Закрыть
            </Button>
          ]}
          width={800}
        >
          <div style={{ padding: 20, border: '1px solid #f0f0f0', borderRadius: 4 }}>
            <p>ID документа: {selectedRequest?.processId}</p>
            <p>Тип документа: {selectedRequest?.documentType}</p>
            <p>Дата загрузки: {selectedRequest?.created && new Date(selectedRequest.created).toLocaleString()}</p>
            
            {/* Здесь можно добавить отображение документа, если API предоставляет такую возможность */}
            <div style={{ 
              padding: 20, 
              backgroundColor: '#f9f9f9', 
              border: '1px dashed #d9d9d9',
              borderRadius: 4,
              marginTop: 10
            }}>
              <p><b>Предпросмотр документа</b></p>
              <p>В реальном приложении здесь будет отображаться содержимое загруженного документа или его предпросмотр.</p>
              <p>Для интеграции необходимо добавить компонент просмотра файлов соответствующего типа (PDF, изображение и т.д.).</p>
            </div>
          </div>
        </Modal>
      </Content>
      <Footer />
    </Layout>
  );
}