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

    getSuggestions(userId: string): Observable<MatchTrip[]> {
        return this.http.get<MatchTrip[]>(`${this.apiUrl}/suggestions/${userId}`);
    }
}