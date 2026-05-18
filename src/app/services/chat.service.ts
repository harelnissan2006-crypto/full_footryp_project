import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({ providedIn: 'root' })
export class ChatService {
    private socket: Socket;
    private url = 'http://localhost:3000';

    constructor(private http: HttpClient) {
        this.socket = io(this.url);
    }

    joinRoom(matchId: string, username: string) {
        this.socket.emit('joinRoom', { matchId, username });
    }

    sendMessage(matchId: string, senderName: string, content: string) {
        this.socket.emit('send_message', { matchId, senderName, content });
    }

    getMessages(): Observable<any> {
        return new Observable(observer => {
            this.socket.on('receive_message', (message) => observer.next(message));
        });
    }

    getOnlineUsers(): Observable<string[]> {
        return new Observable(observer => {
            this.socket.on('online_users', (users) => observer.next(users));
        });
    }

    // ✅ כל המשתמשים שהיו בצ'אט
    getAllUsers(): Observable<string[]> {
        return new Observable(observer => {
            this.socket.on('all_users', (users) => observer.next(users));
        });
    }
    getRoomParticipants(matchId: string): Observable<string[]> {
        return this.http.get<string[]>(`${this.url}/api/users/chat/${matchId}/participants`);
    }

    getHistory(matchId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.url}/api/users/chat/${matchId}/messages`);
    }

    // ✅ התנתקות מהצ'אט
    leaveRoom(matchId: string, username: string) {
        this.socket.emit('leaveRoom', { matchId, username });
    }
}