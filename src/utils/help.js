import chalk from 'chalk';

export function helpMenu(context = 'main') {
  console.log();
  console.log(chalk.cyan('═══════════════════════════════════════'));
  console.log(chalk.cyan.bold('  Canvas CLI Help'));
  console.log(chalk.cyan('═══════════════════════════════════════'));
  
  switch (context) {
    case 'main':
      displayMainHelp();
      break;
    case 'calendar':
      displayCalendarHelp();
      break;
    case 'courses':
      displayCoursesHelp();
      break;
    case 'assignments':
      displayAssignmentsHelp();
      break;
    case 'announcements':
      displayAnnouncementsHelp();
      break;
    case 'grades':
      displayGradesHelp();
      break;
    default:
      displayMainHelp();
  }
  
  console.log();
  console.log(chalk.gray('  Global Commands (available anywhere):'));
  console.log(chalk.white('    /help    - Show context-specific help'));
  console.log(chalk.white('    /back    - Go back to previous menu'));
  console.log(chalk.white('    /exit    - Return to main menu'));
  console.log(chalk.white('    Ctrl+C   - Exit the application'));
}

function displayMainHelp() {
  console.log();
  console.log(chalk.yellow('  Main Menu Commands:'));
  console.log();
  console.log(chalk.white('  📅 Calendar'));
  console.log(chalk.gray('     View your Canvas calendar events, assignments'));
  console.log(chalk.gray('     due dates, and course schedules'));
  
  console.log();
  console.log(chalk.white('  📚 Courses'));
  console.log(chalk.gray('     Browse all your enrolled courses, view course'));
  console.log(chalk.gray('     details, modules, and course-specific content'));
  
  console.log();
  console.log(chalk.white('  📝 Assignments'));
  console.log(chalk.gray('     View all assignments across courses, check'));
  console.log(chalk.gray('     due dates, submission status, and grades'));
  
  console.log();
  console.log(chalk.white('  📢 Announcements'));
  console.log(chalk.gray('     Read course announcements and important'));
  console.log(chalk.gray('     updates from your instructors'));
  
  console.log();
  console.log(chalk.white('  📊 Grades'));
  console.log(chalk.gray('     Check your grades for all courses,'));
  console.log(chalk.gray('     view grade breakdowns and statistics'));
}

function displayCalendarHelp() {
  console.log();
  console.log(chalk.yellow('  Calendar View Options:'));
  console.log();
  console.log(chalk.white('  Today\'s Events'));
  console.log(chalk.gray('     Shows all events scheduled for today'));
  
  console.log();
  console.log(chalk.white('  This Week'));
  console.log(chalk.gray('     Display events for the next 7 days'));
  
  console.log();
  console.log(chalk.white('  This Month'));
  console.log(chalk.gray('     Show all events for the current month'));
  
  console.log();
  console.log(chalk.white('  Upcoming Events'));
  console.log(chalk.gray('     List all upcoming events and deadlines'));
  
  console.log();
  console.log(chalk.white('  All Events'));
  console.log(chalk.gray('     View complete calendar with all events'));
  
  console.log();
  console.log(chalk.yellow('  Tips:'));
  console.log(chalk.gray('  • Events are color-coded by type'));
  console.log(chalk.gray('  • 📝 = Assignment, 📅 = Event, 📌 = Other'));
  console.log(chalk.gray('  • Select any event to view full details'));
}

function displayCoursesHelp() {
  console.log();
  console.log(chalk.yellow('  Courses Navigation:'));
  console.log();
  console.log(chalk.white('  Course Selection'));
  console.log(chalk.gray('     Select any course to view its details'));
  
  console.log();
  console.log(chalk.white('  Search Courses'));
  console.log(chalk.gray('     Search by course name or code'));
  
  console.log();
  console.log(chalk.yellow('  Course Actions:'));
  console.log(chalk.gray('  • View Assignments - Course-specific assignments'));
  console.log(chalk.gray('  • View Announcements - Course announcements'));
  console.log(chalk.gray('  • View Grades - Your grades for the course'));
  console.log(chalk.gray('  • View Modules - Course learning modules'));
  console.log(chalk.gray('  • View Discussions - Discussion boards'));
  console.log(chalk.gray('  • View Files - Course files and resources'));
  console.log(chalk.gray('  • View Activity - Recent course activity'));
}

function displayAssignmentsHelp() {
  console.log();
  console.log(chalk.yellow('  Assignment Filters:'));
  console.log();
  console.log(chalk.white('  All Assignments'));
  console.log(chalk.gray('     View every assignment across all courses'));
  
  console.log();
  console.log(chalk.white('  Upcoming'));
  console.log(chalk.gray('     Assignments that are due in the future'));
  
  console.log();
  console.log(chalk.white('  Missing'));
  console.log(chalk.gray('     Assignments marked as missing'));
  
  console.log();
  console.log(chalk.white('  Submitted'));
  console.log(chalk.gray('     Assignments you have already submitted'));
  
  console.log();
  console.log(chalk.white('  Graded'));
  console.log(chalk.gray('     Assignments that have been graded'));
  
  console.log();
  console.log(chalk.yellow('  Status Icons:'));
  console.log(chalk.gray('  ○ = Not started'));
  console.log(chalk.gray('  ✓ = Submitted/Graded'));
  console.log(chalk.gray('  ✗ = Missing'));
  console.log(chalk.gray('  ⚠ = Late'));
}

function displayAnnouncementsHelp() {
  console.log();
  console.log(chalk.yellow('  Announcements Overview:'));
  console.log();
  console.log(chalk.white('  Features:'));
  console.log(chalk.gray('  • View all course announcements'));
  console.log(chalk.gray('  • Announcements grouped by course'));
  console.log(chalk.gray('  • Shows posting date and author'));
  console.log(chalk.gray('  • Preview text for quick scanning'));
  
  console.log();
  console.log(chalk.white('  Actions:'));
  console.log(chalk.gray('  • Select any announcement for full text'));
  console.log(chalk.gray('  • View attached files if available'));
  console.log(chalk.gray('  • Access direct Canvas URL link'));
}

function displayGradesHelp() {
  console.log();
  console.log(chalk.yellow('  Grades Information:'));
  console.log();
  console.log(chalk.white('  Grade Types:'));
  console.log(chalk.gray('  • Current Score - Based on graded work'));
  console.log(chalk.gray('  • Final Score - Includes ungraded as zeros'));
  
  console.log();
  console.log(chalk.white('  Features:'));
  console.log(chalk.gray('  • View grades for all courses'));
  console.log(chalk.gray('  • See overall GPA calculation'));
  console.log(chalk.gray('  • Letter grade conversions'));
  console.log(chalk.gray('  • Export grades summary'));
  console.log(chalk.gray('  • View recent graded assignments'));
  
  console.log();
  console.log(chalk.yellow('  Grade Scale:'));
  console.log(chalk.gray('  A (93-100), A- (90-92), B+ (87-89)'));
  console.log(chalk.gray('  B (83-86), B- (80-82), C+ (77-79)'));
  console.log(chalk.gray('  C (73-76), C- (70-72), D+ (67-69)'));
  console.log(chalk.gray('  D (63-66), D- (60-62), F (< 60)'));
}