"use client";

import { Layout, Card, Row, Col } from 'antd';
import Link from 'next/link';
import HeaderSection from "../components/Header";
import SearchSection from '../components/SearchSectionDoc';
import { Footer } from '../components/Footer';

const { Content } = Layout;

export default function DocumentsPage() {
  return (
    <Layout>
      <HeaderSection/>
      <SearchSection/>
      <Content style={{ padding: '32px', textAlign: 'center' }}>
        <h1 style={{ marginTop: '32px' }}>Samples</h1>
        <Row gutter={[16, 16]} justify="center" style={{ marginTop: '20px' }}>
          {[...Array(6)].map((_, index) => (
            <Col key={index} xs={24} sm={12} md={8}>
              <Link href={`/samples`}>
                <Card style={{ textAlign: 'center', padding: '30px', cursor: 'pointer' }}>
                  <h4>Sample {index + 1}</h4>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      </Content>
      <Footer/>
    </Layout>
  );
}