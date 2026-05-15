export type RequestItem = {
  id: number;
  title: string;
  status: string;
  risk: string;
  ai_review?: string;
};

export type AuditLog = {
  id: number;
  request_id: number;
  action: string;
  timestamp: string;
};

export type AIReview = {
  executiveSummary: string;
  riskAssessment: string;
  missingInformation: string[];
  recommendedActions: string[];
};

export type DocumentItem = {
  id: number;
  request_id: number;
  filename: string;
  original_name: string;
  mime_type: string;
};
