# replit.md

## Overview

This is a comprehensive RNDC (National Register of Cargo Transportation) management system built for Colombian logistics companies. The system provides complete functionality for managing cargo manifests, shipments, and compliance with Colombian transportation regulations through integration with the MINTRANSPORTE RNDC SOAP API.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state
- **UI Components**: Radix UI primitives with Tailwind CSS and shadcn/ui
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js 20 with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Passport.js with local strategy and session management
- **File Processing**: Multer for file uploads, XLSX for Excel processing
- **External API**: Custom SOAP client for RNDC integration

### Database Architecture
- **Primary Database**: PostgreSQL (via Drizzle ORM)
- **Session Storage**: PostgreSQL-backed session store
- **Schema Management**: Drizzle Kit for migrations and schema management

## Key Components

### Core Modules

1. **RNDC Integration Service** (`server/soap-proxy.ts`)
   - Handles SOAP requests to MINTRANSPORTE endpoints
   - Implements failover between primary and backup endpoints
   - Manages XML request/response processing
   - Provides error handling and timeout management

2. **XML Generation Service** (`server/xml-generator.ts`)
   - Generates RNDC-compliant XML for shipments, manifests, and compliance
   - Handles data mapping from internal format to RNDC XML schema
   - Validates required fields and formats

3. **Excel Processing Service** (`server/excel-processor.ts`)
   - Processes CSV/Excel files for bulk operations
   - Maps spreadsheet data to database entities
   - Provides validation and error reporting

4. **Database Storage Layer** (`server/db-storage.ts`)
   - Implements repository pattern for data access
   - Provides type-safe database operations
   - Handles complex queries and transactions

### Business Logic Components

1. **Shipment Management** (Remesas)
   - Create shipments from Excel imports
   - Generate RNDC XML and submit to government API
   - Track shipment status and responses

2. **Manifest Management** (Manifiestos)
   - Generate cargo manifests from successful shipments
   - Handle manifest approval and rejection flows
   - Generate PDF documents and QR codes

3. **Compliance Management** (Cumplimiento)
   - Submit compliance reports for completed shipments
   - Track delivery confirmations and timestamps
   - Generate compliance certificates

4. **Master Data Management**
   - Vehicle registration and capacity tracking
   - Third-party vendor and driver management
   - Location and route management

## Data Flow

### Shipment Creation Flow
1. User uploads Excel file with shipment data
2. System validates data against master tables (vehicles, locations, vendors)
3. XML is generated using RNDC schema
4. SOAP request is sent to MINTRANSPORTE API
5. Response is parsed and stored in database
6. User receives confirmation with tracking number

### Manifest Generation Flow
1. System queries successful shipments
2. Manifest XML is generated with shipment details
3. Request is sent to RNDC for manifest approval
4. Approved manifests generate PDF with QR codes
5. Manifest is ready for printing and transportation

### Compliance Reporting Flow
1. User selects completed shipments
2. Compliance data is entered (arrival times, quantities delivered)
3. Compliance XML is generated and submitted
4. RNDC confirms compliance acceptance
5. System updates shipment status to completed

## External Dependencies

### Government APIs
- **MINTRANSPORTE RNDC SOAP API**: Primary integration for all transportation documents
- **Primary Endpoint**: `http://rndcws.mintransporte.gov.co:8080/ws`
- **Backup Endpoint**: `http://rndcws2.mintransporte.gov.co:8080/ws`

### Third-Party Libraries
- **@radix-ui/***: Accessible UI component primitives
- **@tanstack/react-query**: Server state management and caching
- **drizzle-orm**: Type-safe database toolkit
- **xlsx**: Excel file processing
- **wouter**: Lightweight React router
- **tailwindcss**: Utility-first CSS framework

### Development Tools
- **tsx**: TypeScript execution for development
- **vite**: Fast build tool and development server
- **esbuild**: JavaScript bundler for production builds
- **drizzle-kit**: Database schema management and migrations

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js 20 with tsx for TypeScript execution
- **Database**: PostgreSQL connection via DATABASE_URL environment variable
- **Port**: Application serves on port 5000
- **Hot Reloading**: Vite handles frontend hot module replacement

### Production Environment
- **Build Process**: Vite builds frontend, esbuild bundles backend
- **Static Assets**: Frontend built to `dist/public`
- **Server Bundle**: Backend compiled to `dist/index.js`
- **Database**: PostgreSQL with connection pooling
- **Session Storage**: PostgreSQL-backed session management

### Configuration Management
- **Environment Variables**: DATABASE_URL, SESSION_SECRET, NODE_ENV
- **RNDC Credentials**: Stored in database configuration table
- **File Storage**: Temporary file processing in memory (Multer)

### Ubuntu Deployment
- **Target OS**: Ubuntu 22.04 LTS
- **Services**: systemd service configuration
- **Reverse Proxy**: Nginx configuration for production serving
- **Database**: PostgreSQL 14+ with proper user permissions
- **Firewall**: UFW configured for ports 22, 80, 443, 5000

## Changelog

```
Changelog:
- June 30, 2025: Initial setup
- June 30, 2025: VM deployment scripts created for Ubuntu 22.04
- June 30, 2025: IP updated to 192.168.2.139, base installation verified
- June 30, 2025: RNDC complete deployment script created (deploy-rndc-final.sh)
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```