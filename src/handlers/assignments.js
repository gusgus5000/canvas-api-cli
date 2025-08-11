import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';

export class AssignmentsHandler {
  constructor(api) {
    this.api = api;
  }

  async handle() {
    const choices = [
      { name: '📝 All Assignments', value: 'all' },
      { name: '⏰ Upcoming Assignments', value: 'upcoming' },
      { name: '✗ Missing Assignments', value: 'missing' },
      { name: '✓ Submitted Assignments', value: 'submitted' },
      { name: '📊 Graded Assignments', value: 'graded' },
      new inquirer.Separator(),
      { name: '← Back to Main Menu', value: 'back' }
    ];

    const { filter } = await inquirer.prompt([{
      type: 'list',
      name: 'filter',
      message: 'Assignment Filter:',
      choices
    }]);

    if (filter === 'back') return;

    const spinner = ora('Loading assignments...').start();
    
    try {
      const assignments = await this.api.getAssignments();
      spinner.stop();
      
      const filtered = this.filterAssignments(assignments, filter);
      await this.displayAssignments(filtered, filter);
    } catch (error) {
      spinner.fail(chalk.red('Failed to load assignments'));
      console.error(chalk.red(error.message));
    }
  }

  filterAssignments(assignments, filter) {
    const now = new Date();
    
    switch (filter) {
      case 'upcoming':
        return assignments.filter(a => 
          a.due_at && new Date(a.due_at) > now && 
          (!a.submission || a.submission.workflow_state === 'unsubmitted')
        );
      
      case 'missing':
        return assignments.filter(a => 
          a.submission && a.submission.missing
        );
      
      case 'submitted':
        return assignments.filter(a => 
          a.submission && 
          (a.submission.workflow_state === 'submitted' || 
           a.submission.workflow_state === 'graded')
        );
      
      case 'graded':
        return assignments.filter(a => 
          a.submission && 
          a.submission.workflow_state === 'graded' &&
          a.submission.score !== null
        );
      
      default:
        return assignments;
    }
  }

  async displayAssignments(assignments, filter) {
    console.log();
    console.log(chalk.cyan('═══════════════════════════════════════'));
    console.log(chalk.cyan.bold(`  Assignments - ${this.getFilterTitle(filter)}`));
    console.log(chalk.cyan('═══════════════════════════════════════'));
    
    if (!assignments || assignments.length === 0) {
      console.log(chalk.gray('\n  No assignments found'));
      await this.promptReturn();
      return;
    }

    const grouped = this.groupByCourse(assignments);
    
    for (const [courseName, courseAssignments] of Object.entries(grouped)) {
      console.log();
      console.log(chalk.yellow.bold(`  ${courseName}`));
      console.log(chalk.gray('  ' + '─'.repeat(40)));
      
      courseAssignments.forEach(assignment => {
        this.displayAssignment(assignment);
      });
    }

    await this.promptAssignmentDetails(assignments);
  }

  groupByCourse(assignments) {
    const grouped = {};
    
    assignments.forEach(assignment => {
      const courseName = assignment.course_name || 'Unknown Course';
      if (!grouped[courseName]) {
        grouped[courseName] = [];
      }
      grouped[courseName].push(assignment);
    });
    
    return grouped;
  }

  displayAssignment(assignment) {
    const status = this.getAssignmentStatus(assignment);
    const icon = this.getStatusIcon(status);
    const dueDate = assignment.due_at ? 
      new Date(assignment.due_at) : null;
    
    console.log(`  ${icon} ${chalk.white(assignment.name)}`);
    
    const details = [];
    
    if (dueDate) {
      const isOverdue = dueDate < new Date() && status !== 'submitted' && status !== 'graded';
      const dateStr = dueDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
      details.push(isOverdue ? chalk.red(`Due: ${dateStr}`) : `Due: ${dateStr}`);
    }
    
    if (assignment.points_possible) {
      details.push(`Points: ${assignment.points_possible}`);
    }
    
    if (assignment.submission?.score !== null && assignment.submission?.score !== undefined) {
      const score = `${assignment.submission.score}/${assignment.points_possible}`;
      const percentage = ((assignment.submission.score / assignment.points_possible) * 100).toFixed(1);
      details.push(chalk.green(`Score: ${score} (${percentage}%)`));
    }
    
    if (details.length > 0) {
      console.log(chalk.gray(`     ${details.join(' | ')}`));
    }
  }

