"use client";

import { useEffect, useState } from "react";
import { Layout, Card, Row, Col, Button, Modal, Spin, Form, Input, DatePicker, message, Tooltip } from "antd";
import HeaderSection from "../components/Header";
import { Footer } from "../components/Footer";
import SearchSection from "../components/SearchSectionDoc";
import mammoth from "mammoth";
// Импортируем компоненты из react-pdf
import { Document, Page, pdfjs } from 'react-pdf';
// Устанавливаем worker для PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const { Content } = Layout;

interface Document {
  id: number;
  name: string;
  file: string;  // URL to the file
  desc?: string; // Optional description
}

interface UserData {
  id: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
  kbtu_id: string;
  course: number;
  speciality: string;
  telephone_number: string;
  email: string;
}

interface Student {
  user_id: number;
  username: string;
  role: string;
  user_data: UserData;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [docxContent, setDocxContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Состояния для react-pdf
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pdfError, setPdfError] = useState<string | null>(null);
  
  // Form handling states
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [formMode, setFormMode] = useState<'manual' | 'auto'>('manual');
  const [student, setStudent] = useState<Student | null>(null);
  const [form] = Form.useForm();
  
  // Filled document display states
  const [filledDocumentUrl, setFilledDocumentUrl] = useState<string | null>(null);
  const [showFilledDocument, setShowFilledDocument] = useState(false);

  // Function to check if user is authenticated
  const isAuthenticated = () => {
    return student !== null && student.user_id !== undefined;
  };

  // Function to load user data from localStorage
  const loadUserData = () => {
    try {
      // Check different possible keys for user data
      let userData = localStorage.getItem("student");

      if (!userData) {
        // Try other possible keys
        userData = localStorage.getItem("user");
      }

      if (!userData) {
        // Check all keys in localStorage for user data content
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            const value = localStorage.getItem(key);
            if (value && value.includes('"user_id"') && value.includes('"user_data"')) {
              userData = value;
              console.log(`Found user data in key: ${key}`);
              break;
            }
          }
        }
      }

