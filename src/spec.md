# PayTrack (revert to Version 8)

## Overview
PayTrack is a personal application for tracking monthly worked hours, payments, and calculating outstanding amounts. The app helps users manage their work records and payment history with automatic calculations. Users must authenticate with Internet Identity to access their private data.

## Progressive Web App (PWA) Features
- Fully installable as a Progressive Web App on mobile devices
- Service worker registration for offline caching and installation prompts
- PWA manifest (manifest.json) with proper configuration:
  - App name: "PayTrack" for both name and short_name
  - Display mode: standalone
  - Theme color and background color for consistent branding
  - Proper icon definitions for various device sizes using generated images
  - Start URL and scope set to "./" for proper PWA installation recognition in Chrome and Safari
- HTML head metadata includes all necessary link tags for PWA and icon usage
- HTML title tag set to "PayTrack" (not "PayTrack - Sledenje uram in plačilom")
- Meta description content set to "PayTrack" for consistency
- Comprehensive favicon implementation with multiple formats and fallbacks:
  - Primary favicon using favicon.dim_32x32.png for standard browser favicon
  - Apple touch icons using paytrack-icon.dim_192x192.png for iOS devices
  - PWA icons using paytrack-logo-transparent.dim_200x200.png for app installation
  - All favicon paths in frontend/index.html use relative "./assets/..." format for correct loading on production subpaths
  - Proper favicon caching by service worker
  - Cross-browser and mobile PWA compatibility with standard sizes (32x32, 192x192, 512x512)
- Service worker registration integrated into main app entry point without affecting backend initialization
- Service worker registered with relative URL ("./service-worker.js") and proper scope
- Installation prompts and offline functionality support

## PWA Configuration Requirements
The application must include proper PWA configuration to ensure reliable favicon loading and mobile installation:
- All favicon and apple-touch-icon links in frontend/index.html must use relative paths ("./assets/...")
- Favicon links must cover standard browser sizes (32x32, 192x192, 512x512)
- PWA manifest (frontend/public/manifest.json) must include:
  - "start_url": "./"
  - "scope": "./"
  - "name": "PayTrack"
  - "short_name": "PayTrack"
  - "icons" array with generated images: favicon.dim_32x32.png, paytrack-icon.dim_192x192.png, and paytrack-logo-transparent.dim_200x200.png with correct MIME types
- Service worker registration in main.tsx must use relative URL ("./service-worker.js")
- Favicon must load reliably when app runs under subpaths
- App must be recognized as installable PWA on mobile devices

## Authentication
- Internet Identity authentication required for all app access
- Each user's data is stored privately and separately per authenticated principal
- Simple login/logout interface displayed before main app content
- Frontend automatically detects login state and loads user-specific data
- AccessControl state and backend logic remain unaffected by PWA configuration changes

## Core Features

### User Profile Management
- User profile contains default hourly rate and default transport allowance
- Profile settings are editable and persist across sessions
- Default values are automatically applied to new monthly records but can be overridden per month
- Profile interface allows users to update their default hourly rate and transport allowance

### Monthly Work Records
Each monthly record contains:
- Month and year identification
- Total worked hours for the month
- Hourly rate (pre-filled from user profile defaults, editable)
- Transport allowance (pre-filled from user profile defaults, editable)
- Automatically calculated total amount due (hours × hourly rate + transport allowance)

### Payment Tracking
- Multiple payments per month support
- Each payment includes:
  - Payment date
  - Payment amount
  - Payment type (Bank or Cash)
- Automatic calculation of total paid amount per month
- Automatic calculation of remaining amount owed per month
- Smart payment type defaulting:
  - First payment for a month defaults to Bank transfer
  - Subsequent payments for the same month default to Cash

### Monthly Record Deletion
- Users can delete monthly records only when the remaining balance is 0 EUR
- Deletion requires confirmation dialog before proceeding
- Backend validates that remaining balance is exactly 0 before allowing deletion
- If remaining balance is not 0, deletion is rejected with appropriate error message

