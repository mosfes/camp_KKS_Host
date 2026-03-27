"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Select, SelectItem } from "@heroui/select";
import { Trash2, SquarePen, Search } from "lucide-react";
import { useStatusModal } from "@/components/StatusModalProvider";
import { PlusIcon } from "./Icons";

export default function VulgarWordsManager() {
  const { showSuccess, showError, showConfirm, setIsLoading } = useStatusModal();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal states
  const [isEditing, setIsEditing] = useState(false);
  const [currentWordId, setCurrentWordId] = useState(null);
  const [wordInput, setWordInput] = useState("");
  const [filterSource, setFilterSource] = useState("all");

  const fetchWords = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/vulgar-words");
      if (res.ok) {
        const data = await res.json();
        setWords(data);
      } else {
        throw new Error("Failed to fetch words");
      }
    } catch (error) {
      console.error(error);
      showError("ข้อผิดพลาด", "ไม่สามารถดึงข้อมูลคำหยาบได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWords();
  }, []);

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setCurrentWordId(null);
    setWordInput("");
    onOpen();
  };

  const handleOpenEditModal = (word) => {
    setIsEditing(true);
    setCurrentWordId(word.vulgar_word_id);
    setWordInput(word.word);
    onOpen();
  };

  const handleSaveWord = async (closeModal) => {
    if (!wordInput.trim()) {
      showError("คำเตือน", "กรุณากรอกคำที่ต้องการ");
      return;
    }

    try {
      setIsLoading(true);
      const payload = { word: wordInput };
      let res;
      
      if (isEditing) {
        res = await fetch(`/api/vulgar-words/${currentWordId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch("/api/vulgar-words", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, is_ai: false })
        });
      }

      if (res.ok) {
        showSuccess("สำเร็จ", isEditing ? "แก้ไขคำหยาบแล้ว" : "เพิ่มคำหยาบใหม่แล้ว");
        fetchWords();
        closeModal();
      } else {
        const data = await res.json();
        showError("ล้มเหลว", data.error || "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      console.error(err);
      showError("ข้อผิดพลาด", "การเชื่อมต่อมีปัญหา");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWord = (id, wordText) => {
    showConfirm(
      "ลบคำหยาบ",
      `คุณต้องการลบคำว่า "${wordText}" ออกจากระบบใช่หรือไม่?`,
      async () => {
        try {
          setIsLoading(true);
          const res = await fetch(`/api/vulgar-words/${id}`, { method: "DELETE" });
          if (res.ok) {
            showSuccess("สำเร็จ", "ลบคำหยาบเรียบร้อยแล้ว");
            fetchWords();
          } else {
            throw new Error("Failed to delete");
          }
        } catch (error) {
          console.error(error);
          showError("ข้อผิดพลาด", "ไม่สามารถลบคำหยาบได้");
        } finally {
          setIsLoading(false);
        }
      },
      "ลบ"
    );
  };

  const filteredWords = words.filter((w) => {
    const matchesSearch = w.word.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = 
      filterSource === "all" ? true :
      filterSource === "ai" ? w.is_ai :
      !w.is_ai;
    return matchesSearch && matchesSource;
  });

  return (
    <div className="flex flex-col gap-6 w-full pt-4">
      <Card className="border border-[#EFECE5] shadow-sm rounded-lg bg-white" radius="sm">
        <CardBody className="p-4 md:p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 gap-4">
            <div>
              <h3 className="text-gray-800 font-semibold">
                การจัดการคลังคำหยาบ ({filteredWords.length})
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                ระบบจะใช้คำเหล่านี้เพื่อกรองข้อความที่ไม่เหมาะสม
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <div className="flex items-center gap-2 min-w-[180px] flex-1">
                <Input
                  aria-label="Search words"
                  placeholder="ค้นหา..."
                  size="sm"
                  isClearable
                  startContent={<Search size={14} className="text-gray-400" />}
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  onClear={() => setSearchQuery("")}
                  classNames={{ inputWrapper: "bg-white border-gray-200" }}
                />
              </div>
              
              <div className="flex items-center gap-2 min-w-[150px] flex-1">
                <Select
                  aria-label="Select Source"
                  placeholder="แหล่งที่มา"
                  size="sm"
                  selectedKeys={new Set([filterSource])}
                  onChange={(e) => setFilterSource(e.target.value)}
                >
                  <SelectItem key="all" textValue="แหล่งที่มา: ทั้งหมด">ทั้งหมด</SelectItem>
                  <SelectItem key="manual" textValue="แหล่งที่มา: เพิ่มโดยผู้ใช้">เพิ่มโดยผู้ใช้</SelectItem>
                  <SelectItem key="ai" textValue="แหล่งที่มา: เพิ่มโดย AI">เพิ่มโดย AI</SelectItem>
                </Select>
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end mt-2 lg:mt-0">
                <Button
                  onPress={handleOpenAddModal}
                  size="sm"
                  className="bg-sage text-white hover:bg-sage-dark shadow-sm rounded-full"
                >
                  <PlusIcon />
                  <span className="ml-1 hidden sm:inline">เพิ่มคำหยาบใหม่</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <Table 
              aria-label="Vulgar Words Table"
              shadow="none"
              isHeaderSticky
              classNames={{
                wrapper: "border-2 border-[#EFECE5] rounded-xl p-0 overflow-hidden min-w-[600px] lg:min-w-full",
                th: "bg-white border-b border-white text-gray-800",
                td: "py-3 border-b border-[#EFECE5]",
              }}
            >
              <TableHeader>
                <TableColumn>คำหยาบ</TableColumn>
                <TableColumn>แหล่งที่มา</TableColumn>
                <TableColumn>วันที่เพิ่ม</TableColumn>
                <TableColumn>ดำเนินการ</TableColumn>
              </TableHeader>
              <TableBody
                emptyContent={loading ? "กำลังโหลดข้อมูล..." : "ไม่พบข้อมูลคำหยาบ"}
                isLoading={loading}
                loadingContent={
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 border-4 border-[#6b857a] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[#6b857a] text-sm">กำลังโหลดข้อมูล...</p>
                  </div>
                }
                items={filteredWords}
              >
                {(item) => (
                  <TableRow key={item.vulgar_word_id} className="last:border-b-0 hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-800">{item.word}</TableCell>
                    <TableCell>
                    <Chip
                      size="sm"
                      className={`font-medium ${
                        item.is_ai
                          ? "bg-[#f7f2fa] text-[#8e6ba8] border-[#e9dff2]"
                          : "bg-[#eff2f0] text-[#5d7c6f] border-[#dbe6e1]"
                      }`}
                    >
                      {item.is_ai ? "เพิ่มโดย AI" : "เพิ่มโดยผู้ใช้"}
                    </Chip>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString("th-TH")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span
                            className="cursor-pointer active:opacity-50 text-sage hover:text-sage-dark"
                            onClick={() => handleOpenEditModal(item)}
                        >
                            <SquarePen size={18} />
                        </span>
                        <span
                            className="cursor-pointer active:opacity-50 text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteWord(item.vulgar_word_id, item.word)}
                        >
                            <Trash2 size={18} />
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardBody>
      </Card>

      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange} 
        placement="center" 
        backdrop="blur" 
        size="md" 
        scrollBehavior="inside"
      >
        <ModalContent className="bg-white rounded-2xl shadow-medium border border-gray-100 text-gray-800 p-2">
          {(onClose) => (
            <>
              <ModalHeader>{isEditing ? "แก้ไขคำหยาบ" : "เพิ่มคำหยาบใหม่"}</ModalHeader>
              <ModalBody className="gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">คำหยาบ</label>
                  <Input
                    autoFocus
                    
                    variant="bordered"
                    radius="lg"
                    value={wordInput}
                    onValueChange={setWordInput}
                    classNames={{ inputWrapper: "bg-white" }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSaveWord(onClose);
                      }
                    }}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose} className="rounded-xl font-medium text-gray-500 hover:bg-gray-100">
                  ยกเลิก
                </Button>
                <Button className="bg-sage text-white shadow-sm rounded-xl font-medium px-6 hover:bg-sage-dark" onPress={() => handleSaveWord(onClose)}>
                  บันทึก
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
