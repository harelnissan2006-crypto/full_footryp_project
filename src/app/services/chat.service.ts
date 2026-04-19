import { Injectable } from "@angular/core";
import {io, Socket} from "socket.io-client";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ChatService {
    private socket: Socket;
    private url = 'http://localhost:3000';

    constructor() {this.socket = io(this.url);}

    joinRoom(matchId: string) {
        this.socket.emit('joinRoom', matchId);
    }
    sendMessage(matchId: string, senderName: string, content: string) {
        this.socket.emit('send_message', { matchId, senderName, content });
    }
    getMessages(): Observable<any> {
        return new Observable(observer => {
            this.socket.on('receive_message', (message) => {
                observer.next(message);
            });
        });
    }
}