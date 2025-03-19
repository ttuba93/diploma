"use client";

import { Layout, Button } from "antd";
import { LeftOutlined } from "@ant-design/icons";
import HeaderSection from "../components/Header";
import { Footer } from "../components/Footer";
import { useRouter } from "next/navigation";

const { Content } = Layout;

export default function DocumentTemplate() {
  const router = useRouter();

  return (
    <Layout>
      <HeaderSection />
      <Content className="flex flex-col items-center p-6 bg-white relative">
        
        {/* Кнопка "Назад" ближе к границе */}
        <Button 
          type="primary" 
          shape="circle" 
          icon={<LeftOutlined />} 
          className="absolute left-4 top-4 bg-[#002F6C] border-none text-white"
          onClick={() => router.back()}
        />
        
        {/* Блок документа */}
        <div className="border shadow-lg rounded-lg p-4 bg-gray-100 w-full max-w-4xl mt-10 flex flex-col items-center">
          <iframe 
            src="/path-to-document.pdf" 
            className="w-full h-[600px] border rounded-lg"
            title="Document Preview"
          ></iframe>
          
          <div className="flex justify-center gap-4 mt-4">
            <Button type="primary" className="bg-[#002F6C] text-white border-none">Download</Button>
            <Button type="primary" className="bg-[#002F6C] text-white border-none">Fill in with my details</Button>
            <Button type="primary" className="bg-[#002F6C] text-white border-none">Fill in manually</Button>
          </div>
        </div>
      </Content>
      <Footer />
    </Layout>
  );
}