  getAssignmentStatus(assignment) {
    if (!assignment.submission) return 'not_started';
    
    const state = assignment.submission.workflow_state;
    if (assignment.submission.missing) return 'missing';
    if (assignment.submission.late) return 'late';
    if (state === 'graded') return 'graded';
    if (state === 'submitted') return 'submitted';
    
    return 'not_started';
  }

  getStatusIcon(status) {
    const icons = {
      'not_started': '○',
      'submitted': '✓',
      'graded': '✓',
      'missing': '✗',
      'late': '⚠'
    };
    return icons[status] || '•';
  }

  getFilterTitle(filter) {
    const titles = {
      all: 'All',
      upcoming: 'Upcoming',
      missing: 'Missing',
      submitted: 'Submitted',
      graded: 'Graded'
    };
    return titles[filter] || 'All';
  }

  async promptAssignmentDetails(assignments) {
    console.log();
    const { viewDetails } = await inquirer.prompt([{
      type: 'confirm',
      name: 'viewDetails',
      message: 'Would you like to view assignment details?',
      default: false
    }]);

    if (!viewDetails) {
      await this.handle();
      return;
    }

    const choices = assignments.map((assignment, index) => {
      const course = assignment.course_name || 'Unknown';
      const due = assignment.due_at ? 
        new Date(assignment.due_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 
        'No due date';
      return {
        name: `${course} - ${assignment.name} (${due})`,
        value: index
      };
    });

    const { index } = await inquirer.prompt([{
      type: 'list',
      name: 'index',
      message: 'Select an assignment:',
      choices,
      pageSize: 10
    }]);

    await this.displayAssignmentDetails(assignments[index]);
    await this.handle();
  }

  async displayAssignmentDetails(assignment) {
    console.log();
    console.log(chalk.cyan('═══════════════════════════════════════'));
    console.log(chalk.cyan.bold('  Assignment Details'));
    console.log(chalk.cyan('═══════════════════════════════════════'));
    
    console.log(chalk.white.bold(`\n  ${assignment.name}`));
    console.log(chalk.gray(`  Course: ${assignment.course_name || 'Unknown'}`));
    
    if (assignment.due_at) {
      const dueDate = new Date(assignment.due_at);
      console.log(chalk.gray(`  Due: ${dueDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })}`));
    }
    
    if (assignment.points_possible) {
      console.log(chalk.gray(`  Points: ${assignment.points_possible}`));
    }
    
    if (assignment.submission_types) {
      console.log(chalk.gray(`  Submission Types: ${assignment.submission_types.join(', ')}`));
    }
    
    if (assignment.submission) {
      console.log();
      console.log(chalk.yellow('  Submission Status:'));
      console.log(chalk.gray(`    State: ${assignment.submission.workflow_state}`));
      
      if (assignment.submission.submitted_at) {
        const submittedDate = new Date(assignment.submission.submitted_at);
        console.log(chalk.gray(`    Submitted: ${submittedDate.toLocaleDateString()}`));
      }
      
      if (assignment.submission.score !== null) {
        const percentage = ((assignment.submission.score / assignment.points_possible) * 100).toFixed(1);
        console.log(chalk.green(`    Score: ${assignment.submission.score}/${assignment.points_possible} (${percentage}%)`));
      }
      
      if (assignment.submission.grade) {
        console.log(chalk.green(`    Grade: ${assignment.submission.grade}`));
      }
    }
    
    if (assignment.description) {
      console.log();
      console.log(chalk.yellow('  Description:'));
      const desc = assignment.description.replace(/<[^>]*>/g, '').trim();
      console.log(chalk.white(`  ${desc.substring(0, 500)}${desc.length > 500 ? '...' : ''}`));
    }
    
    if (assignment.html_url) {
      console.log();
      console.log(chalk.gray(`  URL: ${chalk.cyan.underline(assignment.html_url)}`));
    }
    
    await this.promptReturn();
  }

  async promptReturn() {
    await inquirer.prompt([{
      type: 'input',
      name: 'continue',
      message: 'Press Enter to continue...'
    }]);
  }
}