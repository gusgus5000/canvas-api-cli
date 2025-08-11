#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import dotenv from 'dotenv';
import ora from 'ora';
import { CanvasAPI } from './api/canvas.js';
import { CalendarHandler } from './handlers/calendar.js';
import { CoursesHandler } from './handlers/courses.js';
import { AssignmentsHandler } from './handlers/assignments.js';
import { AnnouncementsHandler } from './handlers/announcements.js';
import { GradesHandler } from './handlers/grades.js';
import { helpMenu } from './utils/help.js';
import { storeToken, getStoredToken, clearToken } from './utils/tokenManager.js';

dotenv.config();

class CanvasCLI {
  constructor() {
    this.api = null;
    this.currentContext = 'main';
    this.handlers = {};
  }

  async init() {
    console.clear();
    console.log(chalk.cyan.bold('═══════════════════════════════════════'));
    console.log(chalk.cyan.bold('    Canvas API CLI - Interactive Mode'));
    console.log(chalk.cyan.bold('═══════════════════════════════════════'));
    console.log();

    const storedToken = await getStoredToken();
    
    if (storedToken) {
      const { useStored } = await inquirer.prompt([{
        type: 'confirm',
        name: 'useStored',
        message: 'Found stored Canvas API token. Use it?',
        default: true
      }]);

      if (useStored) {
        await this.authenticate(storedToken.token, storedToken.domain);
        return;
      }
    }

    await this.promptAuthentication();
  }

  async promptAuthentication() {
    console.log(chalk.yellow('Please provide your Canvas credentials:'));
    console.log(chalk.gray('(Your API token will be stored securely)'));
    console.log();

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'domain',
        message: 'Canvas Domain (e.g., canvas.instructure.com):',
        validate: input => input.length > 0 || 'Domain is required'
      },
      {
        type: 'password',
        name: 'token',
        message: 'Canvas API Token:',
        mask: '*',
        validate: input => input.length > 0 || 'API Token is required'
      },
      {
        type: 'confirm',
        name: 'save',
        message: 'Save credentials for future use?',
        default: true
      }
    ]);

    await this.authenticate(answers.token, answers.domain, answers.save);
  }

  async authenticate(token, domain, save = false) {
    const spinner = ora('Authenticating with Canvas...').start();
    
    try {
      this.api = new CanvasAPI(token, domain);
      const user = await this.api.getCurrentUser();
      
      spinner.succeed(chalk.green(`✓ Authenticated as ${user.name}`));
      
      if (save) {
        await storeToken(token, domain);
        console.log(chalk.gray('Credentials saved securely'));
      }

      this.initHandlers();
      await this.mainMenu();
    } catch (error) {
      spinner.fail(chalk.red('Authentication failed'));
      console.log(chalk.red(`Error: ${error.message}`));
      
      const { retry } = await inquirer.prompt([{
        type: 'confirm',
        name: 'retry',
        message: 'Would you like to try again?',
        default: true
      }]);

      if (retry) {
        await this.promptAuthentication();
      } else {
        process.exit(1);
      }
    }
  }

  initHandlers() {
    this.handlers = {
      calendar: new CalendarHandler(this.api),
      courses: new CoursesHandler(this.api),
      assignments: new AssignmentsHandler(this.api),
      announcements: new AnnouncementsHandler(this.api),
      grades: new GradesHandler(this.api)
    };
  }

  async mainMenu() {
    console.log();
    console.log(chalk.cyan('═══════════════════════════════════════'));
    console.log(chalk.cyan.bold('         Main Menu'));
    console.log(chalk.cyan('═══════════════════════════════════════'));
    
    const choices = [
      { name: '📅 Calendar - View events and deadlines', value: 'calendar' },
      { name: '📚 Courses - Browse your courses', value: 'courses' },
      { name: '📝 Assignments - View and manage assignments', value: 'assignments' },
      { name: '📢 Announcements - Read course announcements', value: 'announcements' },
      { name: '📊 Grades - Check your grades', value: 'grades' },
      new inquirer.Separator(),
      { name: '❓ Help - View available commands', value: 'help' },
      { name: '🔄 Refresh - Re-authenticate', value: 'refresh' },
      { name: '🗑️  Clear Token - Remove saved credentials', value: 'clear' },
      { name: '🚪 Exit', value: 'exit' }
    ];

    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices,
      loop: false
    }]);

    await this.handleMainAction(action);
  }

  async handleMainAction(action) {
    switch (action) {
      case 'calendar':
      case 'courses':
      case 'assignments':
      case 'announcements':
      case 'grades':
        this.currentContext = action;
        await this.handlers[action].handle();
        await this.mainMenu();
        break;
      
      case 'help':
        helpMenu('main');
        await this.mainMenu();
        break;
      
      case 'refresh':
        await this.promptAuthentication();
        break;
      
      case 'clear':
        await this.clearCredentials();
        break;
      
      case 'exit':
        console.log(chalk.cyan('\nThank you for using Canvas CLI! 👋'));
        process.exit(0);
        break;
      
      default:
        await this.mainMenu();
    }
  }

  async clearCredentials() {
    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to clear saved credentials?',
      default: false
    }]);

    if (confirm) {
      await clearToken();
      console.log(chalk.green('✓ Credentials cleared'));
      await this.promptAuthentication();
    } else {
      await this.mainMenu();
    }
  }

  async handleCommand(input) {
    const command = input.trim().toLowerCase();
    
    if (command === '/help') {
      helpMenu(this.currentContext);
      return true;
    }
    
    if (command === '/back' || command === '/exit') {
      if (this.currentContext !== 'main') {
        this.currentContext = 'main';
        return false;
      }
      return false;
    }
    
    return false;
  }
}

async function main() {
  const cli = new CanvasCLI();
  
  try {
    await cli.init();
  } catch (error) {
    console.error(chalk.red('Fatal error:'), error.message);
    process.exit(1);
  }
}

main().catch(console.error);