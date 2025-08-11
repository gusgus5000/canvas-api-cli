# Canvas API CLI

An interactive command-line interface for Canvas LMS that provides easy access to your courses, assignments, grades, calendar, and more. Now with full read/write capabilities!

## Features

### 📖 Read Capabilities
- 🔐 **Secure Authentication** - Store your Canvas API token securely with encryption
- 📅 **Calendar View** - View events, assignments, and deadlines in various time ranges
- 📚 **Course Management** - Browse courses, view modules, discussions, and files
- 📝 **Assignment Tracking** - Track upcoming, missing, submitted, and graded assignments
- 📢 **Announcements** - Read course announcements and updates
- 📊 **Grade Checking** - View grades across all courses with GPA calculation

### ✏️ Write Capabilities (NEW!)
- 📅 **Calendar Management** - Create, edit, and delete calendar events
- 📤 **Assignment Submission** - Submit assignments with text, URLs, or file uploads
- 📎 **File Upload** - Upload files directly to Canvas courses
- ✅ **Mark as Read** - Mark announcements as read individually or in bulk
- 💬 **Discussions** - Post to discussion boards (coming soon)
- 📋 **Todo Management** - Create and manage personal tasks (coming soon)

### 🎨 User Experience
- 🎨 **Beautiful UI** - Color-coded, interactive interface with intuitive navigation
- ❓ **Context Help** - Built-in help system with context-aware commands
- 🔄 **Real-time Updates** - See changes immediately after making modifications

## Installation

1. Clone this repository:
```bash
git clone https://github.com/gusgus5000/canvas-api-cli.git
cd canvas-api-cli
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your Canvas domain and API token
```

## Getting Your Canvas API Token

1. Log into your Canvas account
2. Go to **Account** → **Settings**
3. Scroll down to **Approved Integrations**
4. Click **"+ New Access Token"**
5. Enter a purpose (e.g., "CLI Access") and click **"Generate Token"**
6. **Important**: Copy the token immediately - you won't see it again!

## Usage

### Starting the CLI

```bash
npm start
# or
node src/index.js
```

### First-Time Setup

When you first run the CLI, you'll be prompted to:
1. Enter your Canvas domain (e.g., `canvas.instructure.com`)
2. Enter your Canvas API token
3. Choose whether to save credentials for future use

### Main Menu Options

- **📅 Calendar** - View and manage events
  - View: Today's Events, This Week, This Month, Upcoming, All Events
  - ➕ Create new events (personal or course-specific)
  - ✏️ Edit existing events
  - 🗑️ Delete events

- **📚 Courses** - Browse and explore courses
  - View course details
  - Access assignments, announcements, grades
  - Browse modules, discussions, files
  - View activity stream

- **📝 Assignments** - Manage and submit assignments
  - Filter by: All, Upcoming, Missing, Submitted, Graded
  - 📤 **Submit assignments** with:
    - Text entry
    - Website URLs
    - File uploads (supports all common file types)
  - View assignment details and submission status
  - Check grades and feedback

- **📢 Announcements** - Read and manage announcements
  - Grouped by course
  - Full text view with attachments
  - ✅ Mark individual announcements as read
  - ✅ Mark all announcements as read

- **📊 Grades** - Check your academic performance
  - Course-by-course breakdown
  - Overall GPA calculation
  - Export grade summary

### Global Commands

Available anywhere in the application:
- `/help` - Show context-specific help
- `/back` - Go back to previous menu
- `/exit` - Return to main menu
- `Ctrl+C` - Exit the application

## Security

- API tokens are encrypted before storage
- Credentials are stored in `~/.canvas-cli/credentials.json`
- File permissions are set to user-only access (600)
- You can clear saved credentials from the main menu

## Project Structure

```
canvas-api-cli/
├── src/
│   ├── index.js           # Main CLI entry point
│   ├── api/
│   │   └── canvas.js      # Canvas API client
│   ├── handlers/
│   │   ├── calendar.js    # Calendar handler
│   │   ├── courses.js     # Courses handler
│   │   ├── assignments.js # Assignments handler
│   │   ├── announcements.js # Announcements handler
│   │   └── grades.js      # Grades handler
│   └── utils/
│       ├── help.js        # Help system
│       ├── tokenManager.js # Token encryption/storage
│       └── fileUpload.js  # File upload utilities
├── .env.example           # Environment variables template
├── package.json           # Project dependencies
└── README.md             # This file
```

## Environment Variables

You can customize behavior using environment variables in `.env`:

- `CANVAS_DOMAIN` - Your Canvas instance domain
- `CANVAS_API_TOKEN` - Your API token (alternative to interactive auth)
- `DEFAULT_CALENDAR_VIEW` - Default calendar view (today/week/month/upcoming/all)
- `DEFAULT_ASSIGNMENT_FILTER` - Default assignment filter
- `API_TIMEOUT` - API request timeout in milliseconds

## New Features in v2.0

### 📤 Assignment Submission
- Submit text entries directly from the CLI
- Submit website URLs for online assignments
- Upload files with automatic MIME type detection
- Add comments to submissions
- Support for all common file formats (PDF, Word, images, code files, etc.)

### 📅 Calendar Event Management
- Create personal or course-specific events
- Set all-day or time-specific events
- Edit event titles, descriptions, and locations
- Delete events with optional cancellation reasons
- Full control over your Canvas calendar

### 📎 File Upload System
- Smart file upload with progress indicators
- Automatic file type detection
- Batch file uploads
- File size validation
- Support for 50+ file types

### ✅ Announcement Management
- Mark individual announcements as read
- Bulk mark all announcements as read
- Visual indicators for unread announcements
- Organized by course

## Troubleshooting

### Authentication Failed
- Verify your API token is correct
- Check your Canvas domain (don't include https://)
- Ensure your token has necessary permissions

### Rate Limiting
- Canvas API has rate limits
- The CLI will show an error if you exceed them
- Wait a few minutes before trying again

### No Data Showing
- Ensure you're enrolled in active courses
- Check that your account has proper permissions
- Some institutions may restrict API access

### File Upload Issues
- Check file size (max 500MB by default)
- Ensure file path is correct
- Verify you have read permissions for the file
- Check course upload permissions

## Development

### Running in Development Mode
```bash
npm run dev
```

### Adding New Features

1. Create a new handler in `src/handlers/`
2. Add API methods in `src/api/canvas.js`
3. Register the handler in `src/index.js`
4. Update help documentation in `src/utils/help.js`

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues or questions, please open an issue on the repository.