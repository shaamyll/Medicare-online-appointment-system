export interface FeedbackItem {
  id: number;
  appointmentId: number;
  appointmentNumber?: string;
  patientId: number;
  patientName?: string;
  doctorName?: string;
  patient?: {
    id: number;
    name: string;
    email: string;
  };
  doctor?: {
    id: number;
    name: string;
    email: string;
    specialization: string;
  };
  rating: number;
  comment?: string | null;
  createdAt: string;
}

export type Feedback = FeedbackItem;

export interface FeedbackSummaryResponse {
  ratingAvg: number;
  ratingCount: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  items: FeedbackItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminFeedbackListResponse {
  items: FeedbackItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CreateFeedbackData {
  rating: number;
  comment?: string;
}
