import { Component, OnInit, OnDestroy } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat implements OnInit, OnDestroy {
    matchId: string = '';
    newMessage: string = '';
    messages: any[] = [];
    onlineUsers: string[] = [];
    allUsers: string[] = [];
    userName: string = '';
    isDM: boolean = false;
    otherUser: string = '';

    private messageSubscription?: Subscription;
    private usersSubscription?: Subscription;
    private allUsersSubscription?: Subscription;

    backTarget: string | null = null;

    constructor(
        private chatService: ChatService,
        private route: ActivatedRoute,
        private router: Router 
    ) {}

    ngOnInit(): void {
        this.userName = localStorage.getItem('username') || 'user';
        const matchIdParam = this.route.snapshot.paramMap.get('matchId');
        const otherUserParam = this.route.snapshot.paramMap.get('otherUser');
        this.backTarget = this.route.snapshot.queryParamMap.get('from');
        
        if(otherUserParam){
            const users = [this.userName, otherUserParam].sort();
            this.matchId = `dm_${users[0]}_${users[1]}`;
            this.isDM = true;
            this.otherUser = otherUserParam;
        }else{
            this.matchId = matchIdParam || '';
            this.isDM = false;
        }
           
        this.chatService.getHistory(this.matchId).subscribe({
            next: (history) => { this.messages = history; this.scrollToBottom(); },
            error: (err) => console.error('Error loading history:', err)
        });

        if(!this.isDM){
            this.chatService.getRoomParticipants(this.matchId).subscribe({
            next: (participants) => {this.allUsers = participants;},
            error: (err) => console.error('Error loading participants:', err)
            });
        }
        
        this.chatService.joinRoom(this.matchId, this.userName);

        this.messageSubscription = this.chatService.getMessages().subscribe((message: any) => {
            this.messages.push(message);
            this.scrollToBottom();
        });

        this.usersSubscription = this.chatService.getOnlineUsers().subscribe((users: string[]) => {
            this.onlineUsers = users;
        });

        this.allUsersSubscription = this.chatService.getAllUsers().subscribe((users: string[]) => {
            this.allUsers = users;
        });
    }

    sendMessage(): void {
        if (this.newMessage.trim()) {
            this.chatService.sendMessage(this.matchId, this.userName, this.newMessage);
            this.newMessage = '';
        }
    }

    goBack(): void {
        if (this.backTarget === 'chats') {
            this.router.navigate(['/chats']);
            return;
        }
        if (this.backTarget === 'travelCompanions') {
            this.router.navigate(['/suggestions']);
            return;
        }
        this.router.navigate(['/matches']);
    }

    leaveChat(): void {
        const confirmed = confirm('Are you sure you want to leve the chat?');
        if (confirmed) {
            this.chatService.leaveRoom(this.matchId, this.userName);
            this.router.navigate(['/matches']);
        }
    }

    ngOnDestroy(): void {
        this.messageSubscription?.unsubscribe();
        this.usersSubscription?.unsubscribe();
        this.allUsersSubscription?.unsubscribe();
    }

    private scrollToBottom(): void {
        setTimeout(() => {
            const element = document.querySelector('.messages-list');
            if (element) element.scrollTop = element.scrollHeight;
        }, 100);
    }
}