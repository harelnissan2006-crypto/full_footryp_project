import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";

@Injectable({providedIn: 'root'})
export class PackagesService {
    private apiUrl = 'http://localhost:3000/api/packages';

    constructor(private http: HttpClient) {}

    getPackages(userId: string, matchData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/${userId}`, matchData);
    }
}