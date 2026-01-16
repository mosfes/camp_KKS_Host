
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const station = await prisma.station.findUnique({
            where: { station_id: parseInt(id) },
            include: {
                mission: {
                    where: { deletedAt: null },
                    include: {
                        mission_question: {
                            include: {
                                choices: true
                            }
                        }
                    }
                },
            },
        });

        if (!station) {
            return NextResponse.json({ error: 'Station not found' }, { status: 404 });
        }

        return NextResponse.json(station);
    } catch (error) {
        console.error("Error fetching station:", error);
        return NextResponse.json({ error: 'Failed to fetch station' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, description } = body;

        const updatedStation = await prisma.station.update({
            where: { station_id: parseInt(id) },
            data: {
                name,
                description
            }
        });

        return NextResponse.json(updatedStation);
    } catch (error) {
        console.error("Error updating station:", error);
        return NextResponse.json({ error: 'Failed to update station' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        // Soft delete the station
        await prisma.station.update({
            where: { station_id: parseInt(id) },
            data: { deletedAt: new Date() }
        });

        return NextResponse.json({ message: 'Station deleted successfully' });
    } catch (error) {
        console.error("Error deleting station:", error);
        return NextResponse.json({ error: 'Failed to delete station' }, { status: 500 });
    }
}
