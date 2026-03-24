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

export interface Record {
  id:                 string;
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
  isDeleted:          boolean;
  createdAt:          string;
  updatedAt:          string;
}

export interface ActivityLog {
  id:         string;
  action:     string;
  entityType: string;
  entityId?:  string;
  entityName?: string;
  details:    string;
  adminId?:   string;
  adminName?: string;
  createdAt:  string;
}

export interface RecordStats {
  total:         number;
  incoming:      number;
  outgoing:      number;
  pending:       number;
  received:      number;
  released:      number;
  todayCount:    number;
  weekCount:     number;
  recentRecords: Record[];
}