# UWA Motorsport Engineering Wiki

A scalable Confluence-style internal engineering wiki designed for the UWA Motorsport team. This application provides a collaborative platform for documenting engineering processes, sharing knowledge, and managing team resources across different subteams.

## 🏎️ Features

### 📚 Knowledge Management
- **Organized Content Structure**: Pages organized by engineering subteams (Aerodynamics, Chassis, Electrical, Powertrain, Vehicle Dynamics, Business, Management)
- **Rich Text Editing**: Create and edit pages with markdown-style formatting
- **File Uploads**: Support for images and documents (PDF, DOCX, TXT) with automatic organization
- **Revision History**: Track changes with full revision history and restore capabilities
- **Real-time Search**: Fast, intelligent search across all content with result highlighting

### 👥 User Management & Permissions
- **Role-Based Access Control**: Three user roles with different permission levels
  - **Guest**: Read-only access to overview and learning pages
  - **Member**: Full access to their subteam pages + read access to others
  - **Manager**: Full access to all content and administrative functions
- **Secure Authentication**: Session-based authentication with bcrypt password hashing
- **Subteam Organization**: Members assigned to specific engineering subteams

### 💬 Collaboration Features
- **Comments System**: Page-level comments for discussions and feedback
- **Auto-save**: Automatic draft saving while editing to prevent data loss
- **Activity Tracking**: Track page updates and user activity

### 🎨 Modern Interface
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Intuitive Navigation**: Collapsible sidebar with clear section organization
- **Modern UI**: Clean, professional design with smooth animations
- **Dark/Light Theme**: Adaptive interface design

## 🚀 Quick Start

### Prerequisites
- Node.js (v16.0.0 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd uwa-motorsport-wiki
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   # Development mode (with auto-restart)
   npm run dev
   
   # Production mode
   npm start
   ```

4. **Access the application**
   - Open your browser and navigate to `http://localhost:3000`
   - The database and upload directories will be created automatically

## 🔐 Demo Accounts

The application comes with three pre-configured demo accounts for testing:

| Username | Password | Role | Subteam | Access Level |
|----------|----------|------|---------|--------------|
| `guest` | `guest123` | Guest | - | Read-only access to overview and learning pages |
| `member` | `member123` | Member | Aerodynamics | Full access to Aero pages, read access to others |
| `manager` | `manager123` | Manager | - | Full access to all content and features |

## 📁 Project Structure

```
uwa-motorsport-wiki/
├── public/                 # Static assets and client-side code
│   ├── css/               # Stylesheets
│   │   ├── styles.css     # Main application styles
│   │   ├── auth.css       # Authentication modal styles
│   │   ├── editor.css     # Rich text editor styles
│   │   └── search.css     # Search functionality styles
│   ├── js/                # Client-side JavaScript modules
│   │   ├── app.js         # Main application initialization
│   │   ├── auth.js        # Authentication handling
│   │   ├── wiki.js        # Wiki functionality and navigation
│   │   ├── editor.js      # Rich text editing and revisions
│   │   ├── search.js      # Real-time search functionality
│   │   └── uploads.js     # File upload handling
│   └── index.html         # Main application interface
├── uploads/               # File storage (auto-created)
│   ├── images/           # Uploaded images
│   └── documents/        # Uploaded documents
├── server.js              # Express.js server and API endpoints
├── package.json           # Node.js dependencies and scripts
├── wiki.db               # SQLite database (auto-created)
└── README.md             # This file
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory for custom configuration:

```env
PORT=3000
SESSION_SECRET=your-custom-session-secret
NODE_ENV=production
```

### Database
The application uses SQLite for simplicity and portability. The database file (`wiki.db`) is automatically created on first run with the following tables:
- `users` - User accounts and roles
- `pages` - Wiki page content
- `page_revisions` - Revision history
- `uploads` - File upload metadata
- `comments` - Page comments

## 🛠️ Development

### Available Scripts
- `npm start` - Start the production server
- `npm run dev` - Start development server with auto-restart
- `npm test` - Run tests (placeholder)

### Adding New Features
The application is built with a modular architecture:

1. **Client-side modules** (`/public/js/`) - Handle different aspects of the UI
2. **Server-side API** (`server.js`) - RESTful API endpoints
3. **Database schema** - Easily extendable SQLite database

### Code Style
- ES6+ JavaScript with modern async/await patterns
- Modular CSS with BEM-style naming
- RESTful API design with proper HTTP status codes
- Comprehensive error handling and user feedback

## 🔒 Security Features

- **Input Sanitization**: All user inputs are sanitized and validated
- **SQL Injection Prevention**: Parameterized queries throughout
- **Session Security**: Secure session handling with httpOnly cookies
- **File Upload Validation**: Strict file type and size validation
- **Rate Limiting**: API rate limiting to prevent abuse
- **Content Security Policy**: CSP headers for XSS prevention

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

This wiki is designed specifically for the UWA Motorsport team, but the codebase can be adapted for other engineering teams or organizations.

### Development Guidelines
1. Follow the existing code style and structure
2. Add appropriate error handling and user feedback
3. Test with different user roles and permissions
4. Ensure mobile responsiveness for new features
5. Document any new API endpoints or major features

## 📄 License

MIT License - See LICENSE file for details.

## 🆘 Support

For technical issues or feature requests, please:
1. Check the existing documentation
2. Test with demo accounts to isolate permission issues
3. Check browser console for JavaScript errors
4. Verify server logs for API errors

## 🎯 Roadmap

Future enhancements being considered:
- [ ] Real-time collaborative editing
- [ ] Advanced file management with folders
- [ ] Integration with external tools (CAD viewers, etc.)
- [ ] Mobile app for iOS/Android
- [ ] Advanced analytics and reporting
- [ ] LDAP/SSO integration
- [ ] Export functionality (PDF, etc.)
- [ ] Advanced notification system

---

**Built for UWA Motorsport Team** 🏁  
*Empowering engineering excellence through collaborative knowledge sharing*