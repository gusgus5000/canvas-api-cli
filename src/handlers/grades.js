import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';

export class GradesHandler {
  constructor(api) {
    this.api = api;
  }

  async handle() {
    const spinner = ora('Loading grades...').start();
    
    try {
      const grades = await this.api.getGrades();
      spinner.stop();
      await this.displayGrades(grades);
    } catch (error) {
      spinner.fail(chalk.red('Failed to load grades'));
      console.error(chalk.red(error.message));
    }
  }

  async displayGrades(grades) {
    console.log();
    console.log(chalk.cyan('═══════════════════════════════════════'));
    console.log(chalk.cyan.bold('  Your Grades'));
    console.log(chalk.cyan('═══════════════════════════════════════'));
    
    if (!grades || grades.length === 0) {
      console.log(chalk.gray('\n  No grades found'));
      await this.promptReturn();
      return;
    }

    let totalCurrentScore = 0;
    let totalCurrentWeight = 0;
    let totalFinalScore = 0;
    let totalFinalWeight = 0;
    
    grades.forEach(courseGrade => {
      console.log();
      console.log(chalk.yellow.bold(`  ${courseGrade.course_name}`));
      console.log(chalk.gray('  ' + '─'.repeat(40)));
      
      const details = [];
      
      if (courseGrade.current_score) {
        const grade = this.getLetterGrade(courseGrade.current_score);
        details.push(chalk.green(`Current: ${courseGrade.current_score}% (${grade})`));
        totalCurrentScore += parseFloat(courseGrade.current_score);
        totalCurrentWeight++;
      }
      
      if (courseGrade.final_score) {
        const grade = this.getLetterGrade(courseGrade.final_score);
        details.push(chalk.yellow(`Final: ${courseGrade.final_score}% (${grade})`));
        totalFinalScore += parseFloat(courseGrade.final_score);
        totalFinalWeight++;
      }
      
      if (details.length > 0) {
        console.log(`  ${details.join(' | ')}`));
      } else {
        console.log(chalk.gray('  No grade data available'));
      }
      
      if (courseGrade.current_grade || courseGrade.final_grade) {
        const grades = [];
        if (courseGrade.current_grade) grades.push(`Current: ${courseGrade.current_grade}`);
        if (courseGrade.final_grade) grades.push(`Final: ${courseGrade.final_grade}`);
        console.log(chalk.gray(`  Letter Grade: ${grades.join(' | ')}`));
      }
    });

    if (totalCurrentWeight > 0 || totalFinalWeight > 0) {
      console.log();
      console.log(chalk.cyan('  ───────────────────────────────────────'));
      console.log(chalk.cyan.bold('  Overall Summary'));
      console.log(chalk.cyan('  ───────────────────────────────────────'));
      
      if (totalCurrentWeight > 0) {
        const avgCurrent = (totalCurrentScore / totalCurrentWeight).toFixed(2);
        const letterGrade = this.getLetterGrade(avgCurrent);
        console.log(chalk.green(`  Average Current Score: ${avgCurrent}% (${letterGrade})`));
      }
      
      if (totalFinalWeight > 0) {
        const avgFinal = (totalFinalScore / totalFinalWeight).toFixed(2);
        const letterGrade = this.getLetterGrade(avgFinal);
        console.log(chalk.yellow(`  Average Final Score: ${avgFinal}% (${letterGrade})`));
      }
      
      console.log(chalk.gray(`  Courses with grades: ${grades.length}`));
    }

