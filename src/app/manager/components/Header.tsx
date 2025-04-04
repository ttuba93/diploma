"use client";

import { Layout, Menu, Dropdown } from "antd";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BellOutlined, UserOutlined, GlobalOutlined, LogoutOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";

const { Header } = Layout;

const languageMenu = (
  <Menu>
    <Menu.Item key="en">
      <Link href="?lang=en">English</Link>
    </Menu.Item>
    <Menu.Item key="ru">
      <Link href="?lang=ru">Русский</Link>
    </Menu.Item>
    <Menu.Item key="kz">
      <Link href="?lang=kz">Қазақша</Link>
    </Menu.Item>
  </Menu>
);

export default function HeaderSection() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null); // Тип any для хранения данных о пользователе
  const [userName, setUserName] = useState<string>(''); // Для имени пользователя

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        // Деструктурируем данные пользователя
        const { user_data } = parsedUser;

        // Извлекаем имя и фамилию в зависимости от наличия
        if (user_data && user_data.first_name && user_data.last_name) {
          setUserName(`${user_data.first_name} ${user_data.last_name}`);
        }
      } catch (err) {
        console.error("Failed to parse user data", err);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setUserName('');
    router.push("/login");
  };

  return (
    <>
      <Header className="bg-white flex justify-between items-center px-8 shadow-md h-18">
        <Link href="/manager/faq">
          <div className="flex items-center gap-2">
            <Image src="/images/logo.png" alt="KBTU Logo" width={250} height={125} />
          </div>
        </Link>
        <Menu mode="horizontal" className="flex-1 justify-center border-none" selectedKeys={[pathname]}>
          <Menu.Item key="/manager/faq">
            <Link href="/manager/faq">HOME</Link>
          </Menu.Item>
          <Menu.Item key="/manager/documents">
            <Link href="/manager/documents">Documents</Link>
          </Menu.Item>
          <Menu.Item key="/manager/e-queue">
            <Link href="/manager/e-queue">E-queue</Link>
          </Menu.Item>
          <Menu.Item key="/manager/requests">
            <Link href="/manager/requests">Requests</Link>
          </Menu.Item>
        </Menu>
        <div className="flex gap-4 items-center">
          {user && userName && (
            <span className="text-[#002F6C] font-semibold mr-2">{userName}</span>
          )}
          {user ? (
            <Link href="/manager/profile">
              <UserOutlined className="text-xl cursor-pointer text-[#002F6C]" />
            </Link>
          ) : (
            <Link href="/login">
              <UserOutlined className="text-xl cursor-pointer text-[#002F6C]" />
            </Link>
          )}
          {user && (
            <LogoutOutlined className="text-xl cursor-pointer text-[#002F6C]" onClick={handleLogout} />
          )}
          <Dropdown overlay={languageMenu} placement="bottomRight">
            <GlobalOutlined className="text-xl cursor-pointer text-[#002F6C]" />
          </Dropdown>
          <Link href="/manager/notifications">
            <BellOutlined className="text-xl cursor-pointer text-[#002F6C]" />
          </Link>
        </div>
      </Header>
      <div style={{ borderBottom: "2px solid #002F6C" }}></div>
    </>
  );
}
