
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, description, campId } = body;

        if (!name || !campId) {
            return NextResponse.json({ error: 'Name and Camp ID are required' }, { status: 400 });
        }

        const newStation = await prisma.station.create({
            data: {
                name,
                description: description || '',
                camp_camp_id: parseInt(campId),
            },
        });

        return NextResponse.json(newStation, { status: 201 });
    } catch (error) {
        console.error("Error creating station:", error);
        return NextResponse.json({ error: 'Failed to create station' }, { status: 500 });
    }
}
