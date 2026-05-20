import { Routes } from '@angular/router';
import { Register } from './components/register/register';
import { MatchesList } from './components/matches-list/matches-list';
import { Profile } from './components/profile/profile';
import { Login } from './components/login/login';
import { Chat } from './components/chat/chat';
import {UserSuggestions} from "./components/user-suggestions/user-suggestions";
import {Packages} from "./components/packages/packages";

export const routes: Routes = [
    {path: '', redirectTo: '/login', pathMatch: 'full'},
    {path: 'login', component: Login},
    {path: 'register', component: Register},
    {path: 'matches', component: MatchesList},
    {path: 'profile', component: Profile},
    {path: 'chat/:matchId', component: Chat},
    {path: 'suggestions', component: UserSuggestions},
    {path: 'packages/:matchId', component: Packages},
    {path: '**', redirectTo: '/login' }
];
