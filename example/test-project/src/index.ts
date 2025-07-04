// Example TypeScript file for testing CodeCheck CLI
export interface User {
  id: number;
  name: string;
  email: string;
}

export class UserService {
  private users: User[] = [];

  addUser(user: User): void {
    this.users.push(user);
  }

  getUserById(id: number): User | undefined {
    return this.users.find((user) => user.id === id);
  }

  getAllUsers(): User[] {
    return this.users;
  }

  // This function has some intentional issues for testing
  processUsers() {
    var result = [];
    for (var i = 0; i < this.users.length; i++) {
      if (this.users[i].email == undefined) {
        continue;
      }
      result.push(this.users[i].name.toUpperCase());
    }
    return result;
  }
}

// Example with potential security issue
function executeCommand(cmd: string) {
  eval(cmd); // This is a security vulnerability
}

// Missing return type annotation
function calculateSum(a, b) {
  return a + b;
}

const userService = new UserService();
userService.addUser({ id: 1, name: 'John Doe', email: 'john@example.com' });