      if (userData) {
        const parsedUser = JSON.parse(userData);
        console.log("Parsed user data:", parsedUser);
        
        // Check data structure
        if (parsedUser && parsedUser.user_id) {
          setStudent(parsedUser);
          console.log("Student data set successfully");
        } else {
          console.error("Invalid user data structure:", parsedUser);
          setStudent(null);
        }
      } else {
        console.log("No user data found in localStorage");
        setStudent(null);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      setStudent(null);
    }
  };

  useEffect(() => {
    // Fetch documents
    fetch("http://localhost:8000/api/documents/")
      .then((res) => res.json())
      .then((data) => setDocuments(data))
      .catch((error) => console.error("Error fetching documents:", error));
    
    // Log all localStorage items for debugging
    console.log("All localStorage items:");
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        console.log(`${key}: ${localStorage.getItem(key)}`);
      }
    }

    // Load user data
    loadUserData();

    // Add storage event listener to update data when changed in another tab
    window.addEventListener('storage', loadUserData);
    
    return () => {
      window.removeEventListener('storage', loadUserData);
    };
  }, []);

  // Debug logging for student state
  useEffect(() => {
    console.log("Current student state:", student);
    console.log("localStorage student:", localStorage.getItem("student"));
  }, [student]);

  const showDocumentModal = async (doc: Document) => {
    setSelectedDocument(doc);
    setIsModalVisible(true);
    setPageNumber(1); // Сбрасываем номер страницы
    setPdfError(null); // Сбрасываем ошибки PDF

    const fileExtension = doc.file.split(".").pop()?.toLowerCase();

    if (fileExtension === "docx") {
      setLoading(true);
      try {
        const response = await fetch(doc.file);
        const arrayBuffer = await response.arrayBuffer();
        const { value } = await mammoth.convertToHtml({ arrayBuffer });
        setDocxContent(value);
      } catch (error) {
        console.error("Error processing DOCX:", error);
        setDocxContent("Error loading document.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setDocxContent(null);
    setNumPages(null);
  };

  const handleFormCancel = () => {
    setIsFormModalVisible(false);
    form.resetFields();
  };

  const handleFilledDocCancel = () => {
    setShowFilledDocument(false);
    setFilledDocumentUrl(null);
    setNumPages(null);
    setPageNumber(1);
  };

  // Функции для перемещения по страницам PDF
  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages || 1));
  };

  // Обработчик успешной загрузки PDF
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPdfError(null);
  };

  // Обработчик ошибки загрузки PDF
  const onDocumentLoadError = (error: Error) => {
    console.error("Error loading PDF:", error);
    setPdfError("Failed to load PDF. Please try downloading the file instead.");
  };

  // Handles manual form filling - only for document IDs 1 and 5
  const handleFillManually = () => {
    if (!selectedDocument || (selectedDocument.id !== 1 && selectedDocument.id !== 5)) {
      message.info("Form filling is only available for invitation documents");
      return;
    }
    
    setFormMode('manual');
    setIsFormModalVisible(true);
    handleCancel(); // Close the document preview modal
    
    // Reset the form to ensure empty fields
    form.resetFields();
  };

  // Handles automatic form filling - only for document IDs 1 and 5
  const handleFillAutomatically = () => {
    if (!selectedDocument || (selectedDocument.id !== 1 && selectedDocument.id !== 5)) {
      message.info("Form filling is only available for invitation documents");
      return;
    }
    
    if (!isAuthenticated()) {
      message.warning("You need to login first to use auto-fill feature");
      console.log("Authentication status:", isAuthenticated());
      console.log("Current student data:", student);
      return;
    }
    
    setFormMode('auto');
    setIsFormModalVisible(true);
    handleCancel(); // Close the document preview modal
    
    // Reset the form first
    form.resetFields();
    
    // Pre-fill the form with student data if in auto mode
    if (student && student.user_data) {
      form.setFieldsValue({
        first_name: student.user_data.first_name,
        last_name: student.user_data.last_name,
        middle_name: student.user_data.middle_name || "",
        course: student.user_data.course,
        speciality: student.user_data.speciality
      });
    }
  };

  const handleFormSubmit = async (values: any) => {
    if (!selectedDocument) {
      message.error("No document selected");
      return;
    }
    
    setLoading(true);
    try {
      let endpoint = '';
      let pdfEndpoint = '';
      
      // Determine which document type and endpoint to use
      if (selectedDocument.id === 1) {
        endpoint = 'invitation/create/';
        pdfEndpoint = 'invitation/{id}/pdf/';
      } else if (selectedDocument.id === 5) {
        endpoint = 'invitation/create/';
        pdfEndpoint = 'invitation_prediploma/{id}/pdf/';
      } else {
        throw new Error('Unsupported document type');
      }
      
      // Format dates properly and prepare form data
      const formData = {
        ...values,
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : undefined,
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : undefined,
        current_year: new Date().getFullYear(),
        // For auto mode, use the student ID from user data
        student: formMode === 'auto' && student ? student.user_data.id.toString() : null
      };

      console.log("Submitting form data:", formData);

      // Send the form data to the backend
      const response = await fetch(`http://localhost:8000/api/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit the form');
      }

      const result = await response.json();
      
      // Get the document ID and construct PDF URL
      const documentId = result.id;
      const documentUrl = `http://localhost:8000/api/${pdfEndpoint.replace('{id}', documentId)}`;
      
      // Set the filled document URL and show the document
      setFilledDocumentUrl(documentUrl);
      setShowFilledDocument(true);
      setPageNumber(1); // Сбрасываем номер страницы при просмотре нового документа
      
      message.success('Document successfully filled!');
      setIsFormModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error("Error submitting form:", error);
      message.error('Failed to create document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderDocumentViewer = () => {
    if (!selectedDocument) return null;

    const fileExtension = selectedDocument.file.split(".").pop()?.toLowerCase();

    if (fileExtension === "pdf") {
      return (
        <div className="pdf-container" style={{ textAlign: 'center' }}>
          <Document
            file={selectedDocument.file}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={<Spin tip="Loading PDF..." />}
            error={<div style={{ color: 'red' }}>{pdfError || "Failed to load PDF document"}</div>}
          >
            <Page 
              pageNumber={pageNumber} 
              renderTextLayer={false}
              renderAnnotationLayer={false}
              width={600}
              scale={1.2}
            />
          </Document>
          
          {numPages && (
            <div className="pdf-navigation" style={{ marginTop: '15px' }}>
              <Button 
                onClick={goToPrevPage} 
                disabled={pageNumber <= 1}
                style={{ marginRight: '10px' }}
              >
                Previous
              </Button>
              <span style={{ margin: '0 10px' }}>
                Page {pageNumber} of {numPages}
              </span>
              <Button 
                onClick={goToNextPage} 
                disabled={pageNumber >= (numPages || 1)}
                style={{ marginLeft: '10px' }}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      );
    } else if (fileExtension === "docx") {
      return loading ? <Spin tip="Processing DOCX file..." /> : <div dangerouslySetInnerHTML={{ __html: docxContent || "" }} />;
    } else {
      return <p>Unsupported file format. Please download the file to view its contents.</p>;
    }
  };

  // Компонент для просмотра заполненного PDF документа
  const renderFilledDocumentViewer = () => {
    if (!filledDocumentUrl) return null;
    
    return (
      <div className="pdf-container" style={{ textAlign: 'center' }}>
        <Document
          file={filledDocumentUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={<Spin tip="Loading filled document..." />}
          error={<div style={{ color: 'red' }}>{pdfError || "Failed to load filled document"}</div>}
        >
          <Page 
            pageNumber={pageNumber} 
            renderTextLayer={false}
            renderAnnotationLayer={false}
            width={600}
            scale={1.2}
          />
        </Document>
        
        {numPages && (
          <div className="pdf-navigation" style={{ marginTop: '15px' }}>
            <Button 
              onClick={goToPrevPage} 
              disabled={pageNumber <= 1}
              style={{ marginRight: '10px' }}
            >
              Previous
            </Button>
            <span style={{ margin: '0 10px' }}>
              Page {pageNumber} of {numPages}
            </span>
            <Button 
              onClick={goToNextPage} 
              disabled={pageNumber >= (numPages || 1)}
              style={{ marginLeft: '10px' }}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Render form fields based on the selected document
  const renderFormFields = () => {
    if (!selectedDocument) return null;
    
    // Invitation letter fields (for document IDs 1 and 5)
    if (selectedDocument.id === 1 || selectedDocument.id === 5) {
      return (
        <>
          {/* Student information fields - Only shown in manual mode */}
          {formMode === 'manual' && (
            <>
              <Form.Item name="first_name" label="First Name" rules={[{ required: true }]}>
                <Input placeholder="Введите имя" />
              </Form.Item>
              <Form.Item name="last_name" label="Last Name" rules={[{ required: true }]}>
                <Input placeholder="Введите фамилию" />
              </Form.Item>
              <Form.Item name="middle_name" label="Middle Name">
                <Input placeholder="Введите отчество" />
              </Form.Item>
              <Form.Item name="course" label="Course" rules={[{ required: true }]}>
                <Input type="number" placeholder="Курс" />
              </Form.Item>
              <Form.Item name="speciality" label="Speciality" rules={[{ required: true }]}>
                <Input placeholder="Специальность" />
              </Form.Item>
            </>
          )}
          
          {/* Invitation specific fields */}
          <Form.Item name="organization_name" label="Organization Name" rules={[{ required: true }]}>
            <Input placeholder="Название организации" />
          </Form.Item>
          <Form.Item name="start_date" label="Start Date" rules={[{ required: true }]}>
            <DatePicker format="YYYY-MM-DD" placeholder="Дата начала" />
          </Form.Item>
          <Form.Item name="end_date" label="End Date" rules={[{ required: true }]}>
            <DatePicker format="YYYY-MM-DD" placeholder="Дата окончания" />
          </Form.Item>
          <Form.Item name="supervisor_name" label="Supervisor Name" rules={[{ required: true }]}>
            <Input placeholder="ФИО руководителя" />
          </Form.Item>
          <Form.Item name="supervisor_position" label="Supervisor Position" rules={[{ required: true }]}>
            <Input placeholder="Должность руководителя" />
          </Form.Item>
        </>
      );
    }
    
    // Default case: empty form
    return <p>No form available for this document type.</p>;
  };

  // Check if the document is fillable (only documents with IDs 1 and 5)
  const isFillableDocument = (document: Document | null) => {
    return document && (document.id === 1 || document.id === 5);
  };

  return (
    <Layout>
      <HeaderSection />
      <SearchSection />
      <Content style={{ padding: "32px", textAlign: "center" }}>
        <h1 style={{ fontSize: '1.8rem', color: '#002D62', marginBottom: '30px' }}>
          Document Samples
        </h1>
        <Row gutter={[16, 16]} justify="center" style={{ marginTop: "20px" }}>
          {documents.map((doc) => (
            <Col key={doc.id} xs={24} sm={12} md={8}>
              <Card 
                style={{ textAlign: "center", padding: "30px", cursor: "pointer", height: "100%" }}
                onClick={() => showDocumentModal(doc)}
              >
                <h4>{doc.name}</h4>
                {doc.desc && <p style={{ color: "#666" }}>{doc.desc}</p>}
              </Card>
            </Col>
          ))}
        </Row>

        {/* Document Preview Modal */}
        <Modal
          title={selectedDocument?.name}
          open={isModalVisible}
          onCancel={handleCancel}
          width={800}
          footer={[
            <Button 
              key="download" 
              type="primary" 
              href={selectedDocument ? selectedDocument.file : '#'} 
              download
            >
              Download Template
            </Button>,
            isFillableDocument(selectedDocument) && (
              <Button key="fill-manually" onClick={handleFillManually}>
                Fill Manually
              </Button>
            ),
            isFillableDocument(selectedDocument) && (
              <Tooltip 
                title={!isAuthenticated() ? "Please log in to use this feature" : ""}
              >
                <Button 
                  key="fill-auto" 
                  onClick={handleFillAutomatically} 
                  disabled={!isAuthenticated()}
                  type="primary"
                >
                  Fill Automatically
                </Button>
              </Tooltip>
            ),
            <Button key="cancel" onClick={handleCancel}>
              Close
            </Button>
          ]}
        >
          {renderDocumentViewer()}
        </Modal>

        {/* Form Modal for filling document */}
        <Modal
          title={`Fill ${selectedDocument?.name}`}
          open={isFormModalVisible}
          onCancel={handleFormCancel}
          width={600}
          footer={null}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFormSubmit}
          >
            {renderFormFields()}
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                Generate Document
              </Button>
              <Button onClick={handleFormCancel} style={{ marginLeft: 8 }}>
                Cancel
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* Filled Document Display Modal */}
        <Modal
          title="Your Filled Document"
          open={showFilledDocument}
          onCancel={handleFilledDocCancel}
          width={800}
          footer={[
            <Button 
              key="download" 
              type="primary" 
              href={filledDocumentUrl || '#'} 
              target="_blank"
              download
            >
              Download Document
            </Button>,
            <Button key="close" onClick={handleFilledDocCancel}>
              Close
            </Button>
          ]}
        >
          {renderFilledDocumentViewer()}
        </Modal>
        
        {/* Debug information */}
        <div className="mt-4 text-xs text-gray-500" style={{ marginTop: "20px", fontSize: "12px", color: "#999" }}>
          Authentication status: {isAuthenticated() ? "Logged in" : "Not logged in"}
        </div>
      </Content>
      <Footer />
    </Layout>
  );
}