import axios from 'axios';
import chalk from 'chalk';

export class CanvasAPI {
  constructor(token, domain) {
    this.token = token;
    this.baseURL = `https://${domain}/api/v1`;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000
    });

    this.client.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          throw new Error('Invalid API token or unauthorized access');
        }
        if (error.response?.status === 404) {
          throw new Error('Resource not found');
        }
        if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later');
        }
        throw new Error(error.response?.data?.message || error.message);
      }
    );
  }

  async getCurrentUser() {
    const { data } = await this.client.get('/users/self');
    return data;
  }

  async getCourses(enrollment_state = 'active') {
    const { data } = await this.client.get('/courses', {
      params: {
        enrollment_state,
        include: ['term', 'teachers', 'total_scores']
      }
    });
    return data;
  }

  async getCourse(courseId) {
    const { data } = await this.client.get(`/courses/${courseId}`, {
      params: {
        include: ['syllabus_body', 'term', 'teachers']
      }
    });
    return data;
  }

  async getCalendarEvents(startDate = null, endDate = null, contextCodes = []) {
    const params = {
      all_events: true,
      context_codes: contextCodes.length ? contextCodes : undefined
    };
    
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    
    const { data } = await this.client.get('/calendar_events', { params });
    return data;
  }

  async getUpcomingEvents() {
    const { data } = await this.client.get('/users/self/upcoming_events');
    return data;
  }

  async getAssignments(courseId = null) {
    if (courseId) {
      const { data } = await this.client.get(`/courses/${courseId}/assignments`, {
        params: {
          include: ['submission', 'overrides'],
          order_by: 'due_at'
        }
      });
      return data;
    }
    
    const courses = await this.getCourses();
    const allAssignments = [];
    
    for (const course of courses) {
      try {
        const assignments = await this.getAssignments(course.id);
        allAssignments.push(...assignments.map(a => ({ ...a, course_name: course.name })));
      } catch (err) {
        console.log(chalk.yellow(`Could not fetch assignments for ${course.name}`));
      }
    }
    
    return allAssignments.sort((a, b) => {
      if (!a.due_at) return 1;
      if (!b.due_at) return -1;
      return new Date(a.due_at) - new Date(b.due_at);
    });
  }

  async getAssignment(courseId, assignmentId) {
    const { data } = await this.client.get(`/courses/${courseId}/assignments/${assignmentId}`, {
      params: {
        include: ['submission', 'overrides']
      }
    });
    return data;
  }

  async getSubmission(courseId, assignmentId) {
    const { data } = await this.client.get(
      `/courses/${courseId}/assignments/${assignmentId}/submissions/self`,
      {
        params: {
          include: ['submission_comments', 'rubric_assessment']
        }
      }
    );
    return data;
  }

  async getAnnouncements(contextCodes = []) {
    const { data } = await this.client.get('/announcements', {
      params: {
        context_codes: contextCodes.length ? contextCodes : undefined,
        active_only: true
      }
    });
    return data;
  }

  async getDiscussionTopics(courseId) {
    const { data } = await this.client.get(`/courses/${courseId}/discussion_topics`, {
      params: {
        order_by: 'recent_activity',
        include: ['all_dates', 'sections', 'user']
      }
    });
    return data;
  }

  async getGrades(courseId = null) {
    if (courseId) {
      const { data } = await this.client.get(`/courses/${courseId}/enrollments`, {
        params: {
          user_id: 'self',
          include: ['grades', 'computed_current_score', 'computed_final_score']
        }
      });
      return data[0]?.grades || {};
    }
    
    const courses = await this.getCourses();
    const allGrades = [];
    
    for (const course of courses) {
      try {
        const grades = await this.getGrades(course.id);
        if (grades) {
          allGrades.push({
            course_name: course.name,
            course_id: course.id,
            ...grades
          });
        }
      } catch (err) {
        console.log(chalk.yellow(`Could not fetch grades for ${course.name}`));
      }
    }
    
    return allGrades;
  }

  async getModules(courseId) {
    const { data } = await this.client.get(`/courses/${courseId}/modules`, {
      params: {
        include: ['items', 'content_details']
      }
    });
    return data;
  }

  async getFiles(courseId = null) {
    const endpoint = courseId ? `/courses/${courseId}/files` : '/users/self/files';
    const { data } = await this.client.get(endpoint, {
      params: {
        per_page: 50
      }
    });
    return data;
  }

  async getTodos() {
    const { data } = await this.client.get('/users/self/todo', {
      params: {
        include: ['ungraded_quizzes']
      }
    });
    return data;
  }

  async getConversations() {
    const { data } = await this.client.get('/conversations', {
      params: {
        scope: 'unread'
      }
    });
    return data;
  }

  async getCourseStream(courseId) {
    const { data } = await this.client.get(`/courses/${courseId}/activity_stream`);
    return data;
  }

  async searchCourses(query) {
    const courses = await this.getCourses();
    return courses.filter(course => 
      course.name.toLowerCase().includes(query.toLowerCase()) ||
      course.course_code.toLowerCase().includes(query.toLowerCase())
    );
  }
}