import { Component, signal } from '@angular/core';

import { UserListComponent } from './components/user-list-component/user-list-component';
import { TaskListComponent } from './components/task-list-component/task-list-component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [UserListComponent, TaskListComponent , CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('angular-frontend');
}
