// Backend types for the Charity Compliance Checker API

// Re-export frontend types that are shared
export type ComplianceStatus = 'Compliant' | 'Warning' | 'Non-Compliant' | 'Info';

export interface ComplianceCheck {
  id: string;
  title: string;
  status: ComplianceStatus;
  summary: string;
  recommendation: string;
}

export interface ComplianceReport {
  scannedUrl: string;
  scanDate: string;
  overallStatus: ComplianceStatus;
  overallScore: number;
  summary: {
    goodPoints: string[];
    warnings: string[];
    threats: string[];
  };
  checks: {
    websitePolicies: ComplianceCheck[];
    security: ComplianceCheck[];
    memberData: ComplianceCheck[];
    marketing: ComplianceCheck[];
    payments: ComplianceCheck[];
  };
}

// Database models
export interface User {
  id: number;
  email: string;
  password_hash: string;
  full_name: string | null;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface RefreshToken {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  created_at: Date;
}

export interface Report {
  id: number;
  user_id: number;
  scanned_url: string;
  scan_date: Date;
  overall_status: ComplianceStatus;
  overall_score: number;
  report_data: ComplianceReport;
  created_at: Date;
}

// Auth request/response types
export interface RegisterRequest {
  email: string;
  password: string;
  fullName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    fullName: string | null;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// API request/response types
export interface CreateReportRequest {
  report: ComplianceReport;
}

export interface GetReportsResponse {
  reports: ReportSummary[];
  total: number;
}

export interface ReportSummary {
  id: number;
  scannedUrl: string;
  scanDate: string;
  overallStatus: ComplianceStatus;
  overallScore: number;
  createdAt: string;
}

export interface GetReportDetailResponse {
  report: Report;
}
