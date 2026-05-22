import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Project, CreateProjectRequest, UpdateProjectRequest } from '../core/models';
// ProjectService: Angular service executing workspace project creation, stargazing, forking, and sharing.
//

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/api/v1/projects`;

  create(req: CreateProjectRequest): Observable<Project> {
    return this.http.post<Project>(this.base, req);
  }

  getById(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.base}/${id}`);
  }

  getByOwner(ownerId: number): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.base}/owner/${ownerId}`);
  }

  getPublic(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.base}/public`);
  }

  search(q: string): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.base}/search`, { params: { q } });
  }

  getByMember(userId: number): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.base}/member/${userId}`);
  }

  getByLanguage(lang: string): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.base}/language/${lang}`);
  }

  update(id: number, req: UpdateProjectRequest): Observable<Project> {
    return this.http.put<Project>(`${this.base}/${id}`, req);
  }

  archive(id: number): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}/archive`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  fork(id: number): Observable<Project> {
    return this.http.post<Project>(`${this.base}/${id}/fork`, {});
  }

  star(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/star`, {});
  }

  addMember(id: number, memberId: number): Observable<Project> {
    return this.http.post<Project>(`${this.base}/${id}/members/${memberId}`, {});
  }

  removeMember(id: number, memberId: number): Observable<Project> {
    return this.http.delete<Project>(`${this.base}/${id}/members/${memberId}`);
  }
}