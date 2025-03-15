"use client";

import { Input, Button, Layout, Menu, Card, Row, Col } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import HeaderSection from "../components/Header";
import { Footer } from '../components/Footer';

const { Header, Content } = Layout;

export default function Equeue() {
  return (
    <Layout>
      <HeaderSection/>
      <Footer/>
    </Layout>
  );
}