### User Interface Views

#### Splash Screen
- Displays PayTrack logo and app name during app loading
- Uses paytrack-logo-transparent.dim_200x200.png as app icon
- Consistent theme color applied throughout loading process
- Smooth transition to main app content

#### Monthly Overview
- List view showing all months
- Display: month/year, total amount due, total paid, remaining amount
- Quick access to month details
- Delete button for each month (only functional when remaining balance is 0 EUR)
- Confirmation dialog before deletion
- Remaining amount text displayed with increased font size and orange accent color

#### Month Detail View
- Complete breakdown of selected month
- Work information (hours, rates, calculated totals)
- List of all payments with dates, amounts, and types
- Payment totals and remaining balance
- Delete button for the month (only functional when remaining balance is 0 EUR)
- Confirmation dialog before deletion
- Remaining amount text displayed with increased font size and orange accent color

#### Profile Management View
- User profile interface with editable fields for default hourly rate and default transport allowance
- Values displayed and edited in EUR currency
- Changes persist across sessions

#### Settings View
- Configuration interface that displays and allows modification of default hourly rate and default transport allowance from user profile
- Settings section remains functional and synchronized with profile data

#### Add Payment Dialog
- Payment form with automatic payment type preselection
- Payment type dropdown preselects Bank transfer for first payment of the month
- Payment type dropdown preselects Cash for subsequent payments in the same month
- Users can override the preselected payment type if needed

## Data Storage Requirements

### Backend Data Storage
The backend must store per authenticated user:
- User profile containing default hourly rate and default transport allowance
- Monthly work records with hours, rates, and transport allowances
- Payment records with dates, amounts, and types
- All data linked to monthly records for proper organization
- Data isolation between different authenticated users

### Key Operations
- Authenticate users with Internet Identity
- Create and update user profiles with default hourly rate and default transport allowance for authenticated user
- Create and update monthly work records for authenticated user (using profile defaults for new records)
- Add, edit, and delete payments for specific months for authenticated user with smart payment type defaulting
- Delete monthly records only when remaining balance is 0 EUR for authenticated user
- Retrieve and update user profile settings for authenticated user
- Retrieve monthly summaries and detailed breakdowns for authenticated user
- Calculate totals and remaining amounts
- Manage user session state

## Technical Specifications
- Progressive Web App with full mobile installation support
- Service worker for offline caching and PWA functionality
- PWA manifest with standalone display mode and proper branding
- PWA manifest start_url and scope set to "./" for proper installation recognition in Chrome and Safari
- PWA manifest name and short_name both set to "PayTrack"
- HTML title tag set to "PayTrack" and meta description content set to "PayTrack"
- Comprehensive favicon implementation with multiple format fallbacks in frontend/index.html
- All favicon href attributes in frontend/index.html use relative "./assets/..." format for correct loading on production subpaths
- Favicon links cover standard browser sizes (32x32, 192x192, 512x512)
- PWA manifest icons include generated images with correct MIME types: favicon.dim_32x32.png, paytrack-icon.dim_192x192.png, and paytrack-logo-transparent.dim_200x200.png
- Service worker registration uses relative URL ("./service-worker.js") with proper scope
- Cross-browser and mobile PWA favicon compatibility
- Internet Identity authentication required
- Multi-user application with private data per user
- User profile data structure includes default hourly rate and transport allowance
- Exact arithmetic calculations for financial accuracy
- Fully responsive UI using Tailwind utilities (flex, grid, responsive typography/layouts) for optimal mobile device usability
- Clean, intuitive user interface focused on clarity
- All content in Slovenian language
- Currency values displayed in EUR
- Monthly record deletion with balance validation and confirmation dialogs
- Smart payment type defaulting based on existing payments for the month
- Remaining amount text styling with increased font size and orange accent color in monthly overview and month detail views
- AccessControl state and backend logic remain untouched during PWA configuration fixes
