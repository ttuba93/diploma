"use client";

import { useEffect, useState } from "react";
import { Layout, Card, Row, Col } from "antd";
import Link from "next/link";
import HeaderSection from "../components/Header";
import { Footer } from "../components/Footer";

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
