import { UserService } from './services/api';
import { formatUser, calculateAge } from './utils/helpers';
import { User } from './utils/types';

/**
 * Main application entry point
 * Demonstrates various code patterns for analysis
 */
async function main() {
  const userService = new UserService();

  try {
    // Fetch user data
    const users = await userService.getUsers();

    // Process users with various complexity patterns
    const processedUsers = users.map((user: User) => {
      const age = calculateAge(user.birthDate);

      // Intentional code quality issues for demonstration
      if (age > 18) {
        if (user.isActive) {
          if (user.role === 'admin') {
            // Deep nesting - code quality issue
            return {
              ...user,
              formattedName: formatUser(user),
              age,
              canAccess: true,
            };
          }
        }
      }

      return {
        ...user,
        formattedName: formatUser(user),
        age,
        canAccess: false,
      };
    });

    // Display results
    console.log('Processed Users:', processedUsers);

    // Synchronous file operation - performance issue
    const fs = require('fs');
    fs.writeFileSync('./output.json', JSON.stringify(processedUsers, null, 2));
  } catch (error) {
    // Poor error handling - code quality issue
    console.log('Error occurred', error);
  }
}

// Execute main function
main();
