"use client";

import { useRouter } from "next/navigation";
import HeaderSection from "../components/Header";
import { Input, Button } from "antd";
import { useState } from "react";

export default function Signup() {
  const router = useRouter(); // Используем хук для навигации

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("User registered:", form);
  };

  return (
    <div className="min-h-screen bg-cover bg-center flex flex-col" style={{ backgroundImage: "url('/images/kbtu1.jpg')" }}>
      <HeaderSection />
      
      <div className="flex justify-center items-center flex-grow">
        <div className="flex max-w-4xl w-full bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Левая часть (Авторизация) */}
          <div className="w-1/2 bg-[#002D62] text-white p-10 flex flex-col items-center justify-center">
            <h2 className="text-xl font-semibold">Welcome Back!</h2>
            <p className="mt-2">If you have an account</p>
            <Button 
              className="mt-4 px-6 bg-white text-[#002D62] font-semibold hover:bg-gray-200"
              onClick={() => router.push("/login")} // Переход на страницу логина
            >
              SIGN IN
            </Button>
          </div>

          {/* Правая часть (Регистрация) */}
          <div className="w-1/2 p-10 flex flex-col items-center">
            <h2 className="text-xl font-semibold text-[#002D62] mb-4">Authorization</h2>
            <form onSubmit={handleSubmit} className="w-full">
              <Input
                name="email"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                className="mb-4 py-2"
              />
              <Input.Password
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="mb-4 py-2 border border-gray-300 rounded-md"
              />
              <Input.Password
                name="confirmPassword"
                type="password"
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={handleChange}
                className="mb-4 py-2"
              />
              <Button
                type="primary"
                htmlType="submit"
                className="w-full bg-[#002D62] text-white py-2 font-semibold rounded-md"
              >
                SIGN UP
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
