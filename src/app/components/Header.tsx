"use client";

import { Layout, Menu, Button, Dropdown } from "antd";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellOutlined, StarOutlined, UserOutlined, GlobalOutlined } from "@ant-design/icons";

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

  return (
    <Header className="bg-white flex justify-between items-center px-8 shadow-md h-18">
      <Link href="/">
        <div className="flex items-center gap-2">
          <Image src="/images/logo.png" alt="KBTU Logo" width={250} height={125} />
        </div>
      </Link>
      <Menu mode="horizontal" className="flex-1 justify-center border-none" selectedKeys={[pathname]}>
        <Menu.Item key="/">
          <Link href="/">HOME</Link>
        </Menu.Item>
        <Menu.Item key="/documents">
          <Link href="/documents">Documents</Link>
        </Menu.Item>
        <Menu.Item key="/e-queue">
          <Link href="/e-queue">E-queue</Link>
        </Menu.Item>
        <Menu.Item key="/requests">
          <Link href="/requests">Requests</Link>
        </Menu.Item>
      </Menu>
      <div className="flex gap-2">
        <Dropdown overlay={languageMenu} placement="bottomRight">
          <GlobalOutlined className="text-xl cursor-pointer text-[#002F6C]" />
        </Dropdown>
        <Link href="/notifications">
          <BellOutlined className="text-xl cursor-pointer text-[#002F6C]" />
        </Link>
        <Link href="/favorites">
          <StarOutlined className="text-xl cursor-pointer text-[#002F6C]" />
        </Link>
        <Link href="/registration">
          <UserOutlined className="text-xl cursor-pointer text-[#002F6C]" />
        </Link>
      </div>
    </Header>
  );
}