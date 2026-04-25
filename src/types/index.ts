export type ResourceType = 'tokens' | 'vps';

export interface DigitalResource {
  type: ResourceType;
  amount: number;
}

export interface CourseMaterial {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  professorId: string;
  professorName: string;
  maxStudents: number;
  enrolledStudents: string[];
  resources: DigitalResource[];
  allocatedResources?: DigitalResource[];
  professorBuffer?: DigitalResource[];
  status: 'draft' | 'active' | 'closed';
  createdAt: string;
  materials: CourseMaterial[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'profesor' | 'student' | 'audit';
}

export interface EnrollmentRequest {
  courseId: string;
  studentId: string;
  requestedAt: string;
}
