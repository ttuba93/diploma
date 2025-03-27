"use client";

import { useState, useEffect } from "react";
import { Input, List, Spin, Alert } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import axios from "axios";

interface FAQ {
  id: number;
  question: string;
  answer: string;
}

export default function SearchSection() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/faq/?search=")
      .then((res) => {
        setFaqs(res.data);
        setFilteredFaqs(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch FAQs.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredFaqs(faqs);
    } else {
      setFilteredFaqs(
        faqs.filter((faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, faqs]);

  return (
    <section
      className="relative text-center flex flex-col justify-center items-center h-[70vh] bg-cover bg-center"
      style={{ backgroundImage: "url('/images/kbtu.png')" }}
    >
      <div className="absolute w-3/4 h-2/3 bg-blue-900 bg-opacity-50 rounded-xl flex flex-col justify-center items-center p-6">
        <h1 className="text-3xl font-semibold text-white">Your Questions, Answered</h1>
        <div className="mt-4 w-3/4">
          <Input
            className="bg-white rounded-full px-4 py-2 text-lg w-full"
            placeholder="Search your question..."
            prefix={<SearchOutlined className="text-blue-900" />}
            size="large"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Список найденных вопросов */}
        <div className="mt-4 w-3/4 max-h-60 overflow-auto bg-white rounded-md p-2 shadow-lg">
          {loading ? (
            <Spin size="large" />
          ) : error ? (
            <Alert message="Error" description={error} type="error" showIcon />
          ) : filteredFaqs.length > 0 ? (
            <List
              dataSource={filteredFaqs}
              renderItem={(faq) => (
                <List.Item className="cursor-pointer hover:bg-gray-100 transition-all duration-200">
                  <strong>{faq.question}</strong>
                </List.Item>
              )}
            />
          ) : (
            <p className="text-gray-500 text-center">No results found.</p>
          )}
        </div>
      </div>
    </section>
  );
}
