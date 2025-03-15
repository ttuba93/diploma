"use client";

import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";

export default function SearchSection() {
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
          />
        </div>
      </div>
    </section>
  );
}