export type UserRole = "admin" | "user";

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface PDF {
  id: string;
  title: string;
  file_url: string;
  uploaded_by: string;
  created_at: string;
}

export interface Annotation {
  id: string;
  pdf_id: string;
  user_id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page_number: number;
  created_at: string;
}
