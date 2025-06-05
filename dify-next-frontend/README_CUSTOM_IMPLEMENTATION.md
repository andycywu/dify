# Customized Dify Interface for TPV OBM Testing Assistant

This project is a customized frontend for the Dify API that provides a specialized testing assistant interface for TPV OBM. The implementation removes "Powered by Dify" branding and allows for complete UI/UX customization.

## Features

- **Custom UI/UX**: Fully customizable interface including theme colors, logos, avatars, and chat styles
- **Authentication**: Simple login system to protect sensitive features
- **Voice Input**: Optional voice input for chat interactions
- **Chat History**: Ability to view and manage conversation history
- **Settings Management**: User-configurable settings for customization
- **API Integration**: Direct integration with Dify's API

## Key Components

- **ChatComponent**: Core chat interface with customized styling and functionality
- **Settings**: Configuration interface for customizing the assistant
- **Authentication**: Simple authentication system for controlling access
- **API Client**: Direct integration with Dify API

## Customization Options

- **Theme Colors**: Customize the primary color scheme
- **Logos**: Add your own logos and branding
- **Assistant Avatar**: Personalize the assistant's avatar
- **Welcome Messages**: Set custom welcome messages
- **Voice Settings**: Enable or disable voice input
- **History Management**: Control conversation history features

## API Configuration

For the assistant to function, you need to configure:

1. **API Key**: Your Dify API key
2. **API Base URL**: The base URL for your Dify API instance

These can be configured through the Settings panel.

## Login Controls

The usage information and statistics page is protected by authentication. You must log in to access usage information, ensuring that only authorized users can view analytical data.

## File Structure

- `/components/UI/`: Custom UI components
- `/components/Auth/`: Authentication components
- `/contexts/`: Context providers for state management
- `/hooks/`: Custom hooks for shared functionality
- `/services/`: API client and other services
- `/pages/`: Next.js page routes

## Usage

1. Configure your API key and endpoint in the Settings panel
2. Customize the appearance as needed
3. Start interacting with the assistant

The assistant provides a complete solution for testing agent interactions without any Dify branding, offering a fully customized experience for your organization.
