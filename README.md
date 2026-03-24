# NEWS FEEDER BOT Documentation

## Setup Instructions
1. **Clone the Repository**  
   Run the following command to clone the repository:
   ```bash
   git clone https://github.com/yalovaink77-cloud/NEWS_FEEDER_BOT.git
   cd NEWS_FEEDER_BOT
   ```

2. **Install Dependencies**  
   Ensure you have Node.js and npm installed. Run the following command:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**  
   Create a `.env` file in the root directory and add your configuration:
   ```env
   DATABASE_URL=your_database_url
   API_KEY=your_api_key
   ```

4. **Run the Application**  
   Start the application using:
   ```bash
   npm start
   ```

## Database Schema
The database consists of the following tables:

- **Users**  
  - `id`: Primary Key  
  - `username`: String  
  - `password`: String  

- **Articles**  
  - `id`: Primary Key  
  - `title`: String  
  - `content`: Text  
  - `author_id`: Foreign Key (References Users)

- **Comments**  
  - `id`: Primary Key  
  - `article_id`: Foreign Key (References Articles)  
  - `user_id`: Foreign Key (References Users)  
  - `content`: Text  

## Data Sources with Weights
1. **News API** - Weight: 70%  
   - Description: A comprehensive API for various news articles.

2. **Twitter Feed** - Weight: 20%  
   - Description: Fetches latest tweets relevant to the news articles.

3. **RSS Feeds** - Weight: 10%  
   - Description: Collects news from various subscribed RSS feeds.

## ALPET_BOT Integration Guide
1. **Install ALPET_BOT Package**  
   Run the following command:
   ```bash
   npm install alp-bot
   ```

2. **Configuration**  
   In your `.env`, add the following line:
   ```env
   ALPET_BOT_TOKEN=your_alpet_bot_token
   ```

3. **Initialize ALPET_BOT**  
   In your application code, add the following:
   ```javascript
   const AlpBot = require('alp-bot');
   const bot = new AlpBot(process.env.ALPET_BOT_TOKEN);
   ```

4. **Integrate with Your Application**  
   Use the bot to send notifications about new articles:
   ```javascript
   bot.sendMessage('New article published! Check it out.');
   ```