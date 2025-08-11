import axios from 'axios';
import chalk from 'chalk';
import FormData from 'form-data';

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
        allAssignments.push(...assignments.map(a => ({ ...a, course_name: course.name, course_id: course.id })));
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

  async createCalendarEvent(eventData) {
    try {
      // For personal calendar, use 'user_' prefix with user ID
      let contextCode = eventData.context_code;
      
      // If it's a personal calendar, we need to get the user ID first
      if (contextCode === 'user_self') {
        const user = await this.getCurrentUser();
        contextCode = `user_${user.id}`;
      }
      
      const requestData = {
        calendar_event: {
          context_code: contextCode,
          title: eventData.title
        }
      };
      
      // Only add optional fields if they have values
      if (eventData.description) {
        requestData.calendar_event.description = eventData.description;
      }
      if (eventData.start_at) {
        requestData.calendar_event.start_at = eventData.start_at;
      }
      if (eventData.end_at) {
        requestData.calendar_event.end_at = eventData.end_at;
      }
      if (eventData.location_name) {
        requestData.calendar_event.location_name = eventData.location_name;
      }
      if (eventData.location_address) {
        requestData.calendar_event.location_address = eventData.location_address;
      }
      if (eventData.all_day !== undefined) {
        requestData.calendar_event.all_day = eventData.all_day;
      }
      
      const { data } = await this.client.post('/calendar_events', requestData);
      return data;
    } catch (error) {
      // Provide more detailed error information
      if (error.response) {
        const errorMsg = error.response.data?.errors?.[0]?.message || 
                        error.response.data?.message || 
                        error.response.statusText;
        throw new Error(`Failed to create event: ${errorMsg} (Status: ${error.response.status})`);
      }
      throw error;
    }
  }

  async updateCalendarEvent(eventId, eventData) {
    const { data } = await this.client.put(`/calendar_events/${eventId}`, {
      calendar_event: eventData
    });
    return data;
  }

  async deleteCalendarEvent(eventId, cancelReason = '') {
    const { data } = await this.client.delete(`/calendar_events/${eventId}`, {
      data: { cancel_reason: cancelReason }
    });
    return data;
  }

  async submitAssignment(courseId, assignmentId, submission) {
    try {
      const formData = new FormData();
      
      if (submission.type === 'online_text_entry') {
        formData.append('submission[submission_type]', 'online_text_entry');
        formData.append('submission[body]', submission.body);
      } else if (submission.type === 'online_url') {
        formData.append('submission[submission_type]', 'online_url');
        formData.append('submission[url]', submission.url);
      } else if (submission.type === 'online_upload' && submission.file_ids) {
        formData.append('submission[submission_type]', 'online_upload');
        submission.file_ids.forEach(id => {
          formData.append('submission[file_ids][]', id);
        });
      }
      
      if (submission.comment) {
        formData.append('comment[text_comment]', submission.comment);
      }
      
      const { data } = await this.client.post(
        `/courses/${courseId}/assignments/${assignmentId}/submissions`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${this.token}`
          }
        }
      );
      return data;
    } catch (error) {
      if (error.response) {
        const errorMsg = error.response.data?.errors?.join(', ') || 
                        error.response.data?.message || 
                        error.response.statusText;
        throw new Error(`Failed to submit assignment: ${errorMsg} (Status: ${error.response.status})`);
      }
      throw error;
    }
  }

  async uploadFile(courseId, file) {
    try {
      // Step 1: Get upload parameters from Canvas
      const { data: uploadParams } = await this.client.post(
        `/courses/${courseId}/files`,
        {
          name: file.name,
          size: file.size,
          content_type: file.type || 'application/octet-stream',
          parent_folder_path: file.folder || '/'
        }
      );

      // Step 2: Upload the file to the provided URL
      const formData = new FormData();
      Object.keys(uploadParams.upload_params).forEach(key => {
        formData.append(key, uploadParams.upload_params[key]);
      });
      formData.append('file', file.content, file.name);

      const uploadResponse = await axios.post(uploadParams.upload_url, formData, {
        headers: formData.getHeaders()
      });

      // Step 3: Confirm the upload if needed
      if (uploadResponse.status === 201) {
        return uploadResponse.data;
      }

      if (uploadResponse.headers.location) {
        const { data: confirmedFile } = await this.client.get(
          uploadResponse.headers.location
        );
        return confirmedFile;
      }
      
      return uploadResponse.data;
    } catch (error) {
      if (error.response) {
        const errorMsg = error.response.data?.message || error.response.statusText;
        throw new Error(`Failed to upload file: ${errorMsg} (Status: ${error.response.status})`);
      }
      throw error;
    }
  }

  async createDiscussionEntry(courseId, topicId, message, parentId = null) {
    const params = {
      message
    };
    
    if (parentId) {
      params.parent_id = parentId;
    }
    
    const { data } = await this.client.post(
      `/courses/${courseId}/discussion_topics/${topicId}/entries`,
      params
    );
    return data;
  }

  async markAnnouncementRead(courseId, announcementId) {
    await this.client.put(
      `/courses/${courseId}/discussion_topics/${announcementId}/read`
    );
    return true;
  }

  async markAllAnnouncementsRead(courseId) {
    await this.client.put(`/courses/${courseId}/discussion_topics/read_all`);
    return true;
  }

  async createTodo(todoData) {
    const { data } = await this.client.post('/users/self/todo', {
      title: todoData.title,
      description: todoData.description,
      due_at: todoData.due_at,
      course_id: todoData.course_id
    });
    return data;
  }

  async updateTodo(todoId, todoData) {
    const { data } = await this.client.put(`/users/self/todo/${todoId}`, todoData);
    return data;
  }

  async deleteTodo(todoId) {
    await this.client.delete(`/users/self/todo/${todoId}`);
    return true;
  }

  async createPlannerNote(noteData) {
    const { data } = await this.client.post('/planner_notes', {
      title: noteData.title,
      details: noteData.details,
      todo_date: noteData.todo_date,
      course_id: noteData.course_id,
      linked_object_type: noteData.linked_object_type,
      linked_object_id: noteData.linked_object_id
    });
    return data;
  }

  async updatePlannerNote(noteId, noteData) {
    const { data } = await this.client.put(`/planner_notes/${noteId}`, noteData);
    return data;
  }

  async deletePlannerNote(noteId) {
    await this.client.delete(`/planner_notes/${noteId}`);
    return true;
  }

  async sendMessage(recipients, subject, body, courseId = null) {
    const params = {
      recipients,
      subject,
      body
    };
    
    if (courseId) {
      params.context_code = `course_${courseId}`;
    }
    
    const { data } = await this.client.post('/conversations', params);
    return data;
  }

  async replyToConversation(conversationId, message, attachmentIds = []) {
    const params = {
      body: message
    };
    
    if (attachmentIds.length > 0) {
      params.attachment_ids = attachmentIds;
    }
    
    const { data } = await this.client.post(
      `/conversations/${conversationId}/add_message`,
      params
    );
    return data;
  }

  async markSubmissionRead(courseId, assignmentId) {
    await this.client.put(
      `/courses/${courseId}/assignments/${assignmentId}/submissions/self/read`
    );
    return true;
  }

  async getUploadParams(courseId, fileName, fileSize) {
    const { data } = await this.client.post(`/courses/${courseId}/files`, {
      name: fileName,
      size: fileSize,
      parent_folder_path: '/'
    });
    return data;
  }
}