const API_URL = '/api/students';
const API_URL_TEACHERS = '/api/teachers';
const API_URL_CLASSROOMS = '/api/classrooms';
const API_URL_YEARS = '/api/academic_years';
const API_URL_CLASSROOM_TYPES = '/api/classroom-types';

const getStudents = async (yearId) => {
  try {
    let url = API_URL;
    if (yearId && yearId !== "all") {
        url += `?yearId=${yearId}`;
    }
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error('Failed to fetch students');
    }
    const data = await res.json();
    return Array.isArray(data) ? data : []; 
  } catch (error) {
    console.error("Error getting students:", error);
    return [];
  }
};

const addStudent = async (studentData) => {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(studentData),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to add student');
    }
    
    return await res.json();
  } catch (error) {
    throw error; 
  }
};

const getTeachers = async () => {
  try {
    const res = await fetch(API_URL_TEACHERS);
    if (!res.ok) throw new Error('Failed to fetch teachers');
    const data = await res.json();
    return Array.isArray(data) ? data : []; 
  } catch (error) {
    console.error("Error getting teachers:", error);
    return [];
  }
};

const addTeacher = async (teacherData) => {
  try {
    const res = await fetch(API_URL_TEACHERS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teacherData),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to add teacher');
    }
    return await res.json();
  } catch (error) {
    throw error; 
  }
};

const getClassrooms = async (yearId) => {
  try {
    let url = API_URL_CLASSROOMS;
    if (yearId && yearId !== "all") {
        url += `?yearId=${yearId}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch classrooms');
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};

const addClassroom = async (data) => {
  try {
    const res = await fetch(API_URL_CLASSROOMS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add classroom');
    return await res.json();
  } catch (error) {
    throw error;
  }
};

const getAcademicYears = async () => {
    try {
      const res = await fetch(API_URL_YEARS);
      if (!res.ok) throw new Error('Failed to fetch years');
      return await res.json();
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  const addAcademicYear = async (year) => {
  try {
    const res = await fetch(API_URL_YEARS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year }),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to add year');
    }
    return await res.json();
  } catch (error) {
    throw error;
  }
};

const deleteStudent = async (id) => {
  try {
    const res = await fetch(`${API_URL}?id=${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete student');
    return await res.json();
  } catch (error) {
    throw error;
  }
};

const updateStudent = async (studentData) => {
  try {
    const res = await fetch(API_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData),
    });
    
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update student');
    }
    return await res.json();
  } catch (error) {
    throw error;
  }
};

const deleteTeacher = async (id) => {
  try {
    const res = await fetch(`${API_URL_TEACHERS}?id=${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete teacher');
    }
    return await res.json();
  } catch (error) {
    throw error;
  }
};

const updateTeacher = async (teacherData) => {
  try {
    const res = await fetch(API_URL_TEACHERS, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teacherData),
    });
    
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update teacher');
    }
    return await res.json();
  } catch (error) {
    throw error;
  }
};

const deleteClassroom = async (id) => {
  try {
    const res = await fetch(`${API_URL_CLASSROOMS}?id=${id}`, { method: 'DELETE' });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete classroom');
    }
    return await res.json();
  } catch (error) { throw error; }
};

const updateClassroom = async (data) => {
  try {
    const res = await fetch(API_URL_CLASSROOMS, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update classroom');
    }
    return await res.json();
  } catch (error) { throw error; }
};

export default {
  getStudents,
  addStudent,
  deleteStudent,
  updateStudent,
  deleteTeacher,
  updateTeacher,
  getTeachers,
  addTeacher,
  getClassrooms,
  addClassroom,
  getAcademicYears,
  addAcademicYear,
  deleteAcademicYear: async (id) => {
    try {
        const res = await fetch(`${API_URL_YEARS}?id=${id}`, { method: 'DELETE' });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to delete academic year');
        }
        return await res.json();
    } catch (e) { throw e; }
  },
  deleteClassroom,
  updateClassroom,
  getClassroomTypes : async () => {
    try {
        const res = await fetch(API_URL_CLASSROOM_TYPES);
        if (!res.ok) throw new Error('Failed to fetch classroom types');
        return await res.json();
    } catch (e) { console.error(e); return []; }
  },
  addClassroomType : async (data) => {
    try {
        const res = await fetch(API_URL_CLASSROOM_TYPES, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to add classroom type');
        return await res.json();
    } catch (e) { throw e; }
  },
  deleteClassroomType : async (id) => {
    try {
        const res = await fetch(`${API_URL_CLASSROOM_TYPES}?id=${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete classroom type');
        return await res.json();
    } catch (e) { throw e; }
  },
};

