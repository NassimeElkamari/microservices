import { Component } from '@angular/core';
import { TaskService } from '../../services/task-service';
import { UserService } from '../../services/user-service';
import { Task } from '../../models/task.model';
import { User } from '../../models/user.model';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TaskDialogComponent } from '../task-dialog/task-dialog.component';

@Component({
  selector: 'app-task-list-component',
  imports: [
    CommonModule, 
    MatIconModule, 
    MatButtonModule, 
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    ReactiveFormsModule
  ],
  templateUrl: './task-list-component.html',
  styleUrl: './task-list-component.css'
})
export class TaskListComponent {
  tasks: Task[] = [];
  users: User[] = [];
  loading = false;
  taskForm: FormGroup;

  constructor(
    private taskService: TaskService,
    private userService: UserService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      user_id: ['', Validators.required],
      status: ['pending', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadTasks();
    this.loadUsers();
  }

  loadTasks(): void {
    this.loading = true;
    this.taskService.getAll().subscribe({
      next: (data) => {
        this.tasks = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching tasks:', err);
        this.loading = false;
        this.snackBar.open('Error loading tasks', 'Close', { duration: 3000 });
      }
    });
  }

  loadUsers(): void {
    this.userService.getAll().subscribe({
      next: (data) => {
        this.users = data;
      },
      error: (err) => {
        console.error('Error fetching users:', err);
        this.snackBar.open('Error loading users', 'Close', { duration: 3000 });
      }
    });
  }

  openAddTask() {
    this.taskForm.reset();
    this.taskForm.patchValue({ status: 'pending' });
    
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '500px',
      data: { 
        form: this.taskForm, 
        users: this.users, 
        title: 'Add New Task' 
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createTask(result);
      }
    });
  }
  
  openEditTask(task: Task) {
    this.taskForm.patchValue({
      title: task.title,
      description: task.description,
      user_id: task.user_id,
      status: task.status
    });
    
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '500px',
      data: { 
        form: this.taskForm, 
        users: this.users, 
        title: 'Edit Task',
        taskId: task.id
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && task.id) {
        this.updateTask(task.id, result);
      }
    });
  }
  
  createTask(taskData: any) {
    this.taskService.create(taskData).subscribe({
      next: () => {
        this.snackBar.open('Task created successfully', 'Close', { duration: 3000 });
        this.loadTasks();
      },
      error: (err) => {
        console.error('Error creating task:', err);
        this.snackBar.open('Error creating task', 'Close', { duration: 3000 });
      }
    });
  }

  updateTask(id: number, taskData: any) {
    this.taskService.update(id, taskData).subscribe({
      next: () => {
        this.snackBar.open('Task updated successfully', 'Close', { duration: 3000 });
        this.loadTasks();
      },
      error: (err) => {
        console.error('Error updating task:', err);
        this.snackBar.open('Error updating task', 'Close', { duration: 3000 });
      }
    });
  }
  
  deleteTask(id: number | undefined) {
    if (id === undefined) {
      return;
    }
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.delete(id).subscribe({
        next: () => {
          this.snackBar.open('Task deleted successfully', 'Close', { duration: 3000 });
          this.loadTasks();
        },
        error: (err) => {
          console.error('Error deleting task:', err);
          this.snackBar.open('Error deleting task', 'Close', { duration: 3000 });
        }
      });
    }
  }

  getUserName(userId: number | undefined): string {
    if (!userId) return 'Unassigned';
    const user = this.users.find(u => u.id === userId);
    return user ? user.name : `User ${userId}`;
  }
  
}
