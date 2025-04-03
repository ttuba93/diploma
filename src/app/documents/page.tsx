"use client";

import { useEffect, useState } from "react";
import { Layout, Card, Row, Col, Button } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

  useEffect(() => {
    fetch("http://localhost:8000/api/documents/") // Замените на актуальный API
      .then((res) => res.json())
      .then((data) => setDocuments(data));
  }, []);

  return (
    <Layout>
      <HeaderSection />
      <SearchSection/>
      <Content style={{ padding: "32px", textAlign: "center" }}>
        <h1 style={{ marginTop: "32px" }}>Document Samples</h1>
        <Row gutter={[16, 16]} justify="center" style={{ marginTop: "20px" }}>
          {documents.map((doc) => (
            <Col key={doc.id} xs={24} sm={12} md={8}>
              <Link href={`/samples/${doc.id}`}>
                <Card style={{ textAlign: "center", padding: "30px", cursor: "pointer" }}>
                  <h4>{doc.name}</h4>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      </Content>
      <Footer />
    </Layout>
  );
}

export function DocumentDetail({ params }: { params: { id: string } }) {
  const { id } = params;
  const [document, setDocument] = useState<Document | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch(`http://localhost:8000/api/documents/${id}/`)
      .then((res) => res.json())
      .then((data) => setDocument(data));
  }, [id]);

  if (!document) return <p>Loading...</p>;

  const fileExtension = document.file.split(".").pop()?.toLowerCase();
  const isPDF = fileExtension === "pdf";
  const isDOCX = fileExtension === "docx";

  return (
    <Layout>
      <HeaderSection />
      <Content style={{ padding: "32px", textAlign: "center" }}>
        <h1>{document.name}</h1>
        {isPDF ? (
          <iframe
            src={`http://localhost:8000/media/${document.file}`}
            width="100%"
            height="500px"
          />
        ) : isDOCX ? (
          <p>This is a DOCX file. Please download it to view.</p>
        ) : (
          <p>Unsupported file format.</p>
        )}
        <div style={{ marginTop: "20px" }}>
          <Button href={`http://localhost:8000/media/${document.file}`} download>Download</Button>
          <Button style={{ marginLeft: "10px" }}>Fill Manually</Button>
          <Button style={{ marginLeft: "10px" }}>Fill Automatically</Button>
          <Button style={{ marginLeft: "10px" }} onClick={() => router.back()}>Back</Button>
        </div>
      </Content>
      <Footer />
    </Layout>
  );
}
