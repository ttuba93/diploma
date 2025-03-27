"use client";

import { useEffect, useState } from "react";
import { Layout, Spin, Alert } from "antd";
import HeaderSection from "./components/Header";
import SearchSection from "./components/SearchSection";
import { Footer } from "./components/Footer";
import axios from "axios";

const { Content } = Layout;

interface FAQ {
  id: number;
  question: string;
  answer: string;
  course: number;
}

export default function Home() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/faq/")
      .then((res) => {
        setFaqs(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch FAQs.");
        setLoading(false);
      });
  }, []);

  return (
    <Layout className="min-h-screen">
      <HeaderSection />
      <SearchSection />

      {/* Фильтр категорий */}
      <section className="text-center py-6 border-b">
        <div className="flex justify-center gap-4">
          {["All", "1 course", "2 course", "3 course", "4 course", "5-7 course"].map((item) => (
            <button key={item} className="px-4 py-2 border-b-2 hover:border-blue-500">
              {item}
            </button>
          ))}
        </div>
      </section>

      {/* Вопросы и ответы */}
      <Content className="p-6 max-w-4xl mx-auto">
        {loading ? (
          <div className="flex justify-center">
            <Spin size="large" />
          </div>
        ) : error ? (
          <Alert message="Error" description={error} type="error" showIcon />
        ) : (
          faqs.map((faq) => (
            <div key={faq.id} className="p-4 border rounded-lg my-2 cursor-pointer hover:bg-gray-100">
              <strong>{faq.question}</strong>
              <p className="text-gray-600">{faq.answer}</p>
            </div>
          ))
        )}
      </Content>

      <Footer />
    </Layout>
  );
}
