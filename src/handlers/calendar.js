import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';

export class CalendarHandler {
  constructor(api) {
    this.api = api;
  }

  async handle() {
    const choices = [
      { name: '📅 Today\'s Events', value: 'today' },
      { name: '📆 This Week', value: 'week' },
      { name: '📆 This Month', value: 'month' },
      { name: '⏰ Upcoming Events', value: 'upcoming' },
      { name: '📋 All Events', value: 'all' },
      new inquirer.Separator(),
      { name: '← Back to Main Menu', value: 'back' }
    ];

    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'Calendar View:',
      choices
    }]);

    if (action === 'back') return;

    const spinner = ora('Loading calendar events...').start();

    try {
      let events = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      switch (action) {
        case 'today':
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          events = await this.api.getCalendarEvents(
            today.toISOString(),
            tomorrow.toISOString()
          );
          break;
        
        case 'week':
          const weekEnd = new Date(today);
          weekEnd.setDate(weekEnd.getDate() + 7);
          events = await this.api.getCalendarEvents(
            today.toISOString(),
            weekEnd.toISOString()
          );
          break;
        
        case 'month':
          const monthEnd = new Date(today);
          monthEnd.setMonth(monthEnd.getMonth() + 1);
          events = await this.api.getCalendarEvents(
            today.toISOString(),
            monthEnd.toISOString()
          );
          break;
        
        case 'upcoming':
          events = await this.api.getUpcomingEvents();
          break;
        
        case 'all':
          events = await this.api.getCalendarEvents();
          break;
      }

      spinner.stop();
      this.displayEvents(events, action);
      
      await this.promptEventDetails(events);
    } catch (error) {
      spinner.fail(chalk.red('Failed to load calendar events'));
      console.error(chalk.red(error.message));
    }
  }

  displayEvents(events, view) {
    console.log();
    console.log(chalk.cyan('═══════════════════════════════════════'));
    console.log(chalk.cyan.bold(`  Calendar - ${this.getViewTitle(view)}`));
    console.log(chalk.cyan('═══════════════════════════════════════'));
    
    if (!events || events.length === 0) {
      console.log(chalk.gray('\n  No events found for this period'));
      return;
    }

    const sortedEvents = events.sort((a, b) => {
      const dateA = new Date(a.start_at || a.all_day_date || 0);
      const dateB = new Date(b.start_at || b.all_day_date || 0);
      return dateA - dateB;
    });

    let lastDate = null;
    
    sortedEvents.forEach(event => {
      const eventDate = new Date(event.start_at || event.all_day_date);
      const dateStr = eventDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      });
      
      if (dateStr !== lastDate) {
        console.log();
        console.log(chalk.yellow.bold(`  ${dateStr}`));
        console.log(chalk.gray('  ' + '─'.repeat(35)));
        lastDate = dateStr;
      }
      
      const time = event.all_day ? 
        'All Day' : 
        eventDate.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit' 
        });
      
      const type = this.getEventType(event);
      const icon = this.getEventIcon(type);
      
      console.log(`  ${icon} ${chalk.white(time.padEnd(10))} ${chalk.cyan(event.title || 'Untitled')}`);
      
      if (event.location_name) {
        console.log(chalk.gray(`     📍 ${event.location_name}`));
      }
    });
  }

  getViewTitle(view) {
    const titles = {
      today: "Today's Events",
      week: 'This Week',
      month: 'This Month',
      upcoming: 'Upcoming Events',
      all: 'All Events'
    };
    return titles[view] || 'Events';
  }

  getEventType(event) {
    if (event.assignment) return 'assignment';
    if (event.type === 'event') return 'event';
    if (event.type === 'assignment') return 'assignment';
    return 'other';
  }

  getEventIcon(type) {
    const icons = {
      assignment: '📝',
      event: '📅',
      other: '📌'
    };
    return icons[type] || '•';
  }

  async promptEventDetails(events) {
    if (!events || events.length === 0) return;

    console.log();
    const { viewDetails } = await inquirer.prompt([{
      type: 'confirm',
      name: 'viewDetails',
      message: 'Would you like to view details for any event?',
      default: false
    }]);

    if (!viewDetails) return;

    const eventChoices = events.map((event, index) => {
      const date = new Date(event.start_at || event.all_day_date);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        name: `${dateStr} - ${event.title || 'Untitled'}`,
        value: index
      };
    });

    const { eventIndex } = await inquirer.prompt([{
      type: 'list',
      name: 'eventIndex',
      message: 'Select an event:',
      choices: eventChoices
    }]);

    const event = events[eventIndex];
    this.displayEventDetails(event);
    
    await inquirer.prompt([{
      type: 'input',
      name: 'continue',
      message: 'Press Enter to continue...'
    }]);
  }

  displayEventDetails(event) {
    console.log();
    console.log(chalk.cyan('═══════════════════════════════════════'));
    console.log(chalk.cyan.bold('  Event Details'));
    console.log(chalk.cyan('═══════════════════════════════════════'));
    
    console.log(chalk.white.bold(`\n  ${event.title || 'Untitled Event'}`));
    
    if (event.start_at) {
      const date = new Date(event.start_at);
      console.log(chalk.gray(`  Date: ${date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`));
      console.log(chalk.gray(`  Time: ${date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      })}`));
    }
    
    if (event.end_at) {
      const endDate = new Date(event.end_at);
      console.log(chalk.gray(`  End: ${endDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      })}`));
    }
    
    if (event.location_name) {
      console.log(chalk.gray(`  Location: ${event.location_name}`));
    }
    
    if (event.description) {
      console.log(chalk.gray('\n  Description:'));
      const desc = event.description.replace(/<[^>]*>/g, '').trim();
      console.log(chalk.white(`  ${desc.substring(0, 500)}${desc.length > 500 ? '...' : ''}`));
    }
    
    if (event.html_url) {
      console.log(chalk.gray(`\n  URL: ${chalk.cyan.underline(event.html_url)}`));
    }
  }
}