"use client";

import { useEffect, useState } from "react";
import { Layout, Card, Row, Col, Button, Modal } from "antd";
import HeaderSection from "../components/Header";
import { Footer } from "../components/Footer";
import SearchSection from "../components/SearchSectionDoc";

const { Content } = Layout;

interface Document {
  id: number;
  name: string;
  file: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8000/api/documents/") // Замените на актуальный API
      .then((res) => res.json())
      .then((data) => setDocuments(data))
      .catch((error) => console.error("Error fetching documents:", error));
  }, []);

  const showDocumentModal = (doc: Document) => {
    setSelectedDocument(doc);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const renderDocumentViewer = () => {
    if (!selectedDocument) return null;

    const fileExtension = selectedDocument.file.split(".").pop()?.toLowerCase();
    const isPDF = fileExtension === "pdf";
    const isDOCX = fileExtension === "docx";

    return (
      <>
        {isPDF ? (
          <iframe
            src={`${selectedDocument.file}`}
            width="100%"
            height="500px"
            title={selectedDocument.name}
          />
        ) : isDOCX ? (
          <p>This is a DOCX file. Please download it to view.</p>
        ) : (
          <p>Unsupported file format.</p>
        )}
      </>
    );
  };

  return (
    <Layout>
      <HeaderSection />
      <SearchSection/>
      <Content style={{ padding: "32px", textAlign: "center" }}>
        <h1 style={{ fontSize: '1.8rem', color: '#002D62', marginBottom: '30px' }}>
          Samples
        </h1>
        <Row gutter={[16, 16]} justify="center" style={{ marginTop: "20px" }}>
          {documents.map((doc) => (
            <Col key={doc.id} xs={24} sm={12} md={8}>
              <Card 
                style={{ textAlign: "center", padding: "30px", cursor: "pointer" }}
                onClick={() => showDocumentModal(doc)}
              >
                <h4>{doc.name}</h4>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Document Modal */}
        <Modal
          title={selectedDocument?.name}
          open={isModalVisible}
          onCancel={handleCancel}
          width={800}
          footer={[
            <Button 
              key="download" 
              type="primary" 
              href={selectedDocument ? `http://localhost:8000/media/documents/${selectedDocument.file}` : '#'} 
              download
            >
              Download
            </Button>,
            <Button key="fill-manually">
              Fill Manually
            </Button>,
            <Button key="fill-auto">
              Fill Automatically
            </Button>,
            <Button key="cancel" onClick={handleCancel}>
              Close
            </Button>
          ]}
        >
          {renderDocumentViewer()}
        </Modal>
      </Content>
      <Footer />
    </Layout>
  );
}