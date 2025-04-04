"use client";

import { useState, useEffect, useRef } from "react";
import { Input, List, Spin, Alert, Button, Modal, Form } from "antd";
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
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState<boolean>(false);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/faq/")
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
        faqs.filter(
          (faq) =>
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, faqs]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchContainerRef]);

  const openQuestionModal = (faq: FAQ) => {
    setSelectedFAQ(faq);
    setIsQuestionModalOpen(true);
    setIsSearchFocused(false);
  };

  return (
    <section className="relative text-center flex flex-col justify-start items-center h-[25vh] bg-cover bg-center pt-10">
      <div className="w-full max-w-2xl px-4">
        <h1 className="text-4xl font-bold text-[#002F6C] mb-6">Frequently Asked Questions</h1>
        <div ref={searchContainerRef} className="relative w-full">
          <Input
            className="bg-white rounded-full px-6 py-3 text-lg w-full shadow-md"
            placeholder="Search your question..."
            prefix={<SearchOutlined className="text-blue-900 text-xl mr-2" />}
            size="large"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            style={{
              height: '50px',
              borderColor: isSearchFocused ? '#1890ff' : '#d9d9d9',
              boxShadow: isSearchFocused ? '0 0 0 2px rgba(24,144,255,0.2)' : 'none'
            }}
          />

          {isSearchFocused && (
            <div 
              className="absolute mt-2 w-full max-h-48 overflow-auto bg-white rounded-lg p-2 shadow-lg z-10"
              style={{ 
                transition: 'all 0.3s ease',
                opacity: isSearchFocused ? 1 : 0,
                transform: isSearchFocused ? 'translateY(0)' : 'translateY(-10px)'
              }}
            >
              {loading ? (
                <div className="flex justify-center py-4">
                  <Spin size="large" />
                </div>
              ) : error ? (
                <Alert message="Error" description={error} type="error" showIcon />
              ) : filteredFaqs.length > 0 ? (
                <List
                  dataSource={filteredFaqs}
                  renderItem={(faq) => (
                    <List.Item
                      className="cursor-pointer hover:bg-gray-100 transition-all duration-200 rounded-md px-3"
                      onClick={() => openQuestionModal(faq)}
                    >
                      <div className="w-full text-left py-1">
                        <strong className="text-[#002F6C]">{faq.question}</strong>
                      </div>
                    </List.Item>
                  )}
                />
              ) : (
                <div className="py-4">
                  <p className="text-gray-500 text-center">No results found. Try different keywords.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal
        title={<div className="text-xl text-[#002F6C] font-semibold">{selectedFAQ?.question}</div>}
        open={isQuestionModalOpen}
        onCancel={() => setIsQuestionModalOpen(false)}
        width={600}
        footer={[
          <Button 
            key="close" 
            onClick={() => setIsQuestionModalOpen(false)}
            type="primary"
            style={{ backgroundColor: '#002F6C', borderColor: '#002F6C' }}
            size="large"
          >
            Close
          </Button>,
        ]}
        bodyStyle={{ padding: '20px' }}
      >
        <p className="text-base leading-relaxed">{selectedFAQ?.answer}</p>
      </Modal>
    </section>
  );
}