import { NextResponse } from "next/server";
import { prisma } from '@/lib/db';
import { requireTeacher } from '@/lib/auth';

export async function GET(request: Request, context: { params: { id: string } }) {
    const { teacher, error: authError } = await requireTeacher();
    if (authError) return authError;

    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const filter = searchParams.get('filter') || 'all';
        
        const params = await context.params;
        const campId = Number(params.id);

        if (isNaN(campId)) {
            return NextResponse.json({ error: "Invalid camp id" }, { status: 400 });
        }

        // Build base condition for student
        let studentCondition: any = search ? {
            OR: [
                { firstname: { contains: search } },
                { lastname: { contains: search } },
                !isNaN(Number(search)) ? { students_id: Number(search) } : undefined
            ].filter(Boolean) as any
        } : {};

        // Add filter condition if applicable
        if (filter === "allergy") {
            const allergyCondition = {
                AND: [
                    { food_allergy: { not: null } },
                    { food_allergy: { not: "" } },
                    { food_allergy: { not: "-" } },
                    { food_allergy: { not: "ไม่มี" } }
                ]
            };
            studentCondition = search ? { AND: [studentCondition, allergyCondition] } : allergyCondition;
        } else if (filter === "disease") {
            const diseaseCondition = {
                AND: [
                    { chronic_disease: { not: null } },
                    { chronic_disease: { not: "" } },
                    { chronic_disease: { not: "-" } },
                    { chronic_disease: { not: "ไม่มี" } }
                ]
            };
            studentCondition = search ? { AND: [studentCondition, diseaseCondition] } : diseaseCondition;
        } else if (filter === "remark") {
            const remarkCondition = {
                AND: [
                    { remark: { not: null } },
                    { remark: { not: "" } },
                    { remark: { not: "-" } },
                    { remark: { not: "ไม่มี" } }
                ]
            };
            studentCondition = search ? { AND: [studentCondition, remarkCondition] } : remarkCondition;
        }

        const whereClause = {
            camp_camp_id: campId,
            ...(Object.keys(studentCondition).length > 0 ? { student: studentCondition } : {})
        };

        // Get total count for pagination based on search
        const totalRows = await prisma.student_enrollment.count({
            where: whereClause
        });

        // Get paginated data
        const students = await prisma.student_enrollment.findMany({
            where: whereClause,
            skip: (page - 1) * limit,
            take: limit,
            include: {
                student: {
                    select: {
                        students_id: true,
                        prefix_name: true,
                        firstname: true,
                        lastname: true,
                        food_allergy: true,
                        chronic_disease: true,
                        remark: true,
                        tel: true
                    }
                }
            },
            orderBy: {
                student: { firstname: 'asc' }
            }
        });

        // Summary Statistics (calculated over ALL students)
        const allEnrollments = await prisma.student_enrollment.findMany({
            where: { camp_camp_id: campId },
            include: {
                student: {
                    select: {
                        students_id: true,
                        food_allergy: true,
                        chronic_disease: true,
                        remark: true
                    }
                }
            }
        });

        const totalStudents = allEnrollments.length;
        
        const isSignificant = (text: string | null) => 
            text && text.trim() !== '' && text.trim() !== '-' && text.trim() !== 'ไม่มี';

        const allergies = allEnrollments
            .filter(e => isSignificant(e.student.food_allergy))
            .map(e => ({ id: e.student.students_id, text: e.student.food_allergy }));
            
        const chronicDiseases = allEnrollments
            .filter(e => isSignificant(e.student.chronic_disease))
            .map(e => ({ id: e.student.students_id, text: e.student.chronic_disease }));
            
        const remarks = allEnrollments
            .filter(e => isSignificant(e.student.remark))
            .map(e => ({ id: e.student.students_id, text: e.student.remark }));

        return NextResponse.json({
            data: students,
            pagination: {
                totalRows,
                totalPages: Math.ceil(totalRows / limit),
                currentPage: page,
                limit
            },
            summary: {
                totalStudents,
                allergiesCount: allergies.length,
                chronicDiseasesCount: chronicDiseases.length,
                remarksCount: remarks.length,
                allergies,
                chronicDiseases,
                remarks
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching students:", error);
        return NextResponse.json({ error: "Failed to fetch student data" }, { status: 500 });
    }
}
