"use client";

import { Input, Button, Layout, Menu, Card, Row, Col } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import HeaderSection from "../components/Header";
import SearchSection from '../components/SearchSectionDoc';
import { Footer } from '../components/Footer';

const { Header, Content } = Layout;

export default function DocumentsPage() {
  return (
    <Layout>
      <HeaderSection/>
      <SearchSection/>
      <Content style={{ padding: '20px', textAlign: 'center' }}>
        <h3 style={{ marginTop: '20px' }}>Samples</h3>
        <Row gutter={[16, 16]} justify="center" style={{ marginTop: '20px' }}>
          {[...Array(6)].map((_, index) => (
            <Col key={index} xs={12} sm={8} md={6}>
              <Card style={{ textAlign: 'center', padding: '20px', cursor: 'pointer' }}>
                <h4>Sample {index + 1}</h4>
              </Card>
            </Col>
          ))}
        </Row>
      </Content>
      <Footer/>
    </Layout>
  );
}
