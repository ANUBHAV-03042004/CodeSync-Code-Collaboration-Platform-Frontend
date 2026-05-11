// ── Auth / User ───────────────────────────────────────────────────────────────
export interface User {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  role: 'USER' | 'ADMIN';
  avatarUrl: string;
  bio: string;
  provider: 'LOCAL' | 'GITHUB' | 'GOOGLE';
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: User;
}

export interface SessionStatus {
  active: boolean;
  remainingMs: number;
  remainingMins: number;
}

// ── Project ───────────────────────────────────────────────────────────────────
export type Visibility = 'PUBLIC' | 'PRIVATE';

export interface Project {
  projectId: number;
  name: string;
  description: string;
  language: string;
  visibility: Visibility;
  ownerId: number;
  memberIds: number[];
  starCount: number;
  starredBy: number[];
  forkCount: number;
  forkedBy: number[];
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description: string;
  language: string;
  visibility: Visibility;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  language?: string;
  visibility?: Visibility;
}

// ── File ──────────────────────────────────────────────────────────────────────
export type FileType = 'FILE' | 'FOLDER';

export interface CodeFile {
  fileId: number;
  projectId: number;
  name: string;
  path: string;
  language: string;
  content: string;
  folder: boolean;
  deleted: boolean;
  createdBy: number;
  lastEditedBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFileRequest {
  projectId: number;
  name: string;
  path: string;
  language: string;
  content: string;
}

export interface CreateFolderRequest {
  projectId: number;
  name: string;
  path: string;
}

// ── Collab Session ────────────────────────────────────────────────────────────
export interface CollabSession {
  sessionId: string;
  projectId: number;
  fileId: number;
  language: string;
  maxParticipants: number;
  passwordProtected: boolean;
}

export interface CreateSessionRequest {
  projectId: number;
  fileId: number;
  language: string;
  maxParticipants: number;
  passwordProtected: boolean;
  password?: string;
}

export interface EditDelta {
  authorId: number;
  content: string;
  timestamp: number;
}

export interface CursorPosition {
  userId: number;
  line: number;
  col: number;
}

// ── Execution ─────────────────────────────────────────────────────────────────
export type JobStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface ExecutionJob {
  jobId: string;
  userId: number;
  projectId: number;
  fileId: number;
  language: string;
  sourceCode: string;
  stdin: string;
  status: JobStatus;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  memoryUsedMb: number;
  createdAt: string;
  completedAt: string;
}

export interface SubmitExecutionRequest {
  projectId: number;
  fileId: number;
  language: string;
  sourceCode: string;
  stdin: string;
}

// ── Version / Snapshot ────────────────────────────────────────────────────────
export interface Snapshot {
  snapshotId: number;
  projectId: number;
  fileId: number;
  authorId: number;
  message: string;
  content: string;
  branch: string;
  tag: string;
  version: number;
  createdAt: string;
}

export interface CreateSnapshotRequest {
  projectId: number;
  fileId: number;
  message: string;
  content: string;
  branch: string;
}

export interface DiffHunk {
  type: 'ADD' | 'REMOVE' | 'CONTEXT';
  line: number;
  content: string;
}

// ── Comment ───────────────────────────────────────────────────────────────────
export interface Comment {
  id: number;
  projectId: number;
  fileId: number;
  authorId: number;
  content: string;
  lineNumber: number;
  columnNumber: number;
  parentCommentId: number | null;
  snapshotId: number | null;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddCommentRequest {
  projectId: number;
  fileId: number;
  content: string;
  lineNumber: number;
  columnNumber?: number;
  parentCommentId?: number;
  snapshotId?: number;
}

// ── Notification ──────────────────────────────────────────────────────────────
export type NotificationType = 'COMMENT' | 'COLLAB_INVITE' | 'EXECUTION_DONE' | 'SYSTEM' | 'BROADCAST';

export interface Notification {
  id: number;
  recipientId: number;
  actorId: number;
  title: string;
  message: string;
  type: NotificationType;
  deepLinkUrl: string;
  read: boolean;
  createdAt: string;
}

export interface BroadcastRequest {
  recipientIds: number[];
  title: string;
  message: string;
  deepLinkUrl: string;
}

// ── Pagination helper ─────────────────────────────────────────────────────────
export interface ApiError {
  status: number;
  message: string;
  timestamp: string;
}
