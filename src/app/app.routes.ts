import { Routes } from '@angular/router';
import { Register } from './components/register/register';
import { MatchesList } from './components/matches-list/matches-list';
import { Profile } from './components/profile/profile';
import { Login } from './components/login/login';
import { Chat } from './components/chat/chat';
import {UserSuggestions} from "./components/user-suggestions/user-suggestions";
import {Packages} from "./components/packages/packages";
import { ChatsList } from './components/chats-list/chats-list';

export const routes: Routes = [
    {path: '', redirectTo: '/login', pathMatch: 'full'},
    {path: 'login', component: Login},
    {path: 'register', component: Register},
    {path: 'matches', component: MatchesList},
    {path: 'profile', component: Profile},
    {path: 'chats', component: ChatsList},
    {path: 'chat/:matchId', component: Chat},
    {path: 'dm/:otherUser', component: Chat},
    {path: 'suggestions', component: UserSuggestions},
    {path: 'packages/:matchId', component: Packages},
    {path: '**', redirectTo: '/login' }
];