    await this.promptGradeDetails(grades);
  }

  getLetterGrade(percentage) {
    const score = parseFloat(percentage);
    if (score >= 93) return 'A';
    if (score >= 90) return 'A-';
    if (score >= 87) return 'B+';
    if (score >= 83) return 'B';
    if (score >= 80) return 'B-';
    if (score >= 77) return 'C+';
    if (score >= 73) return 'C';
    if (score >= 70) return 'C-';
    if (score >= 67) return 'D+';
    if (score >= 63) return 'D';
    if (score >= 60) return 'D-';
    return 'F';
  }

  async promptGradeDetails(grades) {
    console.log();
    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: 'View course grade details', value: 'details' },
        { name: 'Export grades summary', value: 'export' },
        { name: 'Back to Main Menu', value: 'back' }
      ]
    }]);

    if (action === 'back') return;

    if (action === 'export') {
      await this.exportGrades(grades);
      return;
    }

    const choices = grades.map((grade, index) => ({
      name: `${grade.course_name} - Current: ${grade.current_score || 'N/A'}%`,
      value: index
    }));

    const { index } = await inquirer.prompt([{
      type: 'list',
      name: 'index',
      message: 'Select a course:',
      choices
    }]);

    await this.displayCourseGradeDetails(grades[index]);
    await this.handle();
  }

  async displayCourseGradeDetails(courseGrade) {
    console.log();
    console.log(chalk.cyan('═══════════════════════════════════════'));
    console.log(chalk.cyan.bold('  Course Grade Details'));
    console.log(chalk.cyan('═══════════════════════════════════════'));
    
    console.log(chalk.white.bold(`\n  ${courseGrade.course_name}`));
    console.log(chalk.gray(`  Course ID: ${courseGrade.course_id}`));
    
    console.log();
    console.log(chalk.yellow('  Grade Breakdown:'));
    
    if (courseGrade.current_score !== null && courseGrade.current_score !== undefined) {
      console.log(chalk.green(`    Current Score: ${courseGrade.current_score}%`));
    }
    
    if (courseGrade.current_grade) {
      console.log(chalk.green(`    Current Grade: ${courseGrade.current_grade}`));
    }
    
    if (courseGrade.final_score !== null && courseGrade.final_score !== undefined) {
      console.log(chalk.yellow(`    Final Score: ${courseGrade.final_score}%`));
    }
    
    if (courseGrade.final_grade) {
      console.log(chalk.yellow(`    Final Grade: ${courseGrade.final_grade}`));
    }
    
    console.log();
    console.log(chalk.gray('  Note: Current scores are based on graded assignments only.'));
    console.log(chalk.gray('  Final scores include ungraded assignments as zeros.'));
    
    const spinner = ora('Loading assignment grades...').start();
    
    try {
      const assignments = await this.api.getAssignments(courseGrade.course_id);
      spinner.stop();
      
      const graded = assignments.filter(a => 
        a.submission && 
        a.submission.score !== null && 
        a.submission.score !== undefined
      );
      
      if (graded.length > 0) {
        console.log();
        console.log(chalk.yellow('  Recent Graded Assignments:'));
        
        graded.slice(0, 5).forEach(assignment => {
          const score = assignment.submission.score;
          const possible = assignment.points_possible;
          const percentage = possible > 0 ? ((score / possible) * 100).toFixed(1) : 'N/A';
          const letterGrade = this.getLetterGrade(percentage);
          
          console.log(`    📝 ${assignment.name}`);
          console.log(chalk.gray(`       Score: ${score}/${possible} (${percentage}% - ${letterGrade})`));
        });
      }
    } catch (error) {
      spinner.fail('Could not load assignment details');
    }
    
    await this.promptReturn();
  }

  async exportGrades(grades) {
    console.log();
    console.log(chalk.yellow('  Grades Summary Export'));
    console.log(chalk.gray('  ' + '═'.repeat(40)));
    
    grades.forEach(grade => {
      console.log(`\n  Course: ${grade.course_name}`);
      if (grade.current_score) {
        console.log(`  Current Score: ${grade.current_score}% (${grade.current_grade || this.getLetterGrade(grade.current_score)})`);
      }
      if (grade.final_score) {
        console.log(`  Final Score: ${grade.final_score}% (${grade.final_grade || this.getLetterGrade(grade.final_score)})`);
      }
    });
    
    console.log();
    console.log(chalk.gray('  ' + '═'.repeat(40)));
    console.log(chalk.green('  ✓ Grades summary displayed above'));
    console.log(chalk.gray('  You can copy this information as needed'));
    
    await this.promptReturn();
    await this.handle();
  }

  async promptReturn() {
    await inquirer.prompt([{
      type: 'input',
      name: 'continue',
      message: 'Press Enter to continue...'
    }]);
  }
}