import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable({providedIn: 'root'})
export class AuthService {
    private baseUrl = 'http://localhost:3000/api/users';
    constructor(private http: HttpClient) {}

    register(userData: any) {
        return this.http.post(`${this.baseUrl}/register`, userData);
    }

    getUser(id: string){
        return this.http.get(`${this.baseUrl}/${id}`);
    }

    updateUser(id: string, userData: any){
        return this.http.put(`${this.baseUrl}/${id}`, userData);
    }
    login(credentials: any) {
        return this.http.post(`${this.baseUrl}/login`, credentials);
    }
    getTeams(): Observable<any> {
        return this.http.get<any>('http://localhost:3000/api/teams');
    }
    getSuggestions(userId: string): Observable<any> {
        return this.http.get<any[]>(`http://localhost:3000/api/users-data/suggestions/${userId}`);
    }
}