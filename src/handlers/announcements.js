import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';

export class AnnouncementsHandler {
  constructor(api) {
    this.api = api;
  }

  async handle() {
    const spinner = ora('Loading announcements...').start();
    
    try {
      const courses = await this.api.getCourses();
      const contextCodes = courses.map(c => `course_${c.id}`);
      const announcements = await this.api.getAnnouncements(contextCodes);
      
      spinner.stop();
      await this.displayAnnouncements(announcements);
    } catch (error) {
      spinner.fail(chalk.red('Failed to load announcements'));
      console.error(chalk.red(error.message));
    }
  }

  async displayAnnouncements(announcements) {
    console.log();
    console.log(chalk.cyan('═══════════════════════════════════════'));
    console.log(chalk.cyan.bold('  Announcements'));
    console.log(chalk.cyan('═══════════════════════════════════════'));
    
    if (!announcements || announcements.length === 0) {
      console.log(chalk.gray('\n  No announcements found'));
      await this.promptReturn();
      return;
    }

    const grouped = this.groupByCourse(announcements);
    
    for (const [contextName, courseAnnouncements] of Object.entries(grouped)) {
      console.log();
      console.log(chalk.yellow.bold(`  ${contextName}`));
      console.log(chalk.gray('  ' + '─'.repeat(40)));
      
      courseAnnouncements.slice(0, 3).forEach(announcement => {
        this.displayAnnouncementSummary(announcement);
      });
    }

    await this.promptAnnouncementDetails(announcements);
  }

  groupByCourse(announcements) {
    const grouped = {};
    
    announcements.forEach(announcement => {
      const contextName = announcement.context_name || 'Unknown Course';
      if (!grouped[contextName]) {
        grouped[contextName] = [];
      }
      grouped[contextName].push(announcement);
    });
    
    return grouped;
  }

  displayAnnouncementSummary(announcement) {
    const date = new Date(announcement.posted_at);
    const dateStr = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    
    console.log(`  📢 ${chalk.white(announcement.title)}`);
    console.log(chalk.gray(`     ${dateStr} - ${announcement.user_name || 'Unknown'}`));
    
    if (announcement.message) {
      const preview = announcement.message
        .replace(/<[^>]*>/g, '')
        .trim()
        .substring(0, 100);
      console.log(chalk.gray(`     ${preview}${preview.length >= 100 ? '...' : ''}`));
    }
  }

  async promptAnnouncementDetails(announcements) {
    console.log();
    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: 'View announcement details', value: 'view' },
        { name: 'Back to Main Menu', value: 'back' }
      ]
    }]);

    if (action === 'back') return;

    const choices = announcements.map((announcement, index) => {
      const date = new Date(announcement.posted_at).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      const course = announcement.context_name || 'Unknown';
      return {
        name: `${date} - ${course}: ${announcement.title}`,
        value: index
      };
    });

    const { index } = await inquirer.prompt([{
      type: 'list',
      name: 'index',
      message: 'Select an announcement:',
      choices,
      pageSize: 10
    }]);

    await this.displayAnnouncementDetails(announcements[index]);
    await this.handle();
  }

  async displayAnnouncementDetails(announcement) {
    console.log();
    console.log(chalk.cyan('═══════════════════════════════════════'));
    console.log(chalk.cyan.bold('  Announcement Details'));
    console.log(chalk.cyan('═══════════════════════════════════════'));
    
    console.log(chalk.white.bold(`\n  ${announcement.title}`));
    console.log(chalk.gray(`  Course: ${announcement.context_name || 'Unknown'}`));
    console.log(chalk.gray(`  Posted by: ${announcement.user_name || 'Unknown'}`));
    
    const date = new Date(announcement.posted_at);
    console.log(chalk.gray(`  Date: ${date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })}`));
    
    if (announcement.message) {
      console.log();
      console.log(chalk.yellow('  Content:'));
      const content = announcement.message
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .trim();
      
      const lines = content.split('\n').filter(line => line.trim());
      lines.forEach(line => {
        console.log(chalk.white(`  ${line}`));
      });
    }
    
    if (announcement.attachments && announcement.attachments.length > 0) {
      console.log();
      console.log(chalk.yellow('  Attachments:'));
      announcement.attachments.forEach(attachment => {
        console.log(chalk.gray(`    📎 ${attachment.display_name || attachment.filename}`));
      });
    }
    
    if (announcement.html_url) {
      console.log();
      console.log(chalk.gray(`  URL: ${chalk.cyan.underline(announcement.html_url)}`));
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