import { Component } from '@angular/core';
import { User } from '../../models/user.model';
import { UserService } from '../../services/user-service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserDialogComponent } from '../user-dialog/user-dialog.component';

@Component({
  selector: 'app-user-list-component',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    ReactiveFormsModule
  ],
  templateUrl: './user-list-component.html',
  styleUrl: './user-list-component.css'
})
export class UserListComponent {
  users: User[] = [];
  loading = false;
  userForm: FormGroup;

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getAll().subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching users:', err);
        this.loading = false;
        this.snackBar.open('Error loading users', 'Close', { duration: 3000 });
      }
    });
  }

  openAddUser(): void {
    this.userForm.reset();
    
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '500px',
      data: { 
        form: this.userForm, 
        title: 'Add New User' 
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createUser(result);
      }
    });
  }

  openEditUser(user: User): void {
    this.userForm.patchValue({
      name: user.name,
      email: user.email
    });
    
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '500px',
      data: { 
        form: this.userForm, 
        title: 'Edit User',
        userId: user.id
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && user.id) {
        this.updateUser(user.id, result);
      }
    });
  }

  createUser(userData: any) {
    this.userService.create(userData).subscribe({
      next: () => {
        this.snackBar.open('User created successfully', 'Close', { duration: 3000 });
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error creating user:', err);
        this.snackBar.open('Error creating user', 'Close', { duration: 3000 });
      }
    });
  }

  updateUser(id: number, userData: any) {
    this.userService.update(id, userData).subscribe({
      next: () => {
        this.snackBar.open('User updated successfully', 'Close', { duration: 3000 });
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error updating user:', err);
        this.snackBar.open('Error updating user', 'Close', { duration: 3000 });
      }
    });
  }

  deleteUser(id?: number): void {
    if (id == null) {
      return;
    }
    const confirmed = confirm('Are you sure you want to delete this user?');
    if (!confirmed) {
      return;
    }
    this.userService.delete(id).subscribe({
      next: () => {
        this.snackBar.open('User deleted successfully', 'Close', { duration: 3000 });
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error deleting user:', err);
        this.snackBar.open('Error deleting user', 'Close', { duration: 3000 });
      }
    });
  }
}
