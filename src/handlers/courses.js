import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';

export class CoursesHandler {
  constructor(api) {
    this.api = api;
  }

  async handle() {
    const spinner = ora('Loading courses...').start();
    
    try {
      const courses = await this.api.getCourses();
      spinner.stop();
      
      if (!courses || courses.length === 0) {
        console.log(chalk.gray('\nNo active courses found'));
        return;
      }

      await this.displayCoursesMenu(courses);
    } catch (error) {
      spinner.fail(chalk.red('Failed to load courses'));
      console.error(chalk.red(error.message));
    }
  }

  async displayCoursesMenu(courses) {
    console.log();
    console.log(chalk.cyan('═══════════════════════════════════════'));
    console.log(chalk.cyan.bold('  Your Courses'));
    console.log(chalk.cyan('═══════════════════════════════════════'));
    
    const courseChoices = courses.map(course => ({
      name: `📚 ${course.name} (${course.course_code})`,
      value: course.id
    }));
    
    courseChoices.push(
      new inquirer.Separator(),
      { name: '🔍 Search Courses', value: 'search' },
      { name: '← Back to Main Menu', value: 'back' }
    );

    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'Select a course:',
      choices: courseChoices,
      pageSize: 10
    }]);

    if (action === 'back') return;
    
    if (action === 'search') {
      await this.searchCourses(courses);
      return;
    }

    const course = courses.find(c => c.id === action);
    await this.displayCourseDetails(course);
  }

  async searchCourses(courses) {
    const { query } = await inquirer.prompt([{
      type: 'input',
      name: 'query',
      message: 'Enter search term:'
    }]);

    const filtered = courses.filter(course => 
      course.name.toLowerCase().includes(query.toLowerCase()) ||
      course.course_code.toLowerCase().includes(query.toLowerCase())
    );

    if (filtered.length === 0) {
      console.log(chalk.gray('No courses found matching your search'));
      await this.displayCoursesMenu(courses);
      return;
    }

    await this.displayCoursesMenu(filtered);
  }

  async displayCourseDetails(course) {
    console.log();
    console.log(chalk.cyan('═══════════════════════════════════════'));
    console.log(chalk.cyan.bold('  Course Details'));
    console.log(chalk.cyan('═══════════════════════════════════════'));
    
    console.log(chalk.white.bold(`\n  ${course.name}`));
    console.log(chalk.gray(`  Course Code: ${course.course_code}`));
    
    if (course.enrollment_term_id) {
      console.log(chalk.gray(`  Term: ${course.term?.name || 'Current'}`));
    }
    
    if (course.teachers && course.teachers.length > 0) {
      console.log(chalk.gray(`  Instructor(s): ${course.teachers.map(t => t.display_name).join(', ')}`));
    }
    
    if (course.enrollments && course.enrollments[0]) {
      const enrollment = course.enrollments[0];
      if (enrollment.computed_current_score) {
        console.log(chalk.green(`  Current Grade: ${enrollment.computed_current_score}%`));
      }
    }

    const choices = [
      { name: '📝 View Assignments', value: 'assignments' },
      { name: '📢 View Announcements', value: 'announcements' },
      { name: '📊 View Grades', value: 'grades' },
      { name: '📚 View Modules', value: 'modules' },
      { name: '💬 View Discussions', value: 'discussions' },
      { name: '📁 View Files', value: 'files' },
      { name: '📰 View Activity Stream', value: 'stream' },
      new inquirer.Separator(),
      { name: '← Back to Courses', value: 'back' }
    ];

    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'What would you like to view?',
      choices
    }]);

    if (action === 'back') {
      await this.handle();
      return;
    }

    await this.handleCourseAction(course, action);
  }

  async handleCourseAction(course, action) {
    const spinner = ora(`Loading ${action}...`).start();
    
    try {
      switch (action) {
        case 'assignments':
          const assignments = await this.api.getAssignments(course.id);
          spinner.stop();
          await this.displayAssignments(assignments, course);
          break;
        
        case 'announcements':
          const announcements = await this.api.getAnnouncements([`course_${course.id}`]);
          spinner.stop();
          await this.displayAnnouncements(announcements, course);
          break;
        
        case 'grades':
          const grades = await this.api.getGrades(course.id);
          spinner.stop();
          await this.displayGrades(grades, course);
          break;
        
        case 'modules':
          const modules = await this.api.getModules(course.id);
          spinner.stop();
          await this.displayModules(modules, course);
          break;
        
        case 'discussions':
          const discussions = await this.api.getDiscussionTopics(course.id);
          spinner.stop();
          await this.displayDiscussions(discussions, course);
          break;
        
        case 'files':
          const files = await this.api.getFiles(course.id);
          spinner.stop();
          await this.displayFiles(files, course);
          break;
        
        case 'stream':
          const stream = await this.api.getCourseStream(course.id);
          spinner.stop();
          await this.displayStream(stream, course);
          break;
      }
    } catch (error) {
      spinner.fail(chalk.red(`Failed to load ${action}`));
      console.error(chalk.red(error.message));
    }
    
    await this.displayCourseDetails(course);
  }

  async displayAssignments(assignments, course) {
    console.log();
    console.log(chalk.yellow.bold(`  Assignments for ${course.name}`));
    console.log(chalk.gray('  ' + '─'.repeat(40)));
    
    if (!assignments || assignments.length === 0) {
      console.log(chalk.gray('  No assignments found'));
    } else {
      assignments.forEach(assignment => {
        const dueDate = assignment.due_at ? 
          new Date(assignment.due_at).toLocaleDateString() : 
          'No due date';
        const status = assignment.submission?.workflow_state || 'not_submitted';
        const statusIcon = this.getStatusIcon(status);
        
        console.log(`  ${statusIcon} ${chalk.white(assignment.name)}`);
        console.log(chalk.gray(`     Due: ${dueDate} | Points: ${assignment.points_possible || 'N/A'}`));
      });
    }
    
    await this.promptContinue();
  }

  async displayAnnouncements(announcements, course) {
    console.log();
    console.log(chalk.yellow.bold(`  Announcements for ${course.name}`));
    console.log(chalk.gray('  ' + '─'.repeat(40)));
    
    if (!announcements || announcements.length === 0) {
      console.log(chalk.gray('  No announcements found'));
    } else {
      announcements.slice(0, 5).forEach(announcement => {
        const date = new Date(announcement.posted_at).toLocaleDateString();
        console.log(`  📢 ${chalk.white(announcement.title)}`);
        console.log(chalk.gray(`     Posted: ${date} by ${announcement.user_name || 'Unknown'}`));
      });
    }
    
    await this.promptContinue();
  }

  async displayGrades(grades, course) {
    console.log();
    console.log(chalk.yellow.bold(`  Grades for ${course.name}`));
    console.log(chalk.gray('  ' + '─'.repeat(40)));
    
    if (grades.current_score) {
      console.log(chalk.green(`  Current Score: ${grades.current_score}%`));
    }
    if (grades.current_grade) {
      console.log(chalk.green(`  Current Grade: ${grades.current_grade}`));
    }
    if (grades.final_score) {
      console.log(chalk.yellow(`  Final Score: ${grades.final_score}%`));
    }
    if (grades.final_grade) {
      console.log(chalk.yellow(`  Final Grade: ${grades.final_grade}`));
    }
    
    await this.promptContinue();
  }

  async displayModules(modules, course) {
    console.log();
    console.log(chalk.yellow.bold(`  Modules for ${course.name}`));
    console.log(chalk.gray('  ' + '─'.repeat(40)));
    
    if (!modules || modules.length === 0) {
      console.log(chalk.gray('  No modules found'));
    } else {
      modules.forEach(module => {
        const state = module.state || 'locked';
        const icon = state === 'completed' ? '✓' : state === 'started' ? '◐' : '○';
        console.log(`  ${icon} ${chalk.white(module.name)}`);
        if (module.items && module.items.length > 0) {
          console.log(chalk.gray(`     ${module.items.length} items`));
        }
      });
    }
    
    await this.promptContinue();
  }

  async displayDiscussions(discussions, course) {
    console.log();
    console.log(chalk.yellow.bold(`  Discussions for ${course.name}`));
    console.log(chalk.gray('  ' + '─'.repeat(40)));
    
    if (!discussions || discussions.length === 0) {
      console.log(chalk.gray('  No discussions found'));
    } else {
      discussions.slice(0, 5).forEach(discussion => {
        const date = discussion.last_reply_at ? 
          new Date(discussion.last_reply_at).toLocaleDateString() : 
          'No replies';
        console.log(`  💬 ${chalk.white(discussion.title)}`);
        console.log(chalk.gray(`     Last activity: ${date} | Replies: ${discussion.discussion_subentry_count || 0}`));
      });
    }
    
    await this.promptContinue();
  }

  async displayFiles(files, course) {
    console.log();
    console.log(chalk.yellow.bold(`  Files for ${course.name}`));
    console.log(chalk.gray('  ' + '─'.repeat(40)));
    
    if (!files || files.length === 0) {
      console.log(chalk.gray('  No files found'));
    } else {
      files.slice(0, 10).forEach(file => {
        const size = this.formatFileSize(file.size);
        console.log(`  📄 ${chalk.white(file.display_name)}`);
        console.log(chalk.gray(`     Size: ${size} | Modified: ${new Date(file.modified_at).toLocaleDateString()}`));
      });
    }
    
    await this.promptContinue();
  }

  async displayStream(stream, course) {
    console.log();
    console.log(chalk.yellow.bold(`  Recent Activity for ${course.name}`));
    console.log(chalk.gray('  ' + '─'.repeat(40)));
    
    if (!stream || stream.length === 0) {
      console.log(chalk.gray('  No recent activity'));
    } else {
      stream.slice(0, 5).forEach(item => {
        const date = new Date(item.created_at).toLocaleDateString();
        const icon = this.getActivityIcon(item.type);
        console.log(`  ${icon} ${chalk.white(item.title)}`);
        console.log(chalk.gray(`     ${date} - ${item.type}`));
      });
    }
    
    await this.promptContinue();
  }

  getStatusIcon(status) {
    const icons = {
      'submitted': '✓',
      'graded': '✓',
      'not_submitted': '○',
      'missing': '✗',
      'late': '⚠'
    };
    return icons[status] || '•';
  }

  getActivityIcon(type) {
    const icons = {
      'Announcement': '📢',
      'Assignment': '📝',
      'Discussion': '💬',
      'Message': '✉️',
      'Submission': '📤',
      'Grade': '📊'
    };
    return icons[type] || '📌';
  }

  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  async promptContinue() {
    await inquirer.prompt([{
      type: 'input',
      name: 'continue',
      message: 'Press Enter to continue...'
    }]);
  }
}