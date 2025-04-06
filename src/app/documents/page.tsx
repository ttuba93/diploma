"use client";

import { useEffect, useState } from "react";
import { Layout, Card, Row, Col, Button, Modal, Spin, Form, Input, DatePicker, message, Tooltip } from "antd";
import HeaderSection from "../components/Header";
import { Footer } from "../components/Footer";
import SearchSection from "../components/SearchSectionDoc";
import mammoth from "mammoth";
import moment from "moment";

const { Content } = Layout;

interface Document {
  id: number;
  name: string;
  file: string;  // URL to the file
  desc?: string; // Optional description
}

interface StudentProfile {
  id: number;
  first_name: string;
  last_name: string;
  middle_name: string;
  kbtu_id: string;
  course: number;
  speciality: string;
  telephone_number: string;
  email: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [docxContent, setDocxContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Form handling states
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [formMode, setFormMode] = useState<'manual' | 'auto'>('manual');
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [form] = Form.useForm();
  
  // Filled document display states
  const [filledDocumentUrl, setFilledDocumentUrl] = useState<string | null>(null);
  const [showFilledDocument, setShowFilledDocument] = useState(false);

  useEffect(() => {
    // Fetch documents
    fetch("http://localhost:8000/api/documents/")
      .then((res) => res.json())
      .then((data) => setDocuments(data))
      .catch((error) => console.error("Error fetching documents:", error));
    
    // Check authentication and fetch profile if authenticated
    const token = localStorage.getItem('token');
    if (token) {
      fetch("http://localhost:8000/api/students/profile/", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then((res) => {
          if (res.ok) {
            setIsAuthenticated(true);
            return res.json();
          } else {
            // Token might be invalid or expired
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            return null;
          }
        })
        .then((data) => {
          if (data) setStudentProfile(data);
        })
        .catch((error) => {
          console.error("Error fetching student profile:", error);
          setIsAuthenticated(false);
        });
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const showDocumentModal = async (doc: Document) => {
    setSelectedDocument(doc);
    setIsModalVisible(true);

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
  };

  const handleFormCancel = () => {
    setIsFormModalVisible(false);
    form.resetFields();
  };

  const handleFilledDocCancel = () => {
    setShowFilledDocument(false);
    setFilledDocumentUrl(null);
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
    
    if (!isAuthenticated) {
      message.error("Please log in to use auto-fill feature");
      return;
    }
    
    setFormMode('auto');
    setIsFormModalVisible(true);
    handleCancel(); // Close the document preview modal
    
    // Reset the form first
    form.resetFields();
    
    // For auto mode, we only set the student ID field internally
    // All other fields remain empty for the student to fill
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
        // For auto mode, use the student ID from profile, otherwise use the default "2"
        student: formMode === 'auto' && studentProfile ? studentProfile.id : "2"
      };

      // Send the form data to the backend
      const response = await fetch(`http://localhost:8000/api/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
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
        <iframe
          src={encodeURI(selectedDocument.file)}
          width="100%"
          height="500px"
          title={selectedDocument.name}
        ></iframe>
      );
    } else if (fileExtension === "docx") {
      return loading ? <Spin /> : <div dangerouslySetInnerHTML={{ __html: docxContent || "" }} />;
    } else {
      return <p>Unsupported file format.</p>;
    }
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
                title={!isAuthenticated ? "Please log in to use this feature" : ""}
              >
                <Button 
                  key="fill-auto" 
                  onClick={handleFillAutomatically} 
                  disabled={!isAuthenticated}
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
          {filledDocumentUrl && (
            <iframe
              src={filledDocumentUrl}
              width="100%"
              height="600px"
              title="Filled Document"
              style={{ border: "none" }}
            ></iframe>
          )}
        </Modal>
      </Content>
      <Footer />
    </Layout>
  );
}