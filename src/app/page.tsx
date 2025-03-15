"use client";

import { Input, Menu, Layout } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import HeaderSection from "./components/Header";
import SearchSection from "./components/SearchSection";
import { Footer } from "./components/Footer";

const { Header, Content } = Layout;

export default function Home() {
  return (
    <Layout className="min-h-screen">
      <HeaderSection/>
      <SearchSection/>

      {/* Фильтр категорий */}
      <section className="text-center py-6 border-b">
        <div className="flex justify-center gap-4">
          {['All', '1 course', '2 course', '3 course', '4 course', '5-7 course'].map((item) => (
            <button key={item} className="px-4 py-2 border-b-2 hover:border-blue-500">
              {item}
            </button>
          ))}
        </div>
      </section>

      {/* Вопросы и ответы */}
      <Content className="p-6 max-w-4xl mx-auto">
        {[1, 2, 3, 4, 5].map((_, index) => (
          <div key={index} className="p-4 border rounded-lg my-2 cursor-pointer hover:bg-gray-100">
            Question {index + 1}
          </div>
        ))}
      </Content>

      <Footer/>
    </Layout>
  );
}