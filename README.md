
# Tire & Service CRM System

A comprehensive web-based CRM application designed specifically for tire sales and vehicle service businesses. This system helps you manage clients, track services, handle payments, and maintain detailed business records.

## 🚀 Features

### ✅ Currently Implemented
- **Client Management**: Create, edit, and manage client records with full contact information
- **Service History**: Track all services provided to each client with detailed records
- **Debt Tracking**: Monitor outstanding payments and overdue accounts
- **Professional Dashboard**: Business insights and recent activity overview
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Clean, professional interface with smooth animations
- **WhatsApp Integration**: Quick access to send messages to clients
- **Invoice Generation**: Basic invoice creation system
- **Search & Filters**: Find clients and services quickly

### 🔄 Coming Soon
- **Automated WhatsApp Notifications**: Scheduled reminders and follow-ups
- **PDF Invoice Export**: Professional invoice generation
- **Backend Database**: Full data persistence with SQLite/PostgreSQL
- **Authentication System**: Secure admin login
- **Advanced Reporting**: Detailed business analytics
- **Appointment Scheduling**: Calendar integration for service appointments

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Build Tool**: Vite
- **Icons**: Lucide React
- **State Management**: React Hooks
- **Routing**: React Router DOM

## 📦 Installation & Setup

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager

### Quick Start

1. **Clone or download the project files**
2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:8080`

## 📱 How to Use

### Dashboard
- View key business metrics and recent activity
- Monitor overdue payments and urgent actions
- Track monthly revenue and client growth

### Client Management
- Add new clients with contact information
- Search and filter client records
- View detailed client profiles
- Access WhatsApp messaging directly

### Service Tracking
- Record services provided to clients
- Track vehicle information and service details
- Monitor payment status and methods
- Filter services by status or client

### Debt Management
- View all outstanding payments
- Track overdue accounts with automatic calculations
- Send WhatsApp reminders to clients
- Monitor payment due dates

## 🎨 Customization

### Adding New Service Types
Edit the `serviceTypes` array in `src/components/ServiceForm.tsx`:
```javascript
const serviceTypes = [
  "Tire Installation",
  "Tire Repair",
  "Oil Change",
  "Your Custom Service", // Add here
  // ... more services
];
```

### Modifying Colors
The application uses Tailwind CSS. You can customize colors in `tailwind.config.ts` or by modifying the CSS classes in components.

### Adding New Fields
To add new fields to clients or services:
1. Update the interface type definitions
2. Modify the form components
3. Update the display components

## 🔧 Development

### Project Structure
```
src/
├── components/           # React components
│   ├── ClientsList.tsx  # Client management
│   ├── ServicesList.tsx # Service tracking
│   ├── DebtsList.tsx    # Debt management
│   ├── Dashboard.tsx    # Main dashboard
│   ├── ClientForm.tsx   # Add/edit clients
│   └── ServiceForm.tsx  # Add/edit services
├── pages/
│   └── Index.tsx        # Main application page
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
└── components/ui/       # UI components (shadcn/ui)
```

### Building for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 🚀 Deployment Options

### Local Deployment
The built application can run on any web server:
1. Build the project: `npm run build`
2. Serve the `dist` folder with any web server
3. For Node.js: `npx serve dist`

### VPS Deployment
1. Upload the built files to your VPS
2. Configure your web server (nginx, Apache) to serve the files
3. Set up SSL certificate for security

## 🔮 Roadmap

### Phase 1 (Current)
- ✅ Basic CRM functionality
- ✅ Client and service management
- ✅ Responsive design

### Phase 2 (In Development)
- 🔄 Backend API with Node.js/Express
- 🔄 Database integration (SQLite/PostgreSQL)
- 🔄 User authentication
- 🔄 PDF invoice generation

### Phase 3 (Planned)
- 📅 WhatsApp automation with puppeteer
- 📅 Appointment scheduling
- 📅 Advanced reporting and analytics
- 📅 Backup and export functionality

## 📞 Support

For questions, suggestions, or issues:
1. Check the existing code comments for implementation details
2. Review the component structure in the `src/components` folder
3. Test new features in development mode before deployment

## 📄 License

This project is designed for personal and commercial use in tire and automotive service businesses.

---

**Built with ❤️ for tire and automotive service professionals**
