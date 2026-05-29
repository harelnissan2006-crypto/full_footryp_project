import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-chats-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chats-list.html',
  styleUrl: './chats-list.css',
})
export class ChatsList implements OnInit{
  chats: any[] = [];
  isLoading: boolean = true;
  userName: string = '';

  constructor(private chatService: ChatService, private router: Router){
  }

  ngOnInit(): void {
    this.userName = localStorage.getItem('username') || 'user';
    this.loadChats();
  }

  loadChats(): void{
    this.chatService.getUserChats(this.userName).subscribe({
      next: (chats) => {
        this.chats = chats;
        this.isLoading = false;
      },
      error: (err) =>{
        console.error('Error loading chats', err);
        this.isLoading = false;
      }
    });
  }

  openChat(chat: any): void{
    if(chat.isDM){
      this.router.navigate(['/dm', chat.otherUser], { queryParams: { from: 'chats' } });
    }else{
      this.router.navigate(['/chat', chat.matchId], { queryParams: { from: 'chats' } });
    }
  }

  getChatDisplayName(chat: any): string{
    if(chat.isDM){
      return `💬 ${chat.otherUser}`;
    }else{
      return `Game Chat - ${chat.matchId}`;
    }
  }
}
