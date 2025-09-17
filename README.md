# Video Generation SaaS

A modern video generation SaaS platform built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Features

- 🔐 Authentication with Supabase Auth
- 💳 Subscription-based pricing tiers
- 🎬 Video generation and management
- 📊 User dashboard
- 🎨 Modern UI with Tailwind CSS
- 📱 Responsive design
- 🔒 Protected routes and middleware

## Tech Stack

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database & Auth:** Supabase
- **State Management:** React Hooks + Context
- **Deployment:** Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Fill in your Supabase credentials in `.env.local`

3. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key to `.env.local`
   - Run the database migrations (see Database Setup section)

4. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   ├── pricing/           # Pricing page
│   └── profile/           # User profile
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   ├── layout/           # Layout components
│   ├── forms/            # Form components
│   └── video/            # Video-related components
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
│   ├── supabase/        # Supabase client configuration
│   ├── utils/           # General utilities
│   ├── validations/     # Form validation schemas
│   └── constants/       # App constants
├── types/                # TypeScript type definitions
└── context/             # React context providers
```

## Database Setup

Create the following tables in your Supabase database:

### Users Table
```sql
-- Enable RLS
alter table auth.users enable row level security;

-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  subscription_tier text default 'free',
  credits_remaining integer default 5,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up RLS policies
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);
```

### Video Projects Table
```sql
create table public.video_projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  status text default 'draft',
  video_url text,
  thumbnail_url text,
  duration integer,
  settings jsonb not null default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up RLS policies
create policy "Users can view own video projects." on video_projects
  for select using (auth.uid() = user_id);

create policy "Users can insert own video projects." on video_projects
  for insert with check (auth.uid() = user_id);

create policy "Users can update own video projects." on video_projects
  for update using (auth.uid() = user_id);

create policy "Users can delete own video projects." on video_projects
  for delete using (auth.uid() = user_id);
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for server operations | No |
| `STRIPE_PUBLIC_KEY` | Stripe publishable key | No |
| `STRIPE_SECRET_KEY` | Stripe secret key | No |

## Subscription Tiers

- **Free**: 5 videos/month, 720p resolution
- **Pro**: 100 videos/month, 1080p resolution, $29/month
- **Enterprise**: 500 videos/month, 4K resolution, $99/month

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details
