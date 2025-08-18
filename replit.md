# Overview

This is a YouTube video analysis application that uses AI to automatically generate intelligent summaries of YouTube videos. The application extracts video metadata, downloads subtitles, segments the content into logical sections, and provides AI-generated summaries for each segment. Built with React frontend and Express backend, it offers a clean interface for users to input YouTube URLs and receive comprehensive video analysis.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React with Vite**: Modern React application using Vite for fast development and optimized builds
- **ShadCN/UI Components**: Comprehensive UI component library built on Radix UI primitives for consistent design
- **TanStack Query**: Client-side data fetching, caching, and synchronization for API requests
- **Wouter**: Lightweight client-side routing solution
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens and theming
- **TypeScript**: Full type safety across the frontend codebase

## Backend Architecture
- **Express.js**: RESTful API server handling video analysis requests
- **Service Layer Pattern**: Modular services for YouTube metadata extraction, subtitle processing, OpenAI integration, and screenshot generation
- **Background Processing**: Asynchronous video analysis pipeline with status tracking
- **Middleware Integration**: Request logging, error handling, and development tools

## Data Storage Solutions
- **Drizzle ORM**: Type-safe database operations with PostgreSQL dialect
- **Dual Storage Strategy**: In-memory storage for development with PostgreSQL schema for production
- **Neon Database**: Serverless PostgreSQL for scalable data persistence
- **Schema Management**: Structured data models for users, video analyses, subtitles, and summary segments

## AI Integration
- **OpenAI GPT-4o**: Latest model for intelligent video content analysis and summarization
- **Intelligent Segmentation**: AI-powered content division into 4-6 logical sections
- **Multilingual Support**: Chinese and English subtitle processing with fallback mechanisms
- **Context-Aware Summaries**: 150-200 character summaries tailored to video content

## Video Processing Pipeline
- **YouTube Data Extraction**: ytdl-core for metadata, duration, thumbnails, and channel information
- **Subtitle Processing**: Automatic caption extraction with language preference hierarchy
- **Screenshot Generation**: Timestamp-based frame capture using yt-dlp and ffmpeg
- **Real-time Status Updates**: Polling mechanism for analysis progress tracking

# External Dependencies

## Core Services
- **Neon Database**: Serverless PostgreSQL hosting for production data storage
- **OpenAI API**: GPT-4o model access for content analysis and summarization
- **YouTube**: Video metadata and subtitle extraction via ytdl-core library

## Development Tools
- **Replit Integration**: Development environment with runtime error overlay and cartographer plugin
- **Google Fonts**: Custom font loading (Architects Daughter, DM Sans, Fira Code, Geist Mono)

## System Requirements
- **yt-dlp**: YouTube video downloading tool for screenshot extraction
- **ffmpeg**: Video processing for timestamp-based frame capture
- **Node.js**: Runtime environment with ES modules support

## UI Dependencies
- **Radix UI**: Accessible component primitives for dialogs, dropdowns, and form controls
- **Lucide React**: Icon library for consistent visual elements
- **Embla Carousel**: Touch-friendly carousel component for media display