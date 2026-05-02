import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CodeFile, CreateFileRequest, CreateFolderRequest } from '../core/models';

@Injectable({ providedIn: 'root' })
export class FileService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/api/v1/files`;

  createFile(req: CreateFileRequest): Observable<CodeFile> {
    return this.http.post<CodeFile>(this.base, req);
  }

  createFolder(req: CreateFolderRequest): Observable<CodeFile> {
    return this.http.post<CodeFile>(`${this.base}/folder`, req);
  }

  getById(id: number): Observable<CodeFile> {
    return this.http.get<CodeFile>(`${this.base}/${id}`);
  }

  getByProject(projectId: number): Observable<CodeFile[]> {
    return this.http.get<CodeFile[]>(`${this.base}/project/${projectId}`);
  }

  getTree(projectId: number): Observable<CodeFile[]> {
    return this.http.get<CodeFile[]>(`${this.base}/project/${projectId}/tree`);
  }

  getContent(id: number): Observable<{ content: string }> {
    return this.http.get<{ content: string }>(`${this.base}/${id}/content`);
  }

  updateContent(id: number, content: string): Observable<CodeFile> {
    return this.http.put<CodeFile>(`${this.base}/${id}/content`, { content });
  }

  rename(id: number, name: string): Observable<CodeFile> {
    return this.http.put<CodeFile>(`${this.base}/${id}/rename`, { name });
  }

  move(id: number, path: string): Observable<CodeFile> {
    return this.http.put<CodeFile>(`${this.base}/${id}/move`, { path });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  restore(id: number): Observable<CodeFile> {
    return this.http.post<CodeFile>(`${this.base}/${id}/restore`, {});
  }

  search(projectId: number, q: string): Observable<CodeFile[]> {
    return this.http.get<CodeFile[]>(`${this.base}/project/${projectId}/search`, { params: { q } });
  }
}
