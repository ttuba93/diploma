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
  
  // New states for form handling
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [formMode, setFormMode] = useState<'manual' | 'auto'>('manual');
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [form] = Form.useForm();
  
  // State for filled document display
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

  const handleFillManually = () => {
    setFormMode('manual');
    setIsFormModalVisible(true);
    handleCancel(); // Close the document preview modal

    // Pre-fill with student data if available
    if (studentProfile) {
      form.setFieldsValue({
        first_name: studentProfile.first_name,
        last_name: studentProfile.last_name,
        middle_name: studentProfile.middle_name,
        speciality: studentProfile.speciality,
        course: studentProfile.course,
      });
    }
  };

  const handleFillAutomatically = () => {
    if (!isAuthenticated) {
      message.error("Please log in to use auto-fill feature");
      return;
    }
    
    setFormMode('auto');
    setIsFormModalVisible(true);
    handleCancel(); // Close the document preview modal

    // Auto-fill all student data fields
    if (studentProfile) {
      form.setFieldsValue({
        first_name: studentProfile.first_name,
        last_name: studentProfile.last_name,
        middle_name: studentProfile.middle_name,
        speciality: studentProfile.speciality,
        course: studentProfile.course,
        // We can add other fields as needed but they should be empty for user to fill
      });
    } else {
      message.error("Student profile not found. Please refresh the page and try again.");
    }
  };

  const handleFormSubmit = async (values: any) => {
    setLoading(true);
    try {
      // Determine which document type based on selected document name
      let endpoint = '';
      let pdfEndpoint = '';
      
      if (selectedDocument?.name.toLowerCase().includes('invitation')) {
        endpoint = 'invitation/create/';
        if (selectedDocument?.name.toLowerCase().includes('prediploma')) {
          pdfEndpoint = 'invitation_prediploma/{id}/pdf/';
        } else {
          pdfEndpoint = 'invitation/{id}/pdf/';
        }
        // For invitation letters, add current year
        values.current_year = new Date().getFullYear();
      } else if (selectedDocument?.name.toLowerCase().includes('registration')) {
        endpoint = 'course-registration/create/';
        pdfEndpoint = 'course-registration/{id}/pdf/';
      }
      
      // Prepare the data for submission
      const formData = {
        ...values,
        // Convert moment dates to string format if they exist
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : undefined,
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : undefined,
        student: studentProfile?.id || 1 // Add student ID from profile or default for manual mode
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

  // Dynamic form fields based on document type
  const renderFormFields = () => {
    if (!selectedDocument) return null;
    
    // Base fields common for all document types
    const baseFields = (
      <>
        <Form.Item name="first_name" label="First Name">
          <Input disabled={formMode === 'auto'} />
        </Form.Item>
        <Form.Item name="last_name" label="Last Name">
          <Input disabled={formMode === 'auto'} />
        </Form.Item>
        <Form.Item name="middle_name" label="Middle Name">
          <Input disabled={formMode === 'auto'} />
        </Form.Item>
        <Form.Item name="course" label="Course">
          <Input disabled={formMode === 'auto'} />
        </Form.Item>
        <Form.Item name="speciality" label="Speciality">
          <Input disabled={formMode === 'auto'} />
        </Form.Item>
      </>
    );
    
    // Additional fields for invitation letter
    if (selectedDocument.name.toLowerCase().includes('invitation')) {
      return (
        <>
          {baseFields}
          <Form.Item name="organization_name" label="Organization Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="start_date" label="Start Date" rules={[{ required: true }]}>
            <DatePicker />
          </Form.Item>
          <Form.Item name="end_date" label="End Date" rules={[{ required: true }]}>
            <DatePicker />
          </Form.Item>
          <Form.Item name="supervisor_name" label="Supervisor Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="supervisor_position" label="Supervisor Position" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </>
      );
    }
    
    // Additional fields for course registration
    if (selectedDocument.name.toLowerCase().includes('registration')) {
      return (
        <>
          {baseFields}
          <Form.Item name="semester" label="Semester" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          {/* For course selection, use a separate component or implement a multi-select */}
        </>
      );
    }
    
    // Default case: only base fields
    return baseFields;
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
            <Button key="fill-manually" onClick={handleFillManually}>
              Fill Manually
            </Button>,
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
            </Tooltip>,
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


// "use client";

// import { useEffect, useState } from "react";
// import { Layout, Card, Row, Col, Button, Modal, Spin } from "antd";
// import HeaderSection from "../components/Header";
// import { Footer } from "../components/Footer";
// import SearchSection from "../components/SearchSectionDoc";
// import mammoth from "mammoth";

// const { Content } = Layout;

// interface Document {
//   id: number;
//   name: string;
//   file: string;  // URL to the file
// }

// export default function DocumentsPage() {
//   const [documents, setDocuments] = useState<Document[]>([]);
//   const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [docxContent, setDocxContent] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     fetch("http://localhost:8000/api/documents/") // Change to your backend API URL
//       .then((res) => res.json())
//       .then((data) => setDocuments(data))
//       .catch((error) => console.error("Error fetching documents:", error));
//   }, []);

//   const showDocumentModal = async (doc: Document) => {
//     setSelectedDocument(doc);
//     setIsModalVisible(true);

//     const fileExtension = doc.file.split(".").pop()?.toLowerCase();

//     if (fileExtension === "docx") {
//       setLoading(true);
//       try {
//         const response = await fetch(doc.file);
//         const arrayBuffer = await response.arrayBuffer();
//         const { value } = await mammoth.convertToHtml({ arrayBuffer });
//         setDocxContent(value);
//       } catch (error) {
//         console.error("Error processing DOCX:", error);
//         setDocxContent("Error loading document.");
//       } finally {
//         setLoading(false);
//       }
//     }
//   };

//   const handleCancel = () => {
//     setIsModalVisible(false);
//     setDocxContent(null);
//   };

//   const renderDocumentViewer = () => {
//     if (!selectedDocument) return null;

//     const fileExtension = selectedDocument.file.split(".").pop()?.toLowerCase();

//     if (fileExtension === "pdf") {
//       return (
//         <iframe
//           src={encodeURI(selectedDocument.file)}
//           width="100%"
//           height="500px"
//           title={selectedDocument.name}
//         ></iframe>
//       );
//     } else if (fileExtension === "docx") {
//       return loading ? <Spin /> : <div dangerouslySetInnerHTML={{ __html: docxContent || "" }} />;
//     } else {
//       return <p>Unsupported file format.</p>;
//     }
//   };

//   return (
//     <Layout>
//       <HeaderSection />
//       <SearchSection />
//       <Content style={{ padding: "32px", textAlign: "center" }}>
//         <h1 style={{ fontSize: '1.8rem', color: '#002D62', marginBottom: '30px' }}>
//           Samples
//         </h1>
//         <Row gutter={[16, 16]} justify="center" style={{ marginTop: "20px" }}>
//           {documents.map((doc) => (
//             <Col key={doc.id} xs={24} sm={12} md={8}>
//               <Card 
//                 style={{ textAlign: "center", padding: "30px", cursor: "pointer" }}
//                 onClick={() => showDocumentModal(doc)}
//               >
//                 <h4>{doc.name}</h4>
//               </Card>
//             </Col>
//           ))}
//         </Row>

//         {/* Document Modal */}
//         <Modal
//           title={selectedDocument?.name}
//           open={isModalVisible}
//           onCancel={handleCancel}
//           width={800}
//           footer={[
//             <Button 
//               key="download" 
//               type="primary" 
//               href={selectedDocument ? selectedDocument.file : '#'} 
//               download
//             >
//               Download
//             </Button>,
//             <Button key="fill-manually">
//               Fill Manually
//             </Button>,
//             <Button key="fill-auto">
//               Fill Automatically
//             </Button>,
//             <Button key="cancel" onClick={handleCancel}>
//               Close
//             </Button>
//           ]}
//         >
//           {renderDocumentViewer()}
//         </Modal>
//       </Content>
//       <Footer />
//     </Layout>
//   );
// }
