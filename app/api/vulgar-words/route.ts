// @ts-nocheck
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTeacher } from "@/lib/auth";

export async function GET() {
    const { teacher, error: authError } = await requireTeacher();
    if (authError) return authError;

    try {
        const words = await prisma.vulgar_words.findMany({
            orderBy: {
                createdAt: "desc",
            },
        });
        return NextResponse.json(words);
    } catch (error) {
        console.error("Error fetching vulgar words:", error);
        return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลคำหยาบได้" }, { status: 500 });
    }
}

export async function POST(req) {
    const { teacher, error: authError } = await requireTeacher();
    if (authError) return authError;

    try {
        const body = await req.json();
        const { word, is_ai } = body;

        if (!word || !word.trim()) {
            return NextResponse.json({ error: "กรุณาระบุคำหยาบ" }, { status: 400 });
        }

        const newWord = await prisma.vulgar_words.create({
            data: {
                word: word.trim(),
                is_ai: is_ai || false,
            },
        });

        return NextResponse.json(newWord, { status: 201 });
    } catch (error) {
        console.error("Error creating vulgar word:", error);
        return NextResponse.json({ error: "ไม่สามารถเพิ่มคำหยาบได้" }, { status: 500 });
    }
}
