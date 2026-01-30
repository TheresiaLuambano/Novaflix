# BurudaniKiganjani Frontend

A modern, responsive streaming platform frontend built with vanilla JavaScript, HTML5, and CSS3. This frontend integrates with the BurudaniKiganjani PHP backend API to provide a Netflix-like streaming experience.

## Features

### Core Features
- **Home Page** - Featured content, trending, popular movies & series
- **Browse Page** - Filter and search content by type, genre, and sort
- **Watch Page** - Video player with playback controls, episodes, ratings, and comments
- **Search** - Real-time search with filters and suggestions
- **My List** - Save and manage favorite content

### Authentication
- **Login** - User authentication with email/password
- **Register** - New user registration with validation
- **Session Management** - JWT-based authentication

### User Features
- Profile management
- Watch history
- Progress tracking
- Ratings & reviews
- Comments system

## Project Structure

```
frontend/
├── index.html          # Home page
├── browse.html         # Browse content
├── watch.html          # Video player & content details
├── search.html         # Search page
├── login.html          # Login page
├── register.html       # Registration page
├── my-list.html        # User's saved content
└── assets/
    ├── css/
    │   ├── style.css       # Main styles
    │   ├── responsive.css  # Responsive breakpoints
    │   ├── components.css  # Reusable UI components
    │   ├── auth.css        # Auth page styles
    │   ├── browse.css      # Browse page styles
    │   ├── watch.css       # Watch page styles
    │   └── search.css      # Search page styles
    ├── js/
    │   ├── api.js          # API client
    │   ├── auth.js         # Authentication manager
    │   ├── app.js          # Main application
    │   ├── components.js   # UI components
    │   ├── browse.js       # Browse page logic
    │   ├── watch.js        # Watch page logic
    │   ├── login.js        # Login logic
    │   ├── register.js     # Registration logic
    │   ├── mylist.js       # My List page logic
    │   ├── search.js       # Search module
    │   └── search-page.js  # Search page logic
    └── images/
        └── default-avatar.png
```

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (XAMPP, WAMP, MAMP, or PHP built-in server)
- BurudaniKiganjani backend API running

### Installation

1. **Start the backend server**
   ```bash
   cd /opt/lampp/htdocs/BurudaniKiganjani
   php -S localhost:8000
   ```

2. **Open the frontend**
   Open your browser and navigate to:
   ```
   http://localhost:8000/frontend/index.html
   ```

   Or use the XAMPP server:
   ```
   http://localhost/BurudaniKiganjani/frontend/index.html
   ```

### Demo Mode
The frontend includes demo content that loads when the API is not available. This allows you to explore the UI even without a running backend.

## Pages Overview

### Home Page (`index.html`)
- Hero section with featured content
- Content rows: Trending, Featured, Movies, Series
- Genre browsing cards
- Continue watching (when logged in)
- My List preview (when logged in)

### Browse Page (`browse.html`)
- Filter by type (All, Movies, TV Series)
- Filter by genre
- Sort options (Popularity, Newest, Rating, Title)
- Grid view with pagination

### Watch Page (`watch.html`)
- Video player with custom controls
- Content details and metadata
- Episode list (for series)
- Ratings and reviews
- Comments section
- Related content

### Search Page (`search.html`)
- Real-time search with debounce
- Type and genre filters
- Sort options
- List view results

### My List Page (`my-list.html`)
- View saved favorites and watch later
- Filter by Movies/Series
- Quick remove from list
- Continue watching indicator

### Auth Pages
- **Login** (`login.html`) - User sign in
- **Register** (`register.html`) - New account creation

## API Integration

The frontend expects the backend API to be available at:
```
/BurudaniKiganjani/api/
```

### Key API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login.php` | POST | User login |
| `/auth/register.php` | POST | User registration |
| `/content/list.php` | GET | List all content |
| `/content/detail.php` | GET | Content details |
| `/content/search.php` | GET | Search content |
| `/content/featured.php` | GET | Featured content |
| `/content/trending.php` | GET | Trending content |
| `/content/byGenre.php` | GET | Content by genre |
| `/content/byType.php` | GET | Content by type |
| `/episodes/list.php` | GET | List episodes |
| `/favorites/list.php` | GET | User favorites |
| `/favorites/add.php` | POST | Add to favorites |
| `/favorites/remove.php` | DELETE | Remove from favorites |
| `/ratings/rate.php` | POST | Rate content |
| `/ratings/content.php` | GET | Content ratings |
| `/comments/list.php` | GET | Get comments |
| `/comments/create.php` | POST | Create comment |

## Customization

### Theming
Edit CSS variables in `assets/css/style.css`:

```css
:root {
    --primary-color: #e50914;
    --background-dark: #141414;
    --text-primary: #ffffff;
    /* ... more variables */
}
```

### Adding New Pages
1. Create HTML file in `frontend/`
2. Link required CSS and JS files
3. Create page-specific JS if needed

## Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Technologies Used
- **HTML5** - Semantic markup
- **CSS3** - Styling with CSS Variables
- **JavaScript (ES6+)** - Modern JavaScript
- **Font Awesome** - Icons
- **Google Fonts** - Typography (Inter font)

## License
This project is part of the BurudaniKiganjani streaming platform.

