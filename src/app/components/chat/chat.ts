import { Component, OnInit, OnDestroy } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

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
  userName: string = 'user';

  private messageSubscription?: Subscription;

  constructor(private chatService: ChatService,
              private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.matchId = this.route.snapshot.paramMap.get('matchId') || '';

    const savedName = localStorage.getItem('userName');
    if (savedName) {
      this.userName = savedName;
    }
    if(this.matchId){
      this.chatService.joinRoom(this.matchId);
    }

    this.messageSubscription = this.chatService.getMessages().subscribe((message: any) => {
      this.messages.push(message);
      this.scrollToBottom();
    });
  }

  sendMessage(): void {
    if (this.newMessage.trim()) {
      this.chatService.sendMessage(this.matchId, this.userName, this.newMessage);
      this.newMessage = '';
    }
  }
  ngOnDestroy(): void {
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const element = document.querySelector('.messages-list');
      if(element){
        element.scrollTop = element.scrollHeight;
      }
    }, 100);
  }
}
