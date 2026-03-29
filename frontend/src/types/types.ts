export type UserRole    = "ADMIN";
export type RecordType   = "INCOMING" | "OUTGOING";
export type RecordStatus = "PENDING"  | "RECEIVED" | "RELEASED";

export interface User {
  id:       string;
  email:    string;
  username: string;
  name:     string;
  role:     UserRole;
}

export interface RecordComment {
  id:         string;
  content:    string;
  authorName: string;
  createdAt:  string;
  updatedAt:  string;
  author?:    { id: string; name: string; username: string };
}

export interface Record {
  id:                 string;
  trackingCode:       string;
  type:               RecordType;
  status:             RecordStatus;
  documentTitle:      string;
  documentNumber:     string;
  particulars:        string;
  category:           string;
  fromOffice:         string;
  toOffice:           string;
  subject:            string;
  personName:         string;
  personEmail:        string;
  personDepartment:   string;
  personPosition:     string;
  documentDate:       string;
  receivedAt?:        string;
  releasedAt?:        string;
  remarks:            string;
  actionTaken:        string;
  submitterSignature?: string;
  receiverSignature?:  string;
  processedById?:     string;
  processedBy?:       { id: string; name: string; username: string };
  comments?:          RecordComment[];
  isArchived:         boolean;
  archivedAt?:        string;
  isDeleted:          boolean;
  createdAt:          string;
  updatedAt:          string;
}

// Public tracking — no sensitive fields
export interface TrackedRecord {
  trackingCode:  string;
  type:          RecordType;
  status:        RecordStatus;
  documentTitle: string;
  documentNumber: string;
  category:      string;
  subject:       string;
  fromOffice:    string;
  toOffice:      string;
  personName:    string;
  documentDate:  string;
  receivedAt?:   string;
  releasedAt?:   string;
  actionTaken:   string;
  remarks:       string;
  createdAt:     string;
  updatedAt:     string;
}

export interface ActivityLog {
  id:          string;
  action:      string;
  entityType:  string;
  entityId?:   string;
  entityName?: string;
  details:     string;
  adminId?:    string;
  adminName?:  string;
  createdAt:   string;
}

export interface RecordStats {
  total:         number;
  incoming:      number;
  outgoing:      number;
  pending:       number;
  received:      number;
  released:      number;
  archived:      number;
  todayCount:    number;
  weekCount:     number;
  recentRecords: Pick<Record, "id" | "type" | "status" | "documentTitle" | "personName" | "createdAt">[];
}