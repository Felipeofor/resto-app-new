# Setup and Testing Guide

## Installation

The project is already configured with Next.js 16, React 19, and Tailwind CSS. All dependencies are in `package.json`.

### Install Dependencies
```bash
npm install
```

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Integration (Optional - app will work with either or both)
GEMINI_API_KEY=your_gemini_api_key  # Primary AI provider (free tier)
ANTHROPIC_API_KEY=your_anthropic_api_key  # Fallback provider

# Email Service (Optional - for welcome emails)
RESEND_API_KEY=your_resend_api_key
```

## Running the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Testing the Features

### Public Menu View

1. **View Menu Page**
   - Navigate to: `http://localhost:3000/menu/el-buen-comer`
   - See the restaurant header with logo and cover image
   - Email gate will appear (localStorage check bypassed on first visit)

2. **Email Gate**
   - Enter an email address
   - Click "Continuar" or "Ingresar con Google"
   - Email is stored in localStorage
   - Page displays mock menu after submission

3. **List View**
   - Click the "Lista" button to switch to list view
   - Search for items using the search bar
   - Click category tabs to filter
   - Each item shows: name, description, thumbnail, and price

4. **Photo Grid View**
   - Click the "Galería" button to switch to grid view
   - Items display as large cards with appetizing images
   - Hover over items to see overlay effects
   - Click any item to open lightbox

5. **Lightbox/Image Viewer**
   - Click an item image to open fullscreen
   - Use arrow buttons or keyboard arrows to navigate
   - Press ESC or click X to close
   - View item details (name, description, price) below image

### API Endpoints

#### Menu Fetch API
```bash
curl http://localhost:3000/api/menu/el-buen-comer
```
Returns:
```json
{
  "restaurant": { ... },
  "categories": [ ... ],
  "items": [ ... ]
}
```

#### Email Registration API
```bash
curl -X POST http://localhost:3000/api/register-email \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": "rest-001",
    "email": "customer@example.com",
    "registeredVia": "manual"
  }'
```

#### AI Menu Parsing API
```bash
curl -X POST http://localhost:3000/api/ai/parse-menu \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": "rest-001",
    "images": ["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA..."]
  }'
```

Returns:
```json
{
  "items": [
    {
      "category": "Entrantes",
      "name": "Tabla de Quesos",
      "description": "Selección de quesos ibéricos",
      "price": 18.5
    }
  ],
  "aiProvider": "gemini",
  "itemsCount": 1
}
```

### Dashboard AI Capture

1. **Access AI Capture Page**
   - Navigate to: `http://localhost:3000/dashboard/menu/ai-capture`
   - See usage statistics for current month

2. **Upload Images**
   - Drag and drop menu photos onto the drop zone
   - Or click to open file browser
   - Up to 10 images per batch

3. **Process with AI**
   - Click "Procesar con IA" button
   - Watch loading state with spinner
   - See parsed results

4. **Edit Results**
   - Modify category, name, description, price
   - Remove individual items
   - Preview before saving

5. **Save Items**
   - Click "Guardar Todo" to save all items
   - See success/error message
   - Usage count updates

## Key Implementation Details

### Mock Data
All data is currently mocked with TODO comments for Supabase integration:
- Restaurant: "El Buen Comer"
- 3 Categories: Entrantes, Platos Principales, Postres
- 6 Sample menu items with descriptions and prices
- Placeholder images from placehold.co

### Component Structure

**Public Menu Components**:
- `page.tsx`: Server component, handles routing and meta data
- `EmailGate.tsx`: Email collection with localStorage
- `MenuContent.tsx`: View switcher and layout
- `ListView.tsx`: List display with search
- `PhotoGridView.tsx`: Grid display with lightbox
- `Lightbox.tsx`: Fullscreen image viewer

**API Routes**:
- `/api/menu/[slug]`: Fetch menu data
- `/api/register-email`: Register customer email
- `/api/ai/parse-menu`: Parse menu images with AI

**Dashboard**:
- `ai-capture/page.tsx`: AI photo upload and processing interface

### AI Processing Flow

1. **User uploads images**
2. **POST to /api/ai/parse-menu**
3. **Gemini API attempted** (if key configured)
   - Success: Return results
   - Failure/Quota: Fall through
4. **Claude API fallback** (always configured)
5. **Return JSON with parsed items**

### Usage Limits
- Free Plan: 30 photos/month
- Pro Plan: 100 photos/month
- Tracked in `ai_usage` table (TODO: Supabase integration)

## Styling Notes

### Colors Used
- Orange: `#EA580C` (Primary buttons, active states)
- Amber-50: `#FEF3C7` (Background)
- Gray-900: `#111827` (Text)
- Browns: Various shades for appetizing imagery

### Responsive Design
- Mobile-first approach
- Tailwind breakpoints:
  - `sm`: 640px
  - `md`: 768px
  - `lg`: 1024px

- Grid layouts:
  - Mobile: 1 column
  - Tablet: 2 columns
  - Desktop: 3 columns

### Animations
- Smooth transitions on all interactive elements
- Hover effects on cards and buttons
- Scale animations on grid items
- Fade-in for overlays and modals
- Loading spinners for async operations

## Common Tasks

### Connect to Supabase
Replace TODO comments in these files:
1. `/src/app/menu/[slug]/page.tsx` - Fetch restaurant data
2. `/src/app/api/menu/[slug]/route.ts` - Fetch menu items
3. `/src/app/api/register-email/route.ts` - Save customer emails
4. `/src/app/api/ai/parse-menu/route.ts` - Track usage
5. `/src/app/dashboard/menu/ai-capture/page.tsx` - Save parsed items

### Add Google OAuth
1. Set up Google OAuth credentials in your app
2. Implement flow in `EmailGate.tsx` `handleGoogleSignIn` function
3. Handle OAuth callback and user creation

### Configure Email Sending
1. Set up Resend account and API key
2. Uncomment Resend code in `/src/app/api/register-email/route.ts`
3. Create email templates matching your brand

### Test with Real Images
1. Take photos of an actual menu
2. Upload to AI capture page
3. Verify parsing accuracy
4. Adjust AI prompts if needed in `prompts.ts`

## Troubleshooting

### Images Not Loading
- Check placehold.co is accessible
- Verify image URLs in mock data
- Check browser console for CORS errors

### AI API Errors
- Verify API keys are set correctly in .env.local
- Check API key permissions and quotas
- Review error messages in terminal

### Email Not Validating
- Check email regex in `EmailGate.tsx` and `register-email/route.ts`
- Verify email format (user@domain.com)

### localStorage Issues
- Check browser privacy settings
- Test in incognito window
- Clear localStorage: `localStorage.clear()`

## Performance Tips

- Images are optimized with responsive sizes
- Lightbox only loads large images on demand
- API calls use streaming where applicable
- Client components only where needed for interactivity
- Server components for SEO and data fetching

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support with touch-optimized controls

## Next Steps

1. **Connect Supabase database** - Replace all TODO comments
2. **Setup API keys** - Add to .env.local
3. **Test with real data** - Replace mock data with database queries
4. **Configure OAuth** - Setup Google authentication
5. **Deploy** - Deploy to Vercel or your hosting platform

---

For more details, see `IMPLEMENTATION_SUMMARY.md`
