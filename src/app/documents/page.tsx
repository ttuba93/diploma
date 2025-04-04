"use client";

import { useEffect, useState } from "react";
import { Layout, Card, Row, Col, Button, Modal, Spin, Alert } from "antd";
import HeaderSection from "../components/Header";
import { Footer } from "../components/Footer";
import SearchSection from "../components/SearchSectionDoc";
import Mammoth from "mammoth";

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
  const [docxPreview, setDocxPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/documents/")
      .then((res) => res.json())
      .then((data) => setDocuments(data))
      .catch((error) => console.error("Error fetching documents:", error));
  }, []);

  const showDocumentModal = (doc: Document) => {
    setSelectedDocument(doc);
    setIsModalVisible(true);
    setError(null);
    setDocxPreview(null);

    const fileExtension = doc.file.split(".").pop()?.toLowerCase();
    
    if (fileExtension === "docx") {
      setLoading(true);
      fetch(doc.file)
        .then((res) => res.blob())
        .then((blob) => {
          const reader = new FileReader();
          reader.onload = async (event) => {
            try {
              const text = await Mammoth.convertToHtml({ arrayBuffer: event.target?.result as ArrayBuffer });
              setDocxPreview(text.value);
            } catch (err) {
              setError("Error displaying DOCX preview.");
            }
            setLoading(false);
          };
          reader.readAsArrayBuffer(blob);
        })
        .catch(() => {
          setError("Failed to fetch DOCX file.");
          setLoading(false);
        });
    }
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
          loading ? (
            <Spin size="large" />
          ) : error ? (
            <Alert message="Error" description={error} type="error" showIcon />
          ) : (
            <div
              className="docx-preview"
              dangerouslySetInnerHTML={{ __html: docxPreview || "No preview available" }}
              style={{ padding: "10px", border: "1px solid #ddd", background: "#fff", minHeight: "200px" }}
            />
          )
        ) : (
          <p>Unsupported file format.</p>
        )}
      </>
    );
  };

  return (
    <Layout>
      <HeaderSection />
      <SearchSection />
      <Content style={{ padding: "32px", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.8rem", color: "#002D62", marginBottom: "30px" }}>
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
              href={selectedDocument ? `${selectedDocument.file}` : "#"}
              download
            >
              Download
            </Button>,
            <Button key="fill-manually">Fill Manually</Button>,
            <Button key="fill-auto">Fill Automatically</Button>,
            <Button key="cancel" onClick={handleCancel}>
              Close
            </Button>,
          ]}
        >
          {renderDocumentViewer()}
        </Modal>
      </Content>
      <Footer />
    </Layout>
  );
}
