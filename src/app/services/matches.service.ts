import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { MatchTrip } from "../models/match-trip.model";

@Injectable({
  providedIn: "root",
})
export class MatchesService {
    private apiUrl = "http://localhost:3000/api/matches";

    constructor(private http: HttpClient) {}

    generateSuggestions(userId: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/generate/${userId}`, {});
    }

    getSuggestions(userId: string, fromDate?: string, competition?: string): Observable<MatchTrip[]> {
        const params = new URLSearchParams();
        if (fromDate) params.append('fromDate', fromDate);
        if (competition) params.append('competition', competition);
        const query = params.toString() ? `?${params.toString()}` : '';
        return this.http.get<MatchTrip[]>(`${this.apiUrl}/suggestions/${userId}${query}`);
    }

    getCompetitions(userId: string): Observable<string[]> {
        return this.http.get<string[]>(`${this.apiUrl}/competitions/${userId}`);
    }
}